# Disposable loopback test only. No provider credentials or hosted URLs are read.
param([string]$PostgresBin='C:/Program Files/PostgreSQL/18/bin',[string]$NodeExecutable='node')
$ErrorActionPreference = 'Stop'
$repoPath = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$pgBin = $PostgresBin
$runPath = Join-Path (Join-Path $repoPath '.private') ('managed-replay-' + [guid]::NewGuid().ToString('N'))
$clusterPath = Join-Path $runPath 'cluster'
$port = 54329
if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) { throw 'Dedicated replay port is occupied; left unchanged.' }
New-Item -ItemType Directory -Path $runPath | Out-Null
$passwordPath = Join-Path $runPath 'bootstrap-password.txt'
$password = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
Set-Content -LiteralPath $passwordPath -Value $password -Encoding utf8NoBOM
& "$pgBin/initdb.exe" -D $clusterPath --username=vendor_replay --auth=scram-sha-256 --pwfile=$passwordPath --encoding=UTF8 --no-locale *> (Join-Path $runPath 'init.log')
if ($LASTEXITCODE -ne 0) { throw "Isolated initdb failed; local log: $runPath/init.log" }
$started = $false
try {
  & "$pgBin/pg_ctl.exe" -D $clusterPath -l (Join-Path $runPath 'server.log') -o "-h 127.0.0.1 -p $port" -w start
  if ($LASTEXITCODE -ne 0) { throw 'Isolated PostgreSQL start failed.' }
  $started = $true
  $env:PGPASSWORD = $password
  foreach ($name in @('PGSERVICE','PGSERVICEFILE','PGOPTIONS')) { Remove-Item -LiteralPath "Env:$name" -ErrorAction SilentlyContinue }
  $env:PGCONNECT_TIMEOUT = '5'
  $psqlArgs = @('-X','--no-password','-h','127.0.0.1','-p',"$port",'-U','vendor_replay','-d','postgres','-v','ON_ERROR_STOP=1')
  & "$pgBin/psql.exe" @psqlArgs -c "CREATE ROLE managed_migration LOGIN CREATEROLE BYPASSRLS PASSWORD '$password'; GRANT CREATE ON DATABASE postgres TO managed_migration; CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS; GRANT anon,authenticated,service_role TO managed_migration WITH ADMIN TRUE, INHERIT TRUE, SET TRUE;" *> (Join-Path $runPath 'managed-bootstrap.log')
  if ($LASTEXITCODE -ne 0) { throw 'Managed-shaped fixture bootstrap failed.' }
  $psqlArgs = @('-X','--no-password','-h','127.0.0.1','-p',"$port",'-U','managed_migration','-d','postgres','-v','ON_ERROR_STOP=1')
  $migrations = Get-ChildItem -LiteralPath (Join-Path $repoPath 'supabase/migrations') -Filter '*.sql' | Sort-Object Name
  foreach ($file in $migrations) {
    if ($file.Name -eq '20261016043927_virtual_ink_phase1_role_assignments.sql') {
      & "$pgBin/psql.exe" @psqlArgs -c 'ALTER DEFAULT PRIVILEGES GRANT USAGE ON SCHEMAS TO authenticated; ALTER DEFAULT PRIVILEGES GRANT SELECT,INSERT,UPDATE,DELETE ON TABLES TO authenticated; ALTER DEFAULT PRIVILEGES GRANT EXECUTE ON FUNCTIONS TO authenticated;' *> (Join-Path $runPath 'default-grant-fixture.log')
      if ($LASTEXITCODE -ne 0) { throw 'Isolated default-privilege fixture setup failed.' }
    }
    if ($file.Name -eq '20261016053031_virtual_ink_privileged_security.sql') {
      & "$pgBin/psql.exe" @psqlArgs -f (Join-Path $repoPath 'database/tests/security-auth-fixture.sql') *> (Join-Path $runPath 'auth-fixture.log')
      if ($LASTEXITCODE -ne 0) { throw "Local Auth-shaped fixture failed: $runPath" }
    }
    & "$pgBin/psql.exe" @psqlArgs -f $file.FullName *> (Join-Path $runPath ($file.Name + '.log'))
    if ($LASTEXITCODE -ne 0) { throw "Migration replay failed: $($file.Name); log: $runPath" }
  }
  & "$pgBin/psql.exe" @psqlArgs -Atc "SELECT NOT rolsuper AND rolcreaterole AND rolbypassrls FROM pg_roles WHERE rolname=current_user; SELECT NOT pg_has_role(current_user,'virtual_ink_security_owner','USAGE') AND NOT pg_has_role(current_user,'virtual_ink_security_owner','SET');" *> (Join-Path $runPath 'managed-final-permissions.log')
  if ($LASTEXITCODE -ne 0 -or ((Get-Content (Join-Path $runPath 'managed-final-permissions.log')) -join ',') -ne 't,t') { throw 'Managed administrator or membership cleanup assertion failed.' }
  Write-Output 'Passed: all 14 migrations as non-superuser CREATEROLE/BYPASSRLS; temporary owner inheritance and SET rights removed.'
  $psqlArgs = @('-X','--no-password','-h','127.0.0.1','-p',"$port",'-U','vendor_replay','-d','postgres','-v','ON_ERROR_STOP=1')
  foreach ($relative in @('database/tests/phase2.sql','database/tests/provisioning.sql','database/tests/runtime-accounts.sql','database/tests/membership-discovery.sql','database/tests/vendor-onboarding-core.sql','database/tests/phase1-role-assignments.sql')) {
    $name = [IO.Path]::GetFileName($relative)
    & "$pgBin/psql.exe" @psqlArgs -f (Join-Path $repoPath $relative) *> (Join-Path $runPath ($name + '.log'))
    if ($LASTEXITCODE -ne 0) { throw "Vendor replay failed: $relative; log: $runPath/$name.log" }
    Write-Output "Passed: $relative"
  }
  & $NodeExecutable (Join-Path $repoPath 'scripts/privileged-security-db-check.mjs')
  if ($LASTEXITCODE -ne 0) { throw 'Privileged security SQL checks failed.' }
  & "$pgBin/psql.exe" @psqlArgs -Atc "SELECT count(*) FROM virtual_ink.vendor_applications; SELECT count(*) FROM virtual_ink.vendor_profiles;"
} finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  $password = $null
  if ($started) { & "$pgBin/pg_ctl.exe" -D $clusterPath -m fast -w stop }
}

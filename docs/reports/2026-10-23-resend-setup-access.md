# Resend staging setup — access established, domain pending

23 October 2026. Virtual Ink / Shadow Root Security Technologies.

**Setup PARTIAL; email delivery unverified; Phase 1 INCOMPLETE / NO-GO.**
Production remains unchanged. Uchi's staging-only scope and the existing
environment/security controls remain in force.

## What changed

Resend's [official setup instructions](https://resend.com/setup.md) were fetched
and followed for staging app email: Supabase Auth and transactional application
messages. Marketing and inbound mail were not selected. The repository is
Next.js/React with an independent Node backend; it has no existing Resend SDK
or connected Resend sending implementation.

`codex mcp add resend --url https://mcp.resend.com/mcp` added the global Codex MCP
entry. The provider OAuth flow was opened in Shadow Root Chrome and completed;
the CLI returned **Successfully logged in**, exit 0. Credentials were handled by
the OAuth client, not pasted into chat or source. A subsequent `codex mcp get
resend --json` returns an enabled streamable HTTP configuration for the exact
official URL, with no static authorization header or bearer environment binding.
This proves configuration/login, not successful execution of a Resend API tool
through this running session's catalog.

The Skill Installer installed four official guidance packages from
resend/resend-skills: resend, resend-cli, react-email and email-best-practices.
Installation returned exit 0 and all four SKILL.md files exist. They are installed
in the user's Codex skills directory and are available for subsequent turns.
No application dependency, package lockfile, source route, database migration,
service flag or deployed environment was modified.

## Domain and sending status

The signed-in Resend Domains page explicitly shows **No domains yet**. The
operator was asked for the owned staging domain/subdomain and approved sender
name/address. No domain is assumed from earlier planning references. Domain
creation, verified sender, DNS records and domain status are therefore pending.

No domain, DNS record, sending key, template, webhook or contact was created.
No email was sent, and no existing email content or customer list was read.
There is no domain ID, delivery ID, idempotency result, bounce/complaint result
or hosted application-email acceptance to report. Resend OAuth setup access is
separate from the restricted sending key that the application still needs.
Supabase staging SMTP and Vercel Preview email credentials remain unconfigured
by this task; no Supabase or Vercel mutation occurred.

## Verification, failures and security review

The web reader could not display the setup URL's text/markdown response. A direct
HTTPS download succeeded with exit 0; instructions were inspected as external
data within the user's authorized scope. Official OpenAI MCP documentation and
the installed CLI help were checked before configuring the OAuth connection.
The read-only postcheck and skill-file existence check pass.
Setup command UTC start/completion times were not separately captured; this
handover does not claim the timed command evidence required for a release run.

The current agent catalog has no callable Resend tools after this CLI addition.
The existing signed-in browser was used to inspect domain status. OAuth login
was not represented as an application API send or an operational SMTP setup.
Browser telemetry warnings were observed; they did not prevent the verified
login or the visible domain-state check. No claimed delivery result follows.

Potential attack paths reviewed: full-access setup credentials in the app,
public client credentials, accidental production sender/DNS changes, unapproved
recipients, duplicate sends and private file attachments. No credential was
created for application use or exposed, no recipient was used, and no sending
or DNS control was bypassed. Current guards remain unchanged. Future sending
requires domain-scoped sending access, staging recipient restrictions, server-only
execution, idempotency, bounded retries and verified delivery events.

No application build or test suite was rerun because application code and
dependencies are unchanged. The 22 October tests/coverage/build remain historical
and are not restated as fresh results. The report receives local link, privacy,
OOXML structure and fixed-table checks. Word rendering is attempted; missing
LibreOffice/soffice prevents visual page QA. This is a scoped setup/security
review, not a provider/platform/workstation pentest or human acceptance.

## Repository, rollback and next actions

Branch: feature/phase1-staging-readiness. Initial commit:
`0b47c0881d01ae8637aefdf5fb1cce5d37a979bb`. The reporting commit is recorded in
Git history. The user's next-env edit, .agents, .codex, extracted archive and
skills-lock.json remain excluded from the reviewed report files. No push,
application deployment or production change occurred.

No hosted email configuration needs reversal. If the operator later abandons
setup, remove only the newly added resend MCP entry and its OAuth connection;
preserve unrelated MCP entries, credentials and skills. Do not remove the user's
project .codex directory or the previously installed Flutterwave configuration.
No domain or sending key was created that needs cleanup.

- **Uchi:** provide the approved owned staging domain/subdomain and sender,
  then review the exact DNS record changes once prepared. Confirm controlled
  recipient rules privately; never send credentials in chat.
- **Mumba:** after domain selection, create/verify only the staging domain,
  obtain DNS approval, create domain-restricted sending credentials privately,
  configure staging SMTP/server sending and test genuine hosted Auth/application
  flows, duplicate-send handling and signed delivery events.
- **Taizya:** review the accessible branded transactional templates with static
  approved logo, text alternatives, exact variables and staging-only links.
- **Lubasi:** confirm test recipients, support/reply handling and bounce/complaint
  operations; collect actual device and hosted email-link evidence.

Next: approved domain/sender, then exact DNS review and verification. A paid plan,
production sender or production DNS change is not inferred. Authentication and
required physical/service/release gates remain open. No phase is complete.

PHASE 1 BLOCKED — PRODUCTION REMAINS UNCHANGED

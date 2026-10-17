import {assertEnvironmentIsolation,IsolationError} from '../src/backend/setup/environment-isolation.ts';
try {
 const result=assertEnvironmentIsolation(process.env);
 console.log(JSON.stringify({check:'environment_isolation',status:'pass',environment:result.environment}));
}catch(error){
 console.error(JSON.stringify({check:'environment_isolation',status:'fail',code:error instanceof IsolationError?error.code:'ISOLATION_CHECK_UNAVAILABLE'}));
 process.exitCode=1;
}

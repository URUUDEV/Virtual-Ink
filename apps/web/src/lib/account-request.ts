export type AccountAction = 'login' | 'register' | 'password-reset' | 'password-update' | 'logout';
const expected = {login:'signed_in',register:'confirmation_required','password-reset':'if_account_exists','password-update':'password_updated',logout:'signed_out'} as const;

/** UI transport only. The existing server remains the identity/authorization boundary. */
export async function accountRequest(action:AccountAction,input:Record<string,unknown>,signal:AbortSignal) {
  const response=await fetch(`/api/auth/${action}`,{method:'POST',credentials:'same-origin',cache:'no-store',redirect:'error',signal,
    headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});
  if(!response.ok)return {ok:false,status:response.status};
  const result=await response.json();
  if(result?.data?.state!==expected[action])throw new Error('Unconfirmed account response.');
  return {ok:true,status:response.status};
}

export function accountError(status:number,action:AccountAction) {
  if(status===429)return 'Too many attempts. Wait before trying again.';
  if(status===403)return 'This action is not allowed in this session. Return to your account or sign in again.';
  if(status===401)return action==='password-update'?'This recovery session is no longer valid. Request a new link.':'Email or password is incorrect, or your email still needs confirmation.';
  if(status===400)return action==='login'?'Check your email address and password.':action==='password-reset'?'Check your email address.':'Check your details. New passwords need 12–128 characters.';
  return 'Account access is temporarily unavailable. Please try again later.';
}

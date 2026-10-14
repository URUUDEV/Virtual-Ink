import test from 'node:test';
import assert from 'node:assert/strict';
import { blankVendorProfile } from '../src/shared/vendor-onboarding.ts';
import { onboardingPagination, validateVendorProfile, vendorSlug, writePayload } from '../src/backend/vendors/validation.ts';
const operationId='91111111-1111-4111-8111-111111111111';
const valid=()=>({...blankVendorProfile,businessName:'Synthetic Studio',contactName:'Test Partner',email:'partner@example.invalid',country:'Demo country',city:'Demo area',slug:'synthetic-studio',summary:'Synthetic apparel service for local probes.',services:['apparel'],handoff:'collection' as const,typicalWorkingDays:5});
test('persistent vendor profiles allow incomplete drafts but require a complete, bounded submission',()=>{
  assert.deepEqual(validateVendorProfile(blankVendorProfile),blankVendorProfile);
  assert.throws(()=>validateVendorProfile(blankVendorProfile,true));
  assert.deepEqual(validateVendorProfile(valid(),true),valid());
  assert.equal(validateVendorProfile({...valid(),businessName:'  Synthetic Studio  '}).businessName,'Synthetic Studio');
  for(const change of [{role:'VendorOwner'},{ownerId:operationId},{status:'approved'},{businessName:'<script>synthetic</script>'},{notes:'x'.repeat(501)},{email:'unfinished'},{services:['admin']},{services:['apparel','apparel']},{typicalWorkingDays:91},{typicalWorkingDays:'5'},{handoff:{toString:'collection'}}]) assert.throws(()=>validateVendorProfile({...valid(),...change},true));
});
test('write contracts never accept client identity, tenant, payment or review-authority selectors',()=>{
  const create={operationId,profile:valid()}; assert.equal(writePayload(create,'create').operationId,operationId);
  for(const key of ['role','ownerId','tenantId','approved','fundsHeld','requestId']) assert.throws(()=>writePayload({...create,[key]:operationId},'create'));
  for(const expectedVersion of [0,1.5,NaN,'1',null,1_000_001]) assert.throws(()=>writePayload({operationId,expectedVersion,consent:true},'submit'));
  assert.throws(()=>writePayload({operationId,expectedVersion:1,consent:false},'submit'));
});
test('approval requires every verification check and an opaque evidence reference',()=>{
  const decision={operationId,expectedVersion:2,decision:'approve',feedback:'Synthetic checks recorded.',checks:{ownerIdentity:true,businessEvidence:true,serviceCapabilities:true},evidenceReference:operationId};
  assert.equal(writePayload(decision,'decision').decision,'approve');
  for(const change of [{checks:{...decision.checks,businessEvidence:false}},{checks:{...decision.checks,role:'admin'}},{evidenceReference:null},{feedback:''},{decision:'payout'}]) assert.throws(()=>writePayload({...decision,...change},'decision'));
  assert.equal(writePayload({...decision,decision:'reject',checks:{ownerIdentity:false,businessEvidence:false,serviceCapabilities:false},evidenceReference:null},'decision').decision,'reject');
});
test('storefront names and pagination are bounded and reject reserved routes and selector tricks',()=>{
  for(const slug of ['join','admin','../other','https://example.invalid','x','UPPER','ends-']) assert.throws(()=>vendorSlug(slug));
  assert.equal(vendorSlug('synthetic-studio'),'synthetic-studio');
  assert.deepEqual(onboardingPagination(new URLSearchParams(),true),{limit:20,cursor:null,status:'submitted'});
  for(const query of ['limit=51','limit=0','limit=20&limit=20','ownerId=synthetic','cursor=../../etc','status=payout']) assert.throws(()=>onboardingPagination(new URLSearchParams(query),true));
});

test('explicit empty pagination selectors fail before database dispatch',()=>{
  for (const query of ['cursor=', 'status=', 'status=submitted&cursor=']) {
    assert.throws(() => onboardingPagination(new URLSearchParams(query), true));
  }
  assert.throws(() => onboardingPagination(new URLSearchParams('cursor=')));
  assert.deepEqual(onboardingPagination(new URLSearchParams()), {limit:20,cursor:null});
});

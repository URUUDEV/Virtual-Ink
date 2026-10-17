import test from 'node:test';
import assert from 'node:assert/strict';
import {BRAND,BRAND_MOTION} from '../src/shared/brand-tokens.ts';
test('supplied brand tokens and six-second timing remain exact',()=>{
  assert.deepEqual(Object.values(BRAND),['#00C2FF','#007BFF','#7A3BFF','#FF2D8B','#0B0F17','#0E1424','#FFFFFF']);
  assert.deepEqual(BRAND_MOTION,{formation:1.2,rotationStart:2.8,rotationEnd:4.5,reveal:4.6,complete:6,particles:240,idleSeconds:10});
  assert.ok(Object.isFrozen(BRAND)&&Object.isFrozen(BRAND_MOTION));
});

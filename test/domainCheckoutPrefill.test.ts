import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { splitRealName } from '../src/components/Build/AppAddress/checkout/model';

test('a profile real name becomes registrant first and last name', () => {
  assert.deepEqual(splitRealName('Mikey Lee'), { firstName: 'Mikey', lastName: 'Lee' });
  assert.deepEqual(splitRealName('  Mary Ann   Smith '), { firstName: 'Mary Ann', lastName: 'Smith' });
  assert.deepEqual(splitRealName('김민아'), { firstName: '민아', lastName: '김' });
  assert.deepEqual(splitRealName('김 민아'), { firstName: '민아', lastName: '김' });
  assert.deepEqual(splitRealName('남궁민수'), { firstName: '궁민수', lastName: '남' });
  assert.deepEqual(splitRealName('Cher'), { firstName: 'Cher', lastName: '' });
  assert.deepEqual(splitRealName(''), { firstName: '', lastName: '' });
});

test('only the adult checkout prefills; the parent page never does', () => {
  const flow = readFileSync(new URL('../src/components/Build/AppAddress/DomainCheckoutPage.tsx', import.meta.url), 'utf8');
  assert.match(flow, /v\.myState\.realName/);
  assert.match(flow, /v\.myState\.verifiedEmail/);
  const parent = readFileSync(new URL('../src/containers/DomainParentConsent/ParentConsentView.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(parent, /realName|verifiedEmail|splitRealName/);
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { splitRealName } from '../src/components/Build/AppAddress/checkout/model';

test('a profile real name becomes registrant first and last name', () => {
  assert.deepEqual(splitRealName('Mikey Lee'), { firstName: 'Mikey', lastName: 'Lee' });
  assert.deepEqual(splitRealName('  Mary Ann   Smith '), { firstName: 'Mary Ann', lastName: 'Smith' });
  assert.deepEqual(splitRealName('김민아'), { firstName: '민아', lastName: '김' });
  assert.deepEqual(splitRealName('김 민아'), { firstName: '민아', lastName: '김' });
  assert.deepEqual(splitRealName('남궁민수'), { firstName: '민수', lastName: '남궁' });
  assert.deepEqual(splitRealName('황보지훈'), { firstName: '지훈', lastName: '황보' });
  assert.deepEqual(splitRealName('제갈공명'), { firstName: '공명', lastName: '제갈' });
  assert.deepEqual(splitRealName('선우재덕'), { firstName: '재덕', lastName: '선우' });
  // three syllables: one-syllable family name (황 + 보람, 선 + 우진)
  assert.deepEqual(splitRealName('황보람'), { firstName: '보람', lastName: '황' });
  assert.deepEqual(splitRealName('선우진'), { firstName: '우진', lastName: '선' });
  // four syllables without a compound family name
  assert.deepEqual(splitRealName('김수한무'), { firstName: '수한무', lastName: '김' });
  assert.deepEqual(splitRealName('남궁 민수'), { firstName: '민수', lastName: '남궁' });
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

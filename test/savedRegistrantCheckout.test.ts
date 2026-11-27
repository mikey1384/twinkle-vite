import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  emptyOwnerDetails,
  hasTypedOwnerDetails,
  normalizeOwnerDetails,
  ownerDetailsProblem
} from '../src/components/Build/AppAddress/checkout/model';
import { ADDRESS_TEXT } from '../src/components/Build/AppAddress/text';

test('normalizeOwnerDetails picks and stringifies the 9 fields, strips extras, and preserves country fallback', () => {
  const withEmptyCountry = normalizeOwnerDetails(
    {
      firstName: 'Mikey',
      lastName: 'Lee',
      email: 'mikey@example.com',
      phone: '+821012345678',
      address1: '1 Sejong-daero',
      city: 'Seoul',
      state: 'Seoul',
      zip: '04524',
      country: '',
      savedAt: 1700000000,
      userId: 41
    },
    'KR'
  );
  assert.equal(withEmptyCountry.country, 'KR');
  assert.deepEqual(Object.keys(withEmptyCountry).sort(), [
    'address1',
    'city',
    'country',
    'email',
    'firstName',
    'lastName',
    'phone',
    'state',
    'zip'
  ]);
  assert.equal(ownerDetailsProblem(ADDRESS_TEXT.en, withEmptyCountry), '');

  const withNullCountry = normalizeOwnerDetails({ country: null }, 'US');
  assert.equal(withNullCountry.country, 'US');

  const withWhitespaceCountry = normalizeOwnerDetails({ country: '  ' }, 'JP');
  assert.equal(withWhitespaceCountry.country, 'JP');

  const withSavedCountry = normalizeOwnerDetails({ country: ' US ' }, 'KR');
  assert.equal(withSavedCountry.country, 'US');

  // Nullable / missing fields stringify cleanly without crashing validation.
  const partialNullable = normalizeOwnerDetails(
    {
      firstName: 'Mikey',
      lastName: null,
      email: undefined,
      phone: '+821012345678',
      address1: '1 Sejong-daero',
      city: 'Seoul',
      state: null,
      zip: 4524,
      country: 'KR'
    },
    'US'
  );
  assert.equal(partialNullable.lastName, '');
  assert.equal(partialNullable.email, '');
  assert.equal(partialNullable.state, '');
  assert.equal(partialNullable.zip, '4524');
  assert.equal(ownerDetailsProblem(ADDRESS_TEXT.en, partialNullable), ADDRESS_TEXT.en.fillAll);

  assert.deepEqual(normalizeOwnerDetails(null, 'CA'), emptyOwnerDetails('CA'));
});

test('hasTypedOwnerDetails detects every user-typed owner field including email, phone, state, and raw phone draft', () => {
  const empty = emptyOwnerDetails('KR');
  assert.equal(hasTypedOwnerDetails(empty), false);
  assert.equal(hasTypedOwnerDetails(empty, '   '), false);

  for (const field of ['firstName', 'lastName', 'email', 'phone', 'address1', 'city', 'state', 'zip'] as const) {
    assert.equal(
      hasTypedOwnerDetails({ ...empty, [field]: 'x' }),
      true,
      `expected typed detection for ${field}`
    );
  }
  // Partial phone digits before E.164 is valid still count as typed input.
  assert.equal(hasTypedOwnerDetails(empty, '010'), true);
});

test('ADDRESS_TEXT defines pending forgetting label in both English and Korean', () => {
  assert.ok(ADDRESS_TEXT.en.forgetting.length > 0);
  assert.ok(ADDRESS_TEXT.ko.forgetting.length > 0);
});

test('AppAddress avoids stale saved-registrant overwrites and Forget/Pay races', () => {
  const indexSource = readFileSync(
    new URL('../src/components/Build/AppAddress/index.tsx', import.meta.url),
    'utf8'
  );

  // Finding 1: live refs + full typed check + savedDetailsRef guard inside loadSavedRegistrant().then()
  assert.match(indexSource, /ownerRef\.current\s*=\s*owner/);
  assert.match(indexSource, /ownerPhoneRef\.current\s*=\s*ownerPhone/);
  assert.match(indexSource, /savedDetailsRef\.current\s*=\s*savedDetails/);
  assert.match(indexSource, /hasTypedOwnerDetails\(currentOwner,\s*ownerPhoneRef\.current\.national\)/);
  assert.match(indexSource, /savedDetailsRef\.current\s*!==\s*'none'/);
  assert.match(indexSource, /normalizeOwnerDetails\(saved,\s*currentOwner\.country\)/);
  assert.doesNotMatch(indexSource, /\.\.\.saved\b/);

  // Findings 2 & 3: mutual in-flight locking between forgetOrSkipSaved and payAsOwner, clearing ownerProblem, and forwarding forgetting state
  assert.match(indexSource, /async function forgetOrSkipSaved\(\)[\s\S]*?if\s*\(inFlightRef\.current\.pay\s*\|\|\s*inFlightRef\.current\.forget\)\s*return;/);
  assert.match(indexSource, /async function forgetOrSkipSaved\(\)[\s\S]*?setOwnerProblem\(''\)/);
  assert.match(indexSource, /claimRequest\('forget'\)/);
  assert.match(indexSource, /async function payAsOwner\([^)]*\)\s*\{[\s\S]*?if\s*\(inFlightRef\.current\.forget\)\s*return;/);
  assert.match(indexSource, /saveDetails:\s*savedDetailsRef\.current\s*!==\s*'forgotten'/);
  assert.match(indexSource, /<OwnerDetailsView[\s\S]*?\s+forgetting=\{forgettingSaved\}/);
});

test('OwnerDetailsView handles forgetting lock, accessible status/focus, mobile tap target, and late startPage', () => {
  const stepsSource = readFileSync(
    new URL('../src/components/Build/AppAddress/checkout/steps.tsx', import.meta.url),
    'utf8'
  );

  // Finding 2: payment disabled during forgetting; Forget/Don't save disabled during busy or forgetting
  assert.match(stepsSource, /const canPay\s*=\s*!missing\s*&&\s*agreed\s*&&\s*!busy\s*&&\s*!forgetting;/);
  assert.match(stepsSource, /<button[\s\S]*?\s+ref=\{savedChoiceButtonRef\}[\s\S]*?\s+disabled=\{busy\s*\|\|\s*forgetting\}[\s\S]*?\s+aria-busy=\{forgetting\s*\|\|\s*undefined\}/);

  // Finding 4 / round-2 P3: live region status only on the status text span (not wrapping the button, no redundant aria-live), focus recovery + 44px coarse-pointer touch target
  const savedNoteParagraph = stepsSource.match(/<p\b[^>]*\s+ref=\{savedNoteRef\}[^>]*>/);
  assert.ok(savedNoteParagraph, 'savedNoteRef paragraph should exist');
  assert.match(savedNoteParagraph[0], /\s+tabIndex=\{-1\}/);
  assert.match(savedNoteParagraph[0], /\s+className=\{savedNoteClass\}/);
  assert.doesNotMatch(savedNoteParagraph[0], /\brole="status"/);
  assert.doesNotMatch(savedNoteParagraph[0], /\baria-live=/);
  assert.match(
    stepsSource,
    /<p\b[^>]*\s+ref=\{savedNoteRef\}[^>]*>\s*<span\s+role="status">[^<]*<\/span>[\s\S]*?<button[\s\S]*?\s+ref=\{savedChoiceButtonRef\}/
  );
  assert.doesNotMatch(stepsSource, /<span\s+role="status"[^>]*aria-live=/);
  assert.match(stepsSource, /savedNoteRef\.current\?\.focus\(\{\s*preventScroll:\s*true\s*\}\)/);
  assert.match(stepsSource, /const savedNoteClass\s*=\s*css`[\s\S]*?@media\s*\(pointer:\s*coarse\)\s*\{[\s\S]*?min-height:\s*44px;/);

  // Finding 5: late-arriving saved details advance page 0 -> 3 once without overriding user interaction
  assert.match(stepsSource, /!autoJumpedRef\.current\s*&&\s*!userInteractedRef\.current\s*&&\s*page\s*===\s*0\s*&&\s*startPage\s*===\s*3/);
});

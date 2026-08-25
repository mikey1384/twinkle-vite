import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  getCanonicalDeletedProfilePicture,
  getCanonicalProfileGreeting,
  getCanonicalProfilePictureState,
  getCanonicalProfilePictureUrl,
  getCanonicalProfileStatus,
  getCanonicalProfileTheme
} from '../src/helpers/profileCanonicalState';

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8');
}

const picturesSource = readSource(
  '../src/containers/Profile/Body/Home/Pictures/index.tsx'
);
const profileSource = readSource('../src/containers/Profile/index.tsx');
const coverSource = readSource('../src/containers/Profile/Cover.tsx');
const imageEditSource = readSource(
  '../src/components/Modals/ImageEditModal.tsx'
);
const userDetailsSource = readSource('../src/components/UserDetails/index.tsx');
const addPicturesSource = readSource(
  '../src/containers/Profile/Body/Home/Pictures/AddPictureModal/index.tsx'
);

test('profile mutations accept complete canonical server payloads', () => {
  assert.deepEqual(
    getCanonicalProfilePictureState({ userId: 7, pictures: [{ id: 3 }] }),
    { userId: 7, pictures: [{ id: 3 }] }
  );
  assert.deepEqual(
    getCanonicalDeletedProfilePicture({
      userId: 7,
      deletedPictureId: 3
    }),
    { userId: 7, pictureId: 3 }
  );
  assert.deepEqual(
    getCanonicalProfileGreeting({ userId: 7, greeting: 'Hello' }),
    { userId: 7, greeting: 'Hello' }
  );
  assert.deepEqual(
    getCanonicalProfileStatus({
      userId: 7,
      statusMsg: null,
      statusColor: null
    }),
    { userId: 7, statusMsg: null, statusColor: null }
  );
  assert.deepEqual(
    getCanonicalProfileTheme({ userId: 7, profileTheme: 'purple' }),
    { userId: 7, profileTheme: 'purple' }
  );
  assert.deepEqual(
    getCanonicalProfilePictureUrl({
      userId: 7,
      profilePicUrl: '/profile/7/avatar.jpg'
    }),
    { userId: 7, profilePicUrl: '/profile/7/avatar.jpg' }
  );
});

test('profile mutations reject missing, malformed, or unconfirmed state', () => {
  for (const payload of [null, {}, { userId: '7', pictures: [] }]) {
    assert.throws(() => getCanonicalProfilePictureState(payload), /canonical/);
  }
  for (const payload of [
    { userId: 7, deletedPictureId: null },
    { userId: 7, deletedPictureId: '3' },
    { userId: 7, deletedPictureId: 0 }
  ]) {
    assert.throws(
      () => getCanonicalDeletedProfilePicture(payload),
      /canonical deletion/
    );
  }
  assert.throws(
    () => getCanonicalProfileGreeting({ userId: 7 }),
    /canonical greeting/
  );
  assert.throws(
    () => getCanonicalProfileStatus({ userId: 7, statusMsg: null }),
    /canonical status/
  );
  assert.throws(
    () => getCanonicalProfileTheme({ userId: 7, profileTheme: '' }),
    /canonical theme/
  );
  assert.throws(
    () => getCanonicalProfilePictureUrl({ userId: 7 }),
    /canonical profile picture/
  );
});

test('profile UI updates shared state only from canonical responses', () => {
  assert.match(picturesSource, /getCanonicalProfilePictureState\(data\)/);
  assert.doesNotMatch(picturesSource, /pictures: remainingPictures/);
  assert.doesNotMatch(picturesSource, /objectify\(pictures\)/);

  assert.match(profileSource, /getCanonicalProfileTheme\(data\)/);
  assert.doesNotMatch(
    profileSource,
    /newState: \{ profileTheme: selectedTheme \}/
  );

  assert.match(coverSource, /getCanonicalProfilePictureUrl\(data\)/);
  assert.doesNotMatch(coverSource, /`\/profile\/\$\{filePath\}`/);
  assert.match(imageEditSource, /await onEditDone\(data\)/);
  assert.match(addPicturesSource, /const confirmed = await onConfirm/);
  assert.match(addPicturesSource, /loading=\{submitting\}/);
  assert.match(addPicturesSource, /if \(confirmed\)[\s\S]*?onHide\(\)/);

  assert.equal(
    userDetailsSource.match(/getCanonicalProfileStatus\(data\)/g)?.length,
    2
  );
  assert.doesNotMatch(userDetailsSource, /removeStatusMsg\(profile\.id\)/);
});

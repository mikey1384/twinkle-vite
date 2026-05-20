import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function readSource(path) {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

const profilePicSource = readSource('../src/components/ProfilePic/index.tsx');
const headingSource = readSource('../src/components/ContentPanel/Heading/index.tsx');
const headingTextSource = readSource(
  '../src/components/ContentPanel/Heading/Text.tsx'
);

assert.match(profilePicSource, /preferProvidedProfilePicUrl\?: boolean/);
assert.match(
  profilePicSource,
  /if \(preferProvidedProfilePicUrl && profilePicUrl\) \{[\s\S]*return profilePicUrl;[\s\S]*\}/
);
assert.match(
  headingSource,
  /preferProvidedProfilePicUrl=\{Boolean\(displayedFeedActivityType\)\}/
);
assert.match(
  headingTextSource,
  /renderCompactUser\(feedActivityType \? feedUploader \|\| uploader : uploader\)/
);

console.log('Home feed actor profile picture verifier passed.');

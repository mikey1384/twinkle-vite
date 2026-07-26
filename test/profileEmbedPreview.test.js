import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

const userEmbedPreviewSource = readSource(
  'src/components/Texts/RichText/Markdown/EmbeddedComponent/InternalComponent/UserComponent/DefaultComponent.tsx'
);
// The embed card markup was extracted out of DefaultComponent into this shared
// component, and its class prefix went from compact-profile-embed__ to
// profile-embed-card__. The guarded content is unchanged, so the assertions
// follow it here rather than pinning the old inline shape.
const profileEmbedCardSource = readSource(
  'src/components/ProfileEmbedCard/index.tsx'
);

assert.match(userEmbedPreviewSource, /import UserDetails/);
assert.match(userEmbedPreviewSource, /import ProfileEmbedCard/);
assert.match(userEmbedPreviewSource, /<ProfileEmbedCard/);

assert.match(profileEmbedCardSource, /import ProfilePic/);
assert.match(profileEmbedCardSource, /import UserTitle/);
assert.match(profileEmbedCardSource, /import StatusMsg/);
assert.match(profileEmbedCardSource, /import RichText/);
assert.match(profileEmbedCardSource, /profile-embed-card__avatar/);
assert.match(profileEmbedCardSource, /profile-embed-card__username/);
assert.match(profileEmbedCardSource, /profile-embed-card__title-row/);
assert.match(profileEmbedCardSource, /profile-embed-card__bio/);
assert.match(profileEmbedCardSource, /StatusMsg[\s\S]*statusColor={statusColor}/);
assert.match(profileEmbedCardSource, /getProfileBioRows\(profile\)/);
assert.doesNotMatch(userEmbedPreviewSource, /<span>Profile<\/span>/);

console.log('Profile embed preview guard passed.');

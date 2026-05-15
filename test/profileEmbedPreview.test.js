import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function readSource(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

const userEmbedPreviewSource = readSource(
  'src/components/Texts/RichText/Markdown/EmbeddedComponent/InternalComponent/UserComponent/DefaultComponent.tsx'
);

assert.match(userEmbedPreviewSource, /import UserDetails/);
assert.match(userEmbedPreviewSource, /import ProfilePic/);
assert.match(userEmbedPreviewSource, /import UserTitle/);
assert.match(userEmbedPreviewSource, /import StatusMsg/);
assert.match(userEmbedPreviewSource, /import RichText/);
assert.match(userEmbedPreviewSource, /compact-profile-embed__avatar-panel/);
assert.match(userEmbedPreviewSource, /compact-profile-embed__username/);
assert.match(userEmbedPreviewSource, /compact-profile-embed__title-row/);
assert.match(userEmbedPreviewSource, /compact-profile-embed__bio/);
assert.match(userEmbedPreviewSource, /StatusMsg[\s\S]*statusColor={statusColor}/);
assert.match(userEmbedPreviewSource, /getProfileBioRows\(profile\)/);
assert.doesNotMatch(userEmbedPreviewSource, /<span>Profile<\/span>/);

console.log('Profile embed preview guard passed.');

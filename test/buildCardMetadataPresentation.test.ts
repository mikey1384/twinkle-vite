import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

function readSource(path: string) {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

const wideCardSource = readSource(
  '../src/components/Build/Cards/BuildWideCard.tsx'
);
const projectListItemSource = readSource(
  '../src/components/Build/ProjectListItem/index.tsx'
);
const richTextEmbedSource = readSource(
  '../src/components/Texts/RichText/Markdown/EmbeddedComponent/InternalComponent/MainContentComponent.tsx'
);
const contentBuildDetailsSource = readSource(
  '../src/components/ContentListItem/ContentDetails/BuildDetails.tsx'
);
const profileBuildsSource = readSource(
  '../src/containers/Profile/Body/Home/Builds/index.tsx'
);

test('shared Lumine cards use state-neutral attribution and one update date', () => {
  assert.match(wideCardSource, /\n\s+By\{' '\}/);
  assert.doesNotMatch(wideCardSource, /Published by/);
  assert.match(
    wideCardSource,
    /Updated \{formatRelativeTime\(displayUpdatedAt\)\}/
  );
  assert.doesNotMatch(
    wideCardSource,
    /Published \{formatRelativeTime\(build\.publishedAt\)\}/
  );
});

test('timestamp scope is explicit and public cards use release recency', () => {
  assert.match(
    wideCardSource,
    /updatedAtSource: BuildCardUpdatedAtSource;/
  );
  assert.match(
    projectListItemSource,
    /updatedAtSource: BuildCardUpdatedAtSource;/
  );
  assert.match(
    richTextEmbedSource,
    /updatedAtSource=\{build\?\.isPublic \? 'publicVersion' : 'workspace'\}/
  );
  assert.match(
    contentBuildDetailsSource,
    /updatedAtSource=\{isPublic \? 'publicVersion' : 'workspace'\}/
  );
  assert.match(profileBuildsSource, /updatedAtSource="publicVersion"/);
});

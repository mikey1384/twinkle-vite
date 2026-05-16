import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(
  new URL(
    '../src/containers/Home/Stories/FeedCard/Body/styles/targetPreviewStyles.ts',
    import.meta.url
  ),
  'utf8'
);

assert.match(
  source,
  /\.home-feed-card__target-mission,[\s\S]*\.home-feed-card__target-achievement \{[\s\S]*border: 0;[\s\S]*background: #fff;/
);
assert.match(
  source,
  /\.home-feed-card__target-preview \.home-feed-card__ai-story-preview--target \{[\s\S]*border: 0;[\s\S]*border-radius: 0;/
);
assert.doesNotMatch(
  source,
  /\.home-feed-card__target-preview \.home-feed-card__ai-story-preview--target \{[\s\S]*border-color: var\(--home-feed-ai-story-color-soft\);/
);

console.log('Home feed target border verifier passed.');

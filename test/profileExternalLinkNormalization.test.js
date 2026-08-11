import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const quickLinksSource = readFileSync(
  new URL('../src/components/ProfilePanel/QuickLinks.tsx', import.meta.url),
  'utf8'
);
const basicInfosSource = readFileSync(
  new URL(
    '../src/containers/Profile/Body/Home/Intro/BasicInfos/index.tsx',
    import.meta.url
  ),
  'utf8'
);
const stringHelpersSource = readFileSync(
  new URL('../src/helpers/stringHelpers.tsx', import.meta.url),
  'utf8'
);

assert.match(
  quickLinksSource,
  /window\.open\(processedURL\(url\), '_blank', 'noopener,noreferrer'\)/
);
assert.match(basicInfosSource, /href=\{processedURL\(youtubeUrl\)\}/);
assert.match(basicInfosSource, /href=\{processedURL\(website\)\}/);
assert.match(
  stringHelpersSource,
  /export function processedURL\(url: string\): string \{[\s\S]*?if \(!url\.includes\(':\/\/'\)\) \{[\s\S]*?url = 'http:\/\/' \+ url;/
);

console.log('Profile external link normalization guard passed.');

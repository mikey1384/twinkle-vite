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
  /const externalUrl = processedURL\(url\);[\s\S]*?if \(!externalUrl\) return;[\s\S]*?window\.open\(externalUrl, '_blank', 'noopener,noreferrer'\)/
);
assert.match(basicInfosSource, /href=\{processedURL\(youtubeUrl\)\}/);
assert.match(basicInfosSource, /href=\{processedURL\(website\)\}/);
assert.match(
  stringHelpersSource,
  /export function processedURL\(url: string\): string \{[\s\S]*?new URL\(normalized\)\.protocol\.toLowerCase\(\)[\s\S]*?protocol === 'http:'[\s\S]*?protocol === 'https:'[\s\S]*?protocol === 'ftp:'[\s\S]*?return '';/
);
assert.doesNotMatch(stringHelpersSource, /return candidate;/);

const processedURLSource = stringHelpersSource.match(
  /export function processedURL\(url: string\): string \{[\s\S]*?\n\}\n\nexport function processInternalLink/
)?.[0];
assert.ok(processedURLSource);
const processedURL = new Function(
  `${processedURLSource
    .replace('export function processedURL(url: string): string', 'function processedURL(url)')
    .replace('\n\nexport function processInternalLink', '')}\nreturn processedURL;`
)();
assert.equal(processedURL('example.com/path'), 'http://example.com/path');
assert.equal(processedURL('https://example.com/path'), 'https://example.com/path');
assert.equal(processedURL('ftp://example.com/file'), 'ftp://example.com/file');
assert.equal(processedURL('javascript://%0Aalert(1)'), '');
assert.equal(processedURL('javascript:alert(1)'), '');
assert.equal(processedURL('data:text/html,unsafe'), '');
assert.equal(processedURL('   '), '');

console.log('Profile external link normalization guard passed.');

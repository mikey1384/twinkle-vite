import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildLumineHtml } from '../scripts/hostPages.mjs';

const indexHtml = readFileSync(
  new URL('../index.html', import.meta.url),
  'utf8'
);
const vercelConfig = JSON.parse(
  readFileSync(new URL('../vercel.json', import.meta.url), 'utf8')
);

function metaContent(html: string, attr: string, key: string) {
  const match = html.match(
    new RegExp(`<meta ${attr}="${key}" content="([^"]*)" />`)
  );
  return match?.[1];
}

test('Twinkle share tags use absolute URLs and a large card', () => {
  const image = metaContent(indexHtml, 'property', 'og:image');
  assert.match(image || '', /^https:\/\/www\.twin-kle\.com\/.+\.png$/);
  assert.equal(
    metaContent(indexHtml, 'name', 'twitter:card'),
    'summary_large_image'
  );
  assert.equal(metaContent(indexHtml, 'property', 'og:url'), undefined);
});

test('lumine.html carries only Lumine branding in its share tags', () => {
  const lumineHtml = buildLumineHtml(indexHtml);
  const start = lumineHtml.indexOf('<meta name="description"');
  const shareBlock = lumineHtml.slice(start, lumineHtml.indexOf('<!--', start));
  assert.doesNotMatch(shareBlock, /Twinkle|twin-kle/);
  assert.equal(metaContent(lumineHtml, 'property', 'og:title'), 'Lumine');
  assert.match(
    metaContent(lumineHtml, 'property', 'og:image') || '',
    /^https:\/\/www\.lumine\.network\/.+\.png$/
  );
  assert.match(lumineHtml, /<title>Lumine<\/title>/);
  assert.match(lumineHtml, /href="\/lumine-favicon\.svg"/);
  assert.match(lumineHtml, /href="\/lumine-manifest\.json"/);
  // Everything outside the head swap (entry scripts, analytics) is unchanged.
  assert.equal(
    lumineHtml.slice(lumineHtml.indexOf('</head>')),
    indexHtml.slice(indexHtml.indexOf('</head>'))
  );
});

test('each host is rewritten to its own page, Lumine first', () => {
  const rewrites = vercelConfig.rewrites.filter((rewrite: any) =>
    String(rewrite.destination).endsWith('.html')
  );
  assert.deepEqual(
    rewrites.map((rewrite: any) => rewrite.destination),
    ['/lumine.html', '/twinkle.html']
  );
  const hostPattern = new RegExp(rewrites[0].has[0].value);
  assert.ok(hostPattern.test('www.lumine.network'));
  assert.ok(hostPattern.test('lumine.network'));
  assert.ok(!hostPattern.test('www.twin-kle.com'));
  assert.ok(!hostPattern.test('preview.lumine.app'));
});

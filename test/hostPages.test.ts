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

test('only link-preview crawlers are sent to the share-page API', () => {
  const crawlerRules = vercelConfig.rewrites.filter((rewrite: any) =>
    String(rewrite.destination).includes('/share-page/')
  );
  assert.deepEqual(
    crawlerRules.map((rewrite: any) => rewrite.destination),
    [
      'https://api.twinkle.network/share-page/$1?brand=lumine',
      'https://api.twinkle.network/share-page/$1?brand=twinkle'
    ]
  );
  // They must come before the page rewrites, which would otherwise win.
  const firstPageRule = vercelConfig.rewrites.findIndex((rewrite: any) =>
    String(rewrite.destination).endsWith('.html')
  );
  for (const rule of crawlerRules) {
    assert.ok(vercelConfig.rewrites.indexOf(rule) < firstPageRule);
  }
  const userAgent = new RegExp(
    crawlerRules[1].has.find((h: any) => h.type === 'header').value
  );
  for (const crawler of [
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'Twitterbot/1.0',
    'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
    'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
    'facebookexternalhit/1.1;kakaotalk-scrap/1.0;',
    'WhatsApp/2.23.20.0 A',
    'TelegramBot (like TwitterBot)'
  ]) {
    assert.ok(userAgent.test(crawler), crawler);
  }
  for (const person of [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/480.0]',
    'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36 KAKAOTALK 10.8.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
  ]) {
    assert.ok(!userAgent.test(person), person);
  }
});

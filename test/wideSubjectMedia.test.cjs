const test = require('node:test');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const path = require('node:path');
const esbuild = require('esbuild');

const { resolveWideSubjectMedia } = loadTypeScriptModule(
  path.resolve(__dirname, '../src/components/Subjects/wideSubjectMedia.ts')
).exports;
const { getSubjectTargetDescriptionEmbeds } = loadTypeScriptModule(
  path.resolve(
    __dirname,
    '../src/containers/Home/Stories/FeedCard/helpers/sizing.ts'
  ),
  {
    'import.meta.env': JSON.stringify({
      VITE_CIEL_TWINKLE_ID: '434343',
      VITE_ZERO_TWINKLE_ID: '424242'
    })
  }
).exports;

test('prefers the subject attachment over attached root media', () => {
  assert.deepEqual(
    resolveWideSubjectMedia({
      filePath: '/subjects/art.png',
      rootId: 41,
      rootType: 'video',
      rootObj: { content: 'youtube-code', rewardLevel: 3 }
    }),
    {
      kind: 'attachment',
      filePath: '/subjects/art.png'
    }
  );
});

test('supports canonical replacement attachment paths', () => {
  assert.deepEqual(
    resolveWideSubjectMedia({
      actualFilePath: '/subjects/replacement.webp'
    }),
    {
      kind: 'attachment',
      filePath: '/subjects/replacement.webp'
    }
  );
});

test('derives attached video media from the loaded root object', () => {
  assert.deepEqual(
    resolveWideSubjectMedia({
      rootId: 42,
      rootType: 'video',
      rootObj: {
        content: 'youtube-code',
        rewardLevel: 4
      }
    }),
    {
      kind: 'videoRoot',
      rewardLevel: 4,
      videoCode: 'youtube-code',
      videoId: 42
    }
  );
});

test('derives attached URL media and normalizes link aliases', () => {
  assert.deepEqual(
    resolveWideSubjectMedia({
      rootObj: {
        actualDescription: 'Description',
        actualTitle: 'Title',
        content: 'https://example.com/post',
        contentId: 43,
        contentType: 'link',
        linkUrl: 'example.com',
        thumbnailUrl: 'https://cdn.example.com/thumb.jpg'
      }
    }),
    {
      kind: 'urlRoot',
      actualDescription: 'Description',
      actualTitle: 'Title',
      siteUrl: 'example.com',
      thumbUrl: 'https://cdn.example.com/thumb.jpg',
      url: 'https://example.com/post',
      urlId: 43
    }
  );
});

test('keeps text-only and unsupported-root subjects media-free', () => {
  assert.equal(resolveWideSubjectMedia({ title: 'Text only' }), null);
  assert.equal(
    resolveWideSubjectMedia({
      rootId: 44,
      rootType: 'dailyReflection',
      rootObj: { contentType: 'dailyReflection' }
    }),
    null
  );
});

test('keeps replacement attachments ahead of promoted description builds', () => {
  const result = getSubjectTargetDescriptionEmbeds({
    actualFilePath: '/subjects/replacement.webp',
    description: '![Lumine app](/app/45)'
  });

  assert.equal(result.promotedBuildEmbed, null);
  assert.equal(result.contentEmbed?.type, 'internal');
});

function loadTypeScriptModule(entryPoint, define) {
  const output = esbuild.buildSync({
    bundle: true,
    define,
    entryPoints: [entryPoint],
    format: 'cjs',
    platform: 'node',
    write: false
  }).outputFiles[0].text;
  const mod = { exports: {} };
  const localRequire = createRequire(entryPoint);
  const compiled = new Function('require', 'module', 'exports', output);

  compiled(localRequire, mod, mod.exports);

  return mod;
}

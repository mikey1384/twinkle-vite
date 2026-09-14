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

test('puts Markdown files beside subject copy without replacing existing media', () => {
  for (const extension of ['pdf', 'docx', 'zip']) {
    const description = `Read these notes\n\n![Lesson notes](https://cdn.example.com/lesson.${extension}?download=1)`;
    const result = getSubjectTargetDescriptionEmbeds({ description });
    assert.equal(result.contentEmbed, null);
    assert.equal(result.promotedFileEmbed?.alt, 'Lesson notes');
    assert.equal(
      result.promotedFileEmbed?.src,
      `https://cdn.example.com/lesson.${extension}?download=1`
    );
    for (const media of [
      { filePath: '/drawing.png' },
      { actualFilePath: '/replacement.png' },
      { rootId: 42, rootType: 'video', rootObj: { content: 'youtube-code' } },
      {
        rootId: 43,
        rootType: 'url',
        rootObj: { content: 'https://example.com' }
      }
    ]) {
      const withMedia = getSubjectTargetDescriptionEmbeds({
        description,
        ...media
      });
      assert.equal(withMedia.promotedFileEmbed, null);
      assert.equal(withMedia.contentEmbed?.src, result.promotedFileEmbed.src);
    }
  }
});

test('keeps image embeds on their existing preview path', () => {
  for (const src of [
    'https://cdn.example.com/art.png',
    'https://cdn.example.com/opaque-image'
  ]) {
    const result = getSubjectTargetDescriptionEmbeds({
      description: `![Art](${src})`
    });
    assert.equal(result.promotedFileEmbed, null);
    assert.equal(result.contentEmbed?.src, src);
  }
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

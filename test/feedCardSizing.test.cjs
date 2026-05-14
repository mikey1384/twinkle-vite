const test = require('node:test');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const path = require('node:path');
const esbuild = require('esbuild');

const sizingModule = loadTypeScriptModule(
  path.resolve(
    __dirname,
    '../src/containers/Home/Stories/FeedCard/helpers/sizing.ts'
  )
);
const { getFeedCardSizing } = sizingModule.exports;

test('uses compact bucket for short plain comments', () => {
  const sizing = getFeedCardSizing({
    content: {
      contentType: 'comment',
      content: 'short answer'
    },
    userId: 1
  });

  assert.equal(sizing.main.size, 'compact');
  assert.equal(sizing.main.textMaxLines, 5);
  assert.equal(sizing.target, null);
  assert.equal(sizing.card.hasTarget, false);
  assert.equal(sizing.card.size, 'compact-card');
  assert.equal(sizing.card.bodyHeight, 'max(11rem, 110px)');
  assert.equal(sizing.card.desktopHeight, 'calc(max(21.55rem, 215.5px) + 2px)');
  assert.equal(sizing.card.mobileHeight, 'calc(max(20.15rem, 201.5px) + 2px)');
  assert.equal(sizing.card.placeholderHeight, sizing.card.desktopHeight);
  assert.match(
    sizing.main.className,
    /home-feed-card__panel-preview--size-compact/
  );
});

test('uses tall bucket for long plain comments', () => {
  const sizing = getFeedCardSizing({
    content: {
      contentType: 'comment',
      content: 'This is a long public feed comment. '.repeat(30)
    },
    userId: 1
  });

  assert.equal(sizing.main.size, 'tall');
  assert.equal(sizing.card.size, 'tall-card');
  assert.equal(sizing.main.textMaxLines, 13);
});

test('separates subject buckets by available content', () => {
  assert.equal(
    getFeedCardSizing({
      content: { contentType: 'subject', title: 'Best move?' },
      userId: 1
    }).main.size,
    'subject-minimal'
  );

  assert.equal(
    getFeedCardSizing({
      content: {
        contentType: 'subject',
        description: 'Read this carefully before answering.',
        title: 'Best move?'
      },
      userId: 1
    }).main.size,
    'subject-tall'
  );

  assert.equal(
    getFeedCardSizing({
      content: {
        contentType: 'subject',
        filePath: '/attachments/board.png',
        title: 'Best move?'
      },
      userId: 1
    }).main.size,
    'subject-media'
  );
});

test('uses compact rich embed bucket for sparse internal RichText embeds', () => {
  const sizing = getFeedCardSizing({
    content: {
      contentType: 'comment',
      content: 'hi ![1318](/subjects/1318)'
    },
    userId: 1
  });

  assert.equal(sizing.main.size, 'rich-embed-compact');
  assert.equal(sizing.flags.hasRichTextEmbed, true);
});

test('uses profile bucket for comments rooted on profile messages', () => {
  const sizing = getFeedCardSizing({
    content: {
      contentType: 'comment',
      content: 'ok',
      rootType: 'user'
    },
    rootObj: { id: 5, username: 'mikey' },
    userId: 1
  });

  assert.equal(sizing.main.size, 'profile');
});

test('uses preview root object when hook state is still empty', () => {
  const sizing = getFeedCardSizing({
    content: {
      contentType: 'comment',
      content: 'reply',
      rootObj: { id: 123, contentType: 'video' },
      rootType: 'video'
    },
    rootObj: {},
    userId: 1
  });

  assert.equal(sizing.target?.size, 'standard');
  assert.equal(sizing.card.hasTarget, true);
  assert.equal(sizing.card.size, 'comment-with-target-card');
});

test('uses reflection buckets from answer length', () => {
  assert.equal(
    getFeedCardSizing({
      content: {
        contentType: 'dailyReflection',
        description: 'Short answer.',
        question: 'Question?'
      },
      userId: 1
    }).main.size,
    'reflection-tight'
  );

  assert.equal(
    getFeedCardSizing({
      content: {
        contentType: 'dailyReflection',
        description: 'A long reflection. '.repeat(70),
        question: 'Question?'
      },
      userId: 1
    }).main.size,
    'reflection-tall'
  );
});

test('uses explicit AI Story buckets instead of plain text sizing', () => {
  const readingSizing = getFeedCardSizing({
    content: {
      contentType: 'aiStory',
      difficulty: 1,
      story: 'Ants work together. '.repeat(80),
      title: 'how ants work together: follow scent trails, share food'
    },
    userId: 1
  });

  assert.equal(readingSizing.main.kind, 'ai-story');
  assert.equal(readingSizing.main.size, 'ai-story-reading');
  assert.equal(readingSizing.card.size, 'media-card');
  assert.equal(readingSizing.card.bodyHeight, 'max(20rem, 200px)');
  assert.match(
    readingSizing.main.className,
    /home-feed-card__panel-preview--size-ai-story-reading/
  );

  const listeningSizing = getFeedCardSizing({
    content: {
      contentType: 'aiStory',
      difficulty: 2,
      isListening: true,
      title: 'topic: the basics of data science'
    },
    userId: 1
  });

  assert.equal(listeningSizing.main.kind, 'ai-story');
  assert.equal(listeningSizing.main.size, 'ai-story-listening');
  assert.equal(listeningSizing.card.bodyHeight, 'max(18rem, 180px)');
  assert.match(
    listeningSizing.main.className,
    /home-feed-card__panel-preview--size-ai-story-listening/
  );
});

test('uses secret bucket for hidden secret subjects', () => {
  const sizing = getFeedCardSizing({
    content: {
      contentType: 'subject',
      secretAnswer: 'hidden',
      uploader: { id: 2 }
    },
    userId: 1
  });

  assert.equal(sizing.main.size, 'secret');
  assert.equal(sizing.flags.secretHidden, true);
});

test('uses feed-level uploader ids for hidden secret subject sizing', () => {
  assert.equal(
    getFeedCardSizing({
      content: {
        contentType: 'subject',
        secretAnswer: 'hidden',
        uploaderId: 2
      },
      userId: 1
    }).main.size,
    'secret'
  );

  assert.notEqual(
    getFeedCardSizing({
      content: {
        contentType: 'subject',
        secretAnswer: 'hidden',
        userId: 1
      },
      userId: 1
    }).main.size,
    'secret'
  );
});

test('uses compact target bucket for media-only target comments', () => {
  const sizing = getFeedCardSizing({
    content: {
      contentType: 'comment',
      content: 'reply'
    },
    targetObj: {
      comment: {
        id: 10,
        content: '',
        filePath: '/attachments/image.svg'
      }
    },
    userId: 1
  });

  assert.equal(sizing.target?.size, 'compact');
  assert.equal(sizing.card.hasTarget, true);
  assert.equal(sizing.card.size, 'comment-with-target-card');
  assert.equal(sizing.card.bodyHeight, 'max(20.35rem, 203.5px)');
  assert.equal(sizing.card.desktopHeight, 'calc(max(30.9rem, 309px) + 2px)');
  assert.equal(sizing.card.mobileHeight, 'calc(max(29.5rem, 295px) + 2px)');
  assert.match(
    sizing.target?.className || '',
    /home-feed-card__target-preview--attachment/
  );
});

test('uses fallback bucket for malformed content', () => {
  const sizing = getFeedCardSizing({
    content: {
      contentType: 'unexpectedThing',
      content: 'still controlled'
    },
    userId: 1
  });

  assert.equal(sizing.main.kind, 'fallback');
  assert.equal(sizing.main.size, 'fallback');
  assert.equal(sizing.card.size, 'fallback-card');
});

function loadTypeScriptModule(entryPoint) {
  const output = esbuild.buildSync({
    bundle: true,
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

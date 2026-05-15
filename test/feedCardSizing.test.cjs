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
const {
  getDailyReflectionAnswerPreviewMaxLines,
  getFeedCardSizing,
  getSubjectPreviewLineLimits
} = sizingModule.exports;

test('uses compact bucket for short plain comments', () => {
  const sizing = getFeedCardSizing({
    content: {
      contentType: 'comment',
      content: 'short answer'
    },
    userId: 1
  });

  assert.equal(sizing.main.size, 'compact');
  assert.equal(sizing.main.textMaxLines, 2);
  assert.equal(sizing.target, null);
  assert.equal(sizing.card.hasTarget, false);
  assert.equal(sizing.card.size, 'compact-card');
  assert.equal(sizing.card.bodyHeight, 'max(11rem, 110px)');
  assert.equal(sizing.card.desktopHeight, 'calc(max(22.9rem, 229px) + 2px)');
  assert.equal(sizing.card.mobileHeight, 'calc(max(21.75rem, 217.5px) + 2px)');
  assert.equal(sizing.card.placeholderHeight, sizing.card.desktopHeight);
  assert.match(
    sizing.main.className,
    /home-feed-card__panel-preview--size-compact/
  );
});

test('promotes medium plain comments out of compact bucket', () => {
  const sizing = getFeedCardSizing({
    content: {
      contentType: 'comment',
      content:
        'This medium comment has enough words to need the standard preview bucket without becoming tall. '.repeat(
          2
        )
    },
    userId: 1
  });

  assert.equal(sizing.main.size, 'standard');
  assert.equal(sizing.main.textMaxLines, 5);
  assert.equal(sizing.card.size, 'standard-card');
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
  assert.equal(sizing.main.textMaxLines, 8);
});

test('reserves reply preview height outside the primary body slot', () => {
  const sizing = getFeedCardSizing({
    content: {
      __homeFeedHasCommentPreview: true,
      contentType: 'comment',
      content: 'short answer',
      comments: [{ id: 1, content: 'reply' }]
    },
    userId: 1
  });

  assert.equal(sizing.card.hasCommentPreview, true);
  assert.equal(sizing.card.bodyHeight, 'max(11rem, 110px)');
  assert.equal(sizing.card.commentPreviewHeight, 'max(7.4rem, 74px)');
  assert.equal(sizing.card.mobileCommentPreviewHeight, 'max(7.05rem, 70.5px)');
  assert.equal(sizing.card.desktopHeight, 'calc(max(31.15rem, 311.5px) + 2px)');
  assert.equal(sizing.card.mobileHeight, 'calc(max(29.55rem, 295.5px) + 2px)');
});

test('reserves reply preview height outside build app body slots', () => {
  const sizing = getFeedCardSizing({
    content: {
      __homeFeedHasCommentPreview: true,
      contentType: 'build',
      comments: [{ id: 1, content: 'app reply' }],
      title: 'Super Flappy Bird'
    },
    userId: 1
  });

  assert.equal(sizing.main.size, 'build');
  assert.equal(sizing.card.hasCommentPreview, true);
  assert.equal(sizing.card.bodyHeight, 'max(18rem, 180px)');
  assert.equal(sizing.card.mobileBodyHeight, 'max(17rem, 170px)');
  assert.equal(sizing.card.mobileCommentPreviewHeight, 'max(7.05rem, 70.5px)');
  assert.equal(sizing.card.desktopHeight, 'calc(max(38.15rem, 381.5px) + 2px)');
  assert.equal(sizing.card.mobileHeight, 'calc(max(36.55rem, 365.5px) + 2px)');
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

test('uses layout-aware answer lines for daily reflection previews', () => {
  const mediumContent = {
    contentType: 'dailyReflection',
    description: 'A medium reflection. '.repeat(20),
    question: 'Question?'
  };
  const mediumSizing = getFeedCardSizing({ content: mediumContent, userId: 1 });

  assert.equal(mediumSizing.main.size, 'reflection');
  assert.equal(
    getDailyReflectionAnswerPreviewMaxLines({
      axis: 'desktop',
      content: mediumContent,
      maxLines: mediumSizing.main.reflectionAnswerMaxLines,
      size: mediumSizing.main.size
    }),
    6
  );

  const content = {
    contentType: 'dailyReflection',
    description: 'A long reflection. '.repeat(70),
    isRefined: true,
    question:
      'When was the last time a question grabbed your mind and would not let go, the kind you kept turning over during quiet moments, and why?',
    streakAtTime: 1,
    xpAwarded: 10000
  };
  const sizing = getFeedCardSizing({ content, userId: 1 });

  assert.equal(sizing.main.size, 'reflection-tall');
  assert.equal(sizing.card.bodyHeight, 'max(34rem, 340px)');
  assert.equal(sizing.card.desktopHeight, 'calc(max(45.9rem, 459px) + 2px)');
  assert.equal(sizing.card.mobileHeight, 'calc(max(43.75rem, 437.5px) + 2px)');
  assert.equal(sizing.card.placeholderHeight, sizing.card.desktopHeight);
  assert.equal(sizing.main.reflectionAnswerMaxLines, 12);
  assert.equal(
    getDailyReflectionAnswerPreviewMaxLines({
      axis: 'desktop',
      content,
      maxLines: sizing.main.reflectionAnswerMaxLines,
      size: sizing.main.size
    }),
    7
  );
  assert.equal(
    getDailyReflectionAnswerPreviewMaxLines({
      axis: 'mobile',
      content,
      maxLines: sizing.main.reflectionAnswerMaxLines,
      size: sizing.main.size
    }),
    6
  );
});

test('uses layout-aware description lines for subjects with secret answers', () => {
  const content = {
    contentType: 'subject',
    description:
      'Inktober is a drawing challenge where you have to create a drawing everyday throughout October and share it on social media. '.repeat(
        5
      ),
    rewardLevel: 4,
    secretAnswer: '.',
    title: 'let me think of something',
    userId: 1
  };
  const sizing = getFeedCardSizing({ content, userId: 1 });

  assert.equal(sizing.main.size, 'subject-tall');
  assert.equal(sizing.main.subjectDescriptionMaxLines, 11);
  assert.equal(sizing.card.bodyHeight, 'max(32rem, 320px)');
  assert.equal(sizing.card.desktopHeight, 'calc(max(43.9rem, 439px) + 2px)');
  assert.equal(sizing.card.mobileHeight, 'calc(max(41.75rem, 417.5px) + 2px)');
  assert.deepEqual(
    getSubjectPreviewLineLimits({
      axis: 'desktop',
      content,
      hasDescriptionText: true,
      hasEffort: true,
      hasSecretAnswer: true,
      hasSecretAnswerText: true,
      hasSecretAttachment: false,
      hasTitle: true,
      size: sizing.main.size
    }),
    {
      descriptionMaxLines: 6,
      secretMaxLines: 1
    }
  );
  assert.deepEqual(
    getSubjectPreviewLineLimits({
      axis: 'mobile',
      content,
      hasDescriptionText: true,
      hasEffort: true,
      hasSecretAnswer: true,
      hasSecretAnswerText: true,
      hasSecretAttachment: false,
      hasTitle: true,
      size: sizing.main.size
    }),
    {
      descriptionMaxLines: 5,
      secretMaxLines: 1
    }
  );
});

test('reserves space for long secret answers in subject previews', () => {
  const content = {
    contentType: 'subject',
    description:
      'Inktober is a drawing challenge where you have to create a drawing everyday throughout October and share it on social media. '.repeat(
        5
      ),
    rewardLevel: 4,
    secretAnswer:
      'This private note is long enough to require several lines in the yellow secret answer preview. '.repeat(
        4
      ),
    title: 'let me think of something',
    userId: 1
  };
  const sizing = getFeedCardSizing({ content, userId: 1 });

  assert.deepEqual(
    getSubjectPreviewLineLimits({
      axis: 'desktop',
      content,
      hasDescriptionText: true,
      hasEffort: true,
      hasSecretAnswer: true,
      hasSecretAnswerText: true,
      hasSecretAttachment: false,
      hasTitle: true,
      size: sizing.main.size
    }),
    {
      descriptionMaxLines: 5,
      secretMaxLines: 3
    }
  );
});

test('keeps long-question reflection previews inside the fixed panel', () => {
  const content = {
    contentType: 'dailyReflection',
    description: 'Short answer.',
    question:
      'Why does this very long question keep taking up the whole preview before the answer gets a fair amount of room? '.repeat(
        3
      ),
    xpAwarded: 1
  };
  const sizing = getFeedCardSizing({ content, userId: 1 });

  assert.equal(sizing.main.size, 'reflection-tight');
  assert.equal(
    getDailyReflectionAnswerPreviewMaxLines({
      axis: 'desktop',
      content,
      maxLines: sizing.main.reflectionAnswerMaxLines,
      size: sizing.main.size
    }),
    2
  );
  assert.equal(
    getDailyReflectionAnswerPreviewMaxLines({
      axis: 'mobile',
      content,
      maxLines: sizing.main.reflectionAnswerMaxLines,
      size: sizing.main.size
    }),
    2
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
  assert.equal(sizing.card.desktopHeight, 'calc(max(32.25rem, 322.5px) + 2px)');
  assert.equal(sizing.card.mobileHeight, 'calc(max(31.1rem, 311px) + 2px)');
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

const test = require('node:test');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { readFileSync } = require('node:fs');
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
  getMarkdownImageEmbedPreview,
  removeMarkdownImageEmbeds,
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
  assert.equal(sizing.card.bodyHeight, 'max(20rem, 200px)');
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
  assert.equal(sizing.card.mobileHeight, 'calc(max(29.8rem, 298px) + 2px)');
});

test('moves mobile reply preview upward without shrinking the card frame', () => {
  const feedCardSource = readFileSync(
    path.resolve(__dirname, '../src/containers/Home/Stories/FeedCard/index.tsx'),
    'utf8'
  );
  const mobileCommentPreviewSlotSource = feedCardSource.slice(
    feedCardSource.lastIndexOf('.home-feed-card__comment-preview-slot {')
  );
  const mobileCommentPreviewSlotBlock = mobileCommentPreviewSlotSource.match(
    /\.home-feed-card__comment-preview-slot \{([\s\S]*?)\n    \}/
  )?.[1];

  assert.ok(mobileCommentPreviewSlotBlock);
  assert.match(mobileCommentPreviewSlotBlock, /margin-top: -0\.5rem;/);
  assert.match(
    mobileCommentPreviewSlotBlock,
    /flex-basis: var\(--home-feed-card-mobile-comment-preview-height\);/
  );
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
  assert.equal(sizing.card.mobileHeight, 'calc(max(36.8rem, 368px) + 2px)');
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
    'compact'
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

test('uses compact space for short plain subject descriptions', () => {
  const content = {
    contentType: 'subject',
    description: 'hi henti fjdkslajfkl',
    title: 'fdsafdsaafdsa'
  };
  const sizing = getFeedCardSizing({
    content,
    userId: 1
  });

  assert.equal(sizing.main.size, 'compact');
  assert.equal(sizing.card.bodyHeight, 'max(11rem, 110px)');
  assert.deepEqual(
    getSubjectPreviewLineLimits({
      axis: 'desktop',
      content,
      hasDescriptionText: true,
      hasEffort: false,
      hasSecretAnswer: false,
      hasSecretAnswerText: false,
      hasSecretAttachment: false,
      hasTitle: true,
      size: sizing.main.size
    }),
    {
      descriptionMaxLines: 2,
      secretMaxLines: 0
    }
  );
});

test('keeps secret-answer subjects above the action floor', () => {
  const content = {
    contentType: 'subject',
    description:
      "Inktober is a drawing challenge where you have to create a drawing **everyday** throughout October & share it on social media! Let's use the twin-kle website to share our drawings.\n\n_ Inktober will begin on Tuesday October 1st. It will end on Thursday October 31st._",
    rewardLevel: 4,
    secretAnswer: '.',
    secretShown: true,
    title: 'let me think of something'
  };
  const sizing = getFeedCardSizing({
    content,
    userId: 1
  });

  assert.equal(sizing.main.size, 'subject-tall');
  assert.equal(sizing.card.bodyHeight, 'max(32rem, 320px)');
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
      descriptionMaxLines: 3,
      secretMaxLines: 1
    }
  );
});

test('uses compact root sizing for sparse secret subjects with root previews', () => {
  const content = {
    contentType: 'subject',
    rewardLevel: 4,
    rootId: 200,
    rootType: 'video',
    secretAnswer: '...',
    secretShown: true,
    title: 'What do you think Mojang will add in the Minecraft 1.20 update?'
  };
  const sizing = getFeedCardSizing({
    content,
    rootObj: {
      id: 200,
      contentType: 'video',
      title: 'THE SPRING LOFT CONDO Video Presentation 21 Sep 2021'
    },
    userId: 1
  });

  assert.equal(sizing.main.kind, 'subject');
  assert.equal(sizing.main.size, 'subject-root');
  assert.equal(sizing.target?.size, 'standard');
  assert.equal(sizing.card.bodyHeight, 'max(29.35rem, 293.5px)');
  assert.equal(sizing.card.mobileBodyHeight, 'max(28.35rem, 283.5px)');
  assert.deepEqual(
    getSubjectPreviewLineLimits({
      axis: 'desktop',
      content,
      hasDescriptionText: false,
      hasEffort: true,
      hasSecretAnswer: true,
      hasSecretAnswerText: true,
      hasSecretAttachment: false,
      hasTitle: true,
      size: sizing.main.size
    }),
    {
      descriptionMaxLines: 0,
      secretMaxLines: 1
    }
  );
});

test('uses root-aware subject sizing for standard subject root types', () => {
  for (const rootType of ['aiStory', 'build', 'subject']) {
    const sizing = getFeedCardSizing({
      content: {
        contentType: 'subject',
        rootId: 300,
        rootType,
        secretAnswer: '...',
        secretShown: true,
        title: `Short subject on ${rootType}`
      },
      rootObj: {
        id: 300,
        contentType: rootType,
        title: `Root ${rootType}`
      },
      userId: 1
    });

    assert.equal(sizing.main.size, 'subject-root', rootType);
    assert.equal(sizing.target?.size, 'standard', rootType);
    assert.equal(sizing.card.hasTarget, true, rootType);
    assert.equal(
      sizing.card.mobileBodyHeight,
      'max(28.35rem, 283.5px)',
      rootType
    );
  }
});

test('keeps image-only secret attachments centered without tall root spacing', () => {
  const sizing = getFeedCardSizing({
    content: {
      contentType: 'subject',
      description: 'tests',
      rootId: 200,
      rootType: 'video',
      secretAttachment: {
        fileName: 'board.png',
        filePath: '/attachments/board.png'
      },
      secretShown: true,
      title: 'Best move?'
    },
    rootObj: {
      id: 200,
      contentType: 'video',
      title: 'GPT-4 Khan Academy In Depth Demo'
    },
    userId: 1
  });
  const bodySource = readFileSync(
    path.resolve(
      __dirname,
      '../src/containers/Home/Stories/FeedCard/Body/index.tsx'
    ),
    'utf8'
  );
  const stylesSource = readFileSync(
    path.resolve(
      __dirname,
      '../src/containers/Home/Stories/FeedCard/Body/styles/mainPreviewStyles.ts'
    ),
    'utf8'
  );
  const panelStylesSource = readFileSync(
    path.resolve(
      __dirname,
      '../src/containers/Home/Stories/FeedCard/Body/styles/panelPreviewStyles.ts'
    ),
    'utf8'
  );

  assert.equal(sizing.main.size, 'subject-secret-media');
  assert.equal(sizing.target?.size, 'standard');
  assert.equal(sizing.card.bodyHeight, 'max(38.85rem, 388.5px)');
  assert.match(
    bodySource,
    /home-feed-card__subject-secret-answer--attachment-only/
  );
  assert.match(
    stylesSource,
    /home-feed-card__subject-secret-answer--attachment-only[\s\S]*justify-content: center/
  );
  assert.match(
    stylesSource,
    /home-feed-card__subject-secret-answer--attachment-only[\s\S]*width: min\(100%, 32rem\)/
  );
  assert.match(
    stylesSource,
    /home-feed-card__subject-secret-answer--attachment-only[\s\S]*height: 14rem/
  );
  assert.match(panelStylesSource, /size-subject-secret-media/);
});

test('gives real secret-answer text enough root-subject panel space', () => {
  const content = {
    contentType: 'subject',
    rewardLevel: 2,
    rootId: 200,
    rootType: 'video',
    secretAnswer:
      'I think Mojang will add an update to the End dimension because we had updates to the overworld and the nether, but we never had an update to the End. Maybe there could be a new ore that generates only in the End.',
    secretShown: true,
    title: 'What do you think Mojang will add in the Minecraft 1.20 update?'
  };
  const sizing = getFeedCardSizing({
    content,
    rootObj: {
      id: 200,
      contentType: 'video',
      title: 'THE SPRING LOFT CONDO Video Presentation 21 Sep 2021'
    },
    userId: 1
  });

  assert.equal(sizing.main.size, 'standard');
  assert.equal(sizing.target?.size, 'standard');
  assert.equal(sizing.card.bodyHeight, 'max(33.85rem, 338.5px)');
  assert.deepEqual(
    getSubjectPreviewLineLimits({
      axis: 'desktop',
      content,
      hasDescriptionText: false,
      hasEffort: true,
      hasSecretAnswer: true,
      hasSecretAnswerText: true,
      hasSecretAttachment: false,
      hasTitle: true,
      size: sizing.main.size
    }),
    {
      descriptionMaxLines: 0,
      secretMaxLines: 3
    }
  );
});

test('lets long root-subject descriptions use dedicated text-heavy root space', () => {
  const content = {
    contentType: 'subject',
    description:
      "hello 😊\nFrom my own experience, I can say that gaming isn't just fun; it can be quite educational too. For instance, playing Diablo 2 back in high school taught me about arbitrage, which surprisingly came in handy later when I got into cryptocurrency. Plus, the whole idea of using XP and rankings on this educational website was inspired by video game mechanics. ".repeat(
        2
      ),
    rootId: 148,
    rootType: 'url',
    secretAnswer: '...',
    secretShown: true,
    title: 'Secret subject test!'
  };
  const sizing = getFeedCardSizing({
    content,
    rootObj: {
      id: 148,
      contentType: 'url',
      title: 'CoWordle'
    },
    userId: 1
  });

  assert.equal(sizing.main.size, 'subject-root-text');
  assert.equal(sizing.target?.size, 'standard');
  assert.deepEqual(
    getSubjectPreviewLineLimits({
      axis: 'desktop',
      content,
      hasDescriptionText: true,
      hasEffort: false,
      hasSecretAnswer: true,
      hasSecretAnswerText: true,
      hasSecretAttachment: false,
      hasTitle: true,
      size: sizing.main.size
    }),
    {
      descriptionMaxLines: 4,
      secretMaxLines: 1
    }
  );
});

test('keeps subject description styling separate from secret styling', () => {
  const stylesSource = readFileSync(
    path.resolve(
      __dirname,
      '../src/containers/Home/Stories/FeedCard/Body/styles/mainPreviewStyles.ts'
    ),
    'utf8'
  );
  const rootDescriptionBlock = stylesSource.match(
    /\.home-feed-card__subject-preview--with-root \.home-feed-card__subject-description \{([\s\S]*?)\n  \}/
  )?.[1];

  assert.ok(rootDescriptionBlock);
  assert.doesNotMatch(rootDescriptionBlock, /background:/);
  assert.doesNotMatch(rootDescriptionBlock, /border:/);
  assert.match(rootDescriptionBlock, /color: inherit/);
  assert.doesNotMatch(rootDescriptionBlock, /Color\.gold|Color\.ivory/);
  assert.match(
    stylesSource,
    /\.home-feed-card__subject-description \{[\s\S]*font-family: inherit;[\s\S]*font-size: inherit;/
  );
  assert.doesNotMatch(stylesSource, /font-size: max\(1\.28rem, 12\.8px\)/);
  assert.match(stylesSource, /\.home-feed-card__subject-secret-answer \{/);
  assert.match(
    stylesSource,
    /\.home-feed-card__subject-secret-answer[\s\S]*background: \$\{Color\.ivory\(\)\}/
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

test('keeps subject AI-card markdown embeds visible in the rich embed layout', () => {
  const description =
    'Looking forward to the next chapter\n\n![focus](/ai-cards?cardId=1267)';
  const sizing = getFeedCardSizing({
    content: {
      contentType: 'subject',
      description,
      title: 'final fantasy'
    },
    userId: 1
  });
  const bodySource = readFileSync(
    path.resolve(
      __dirname,
      '../src/containers/Home/Stories/FeedCard/Body/index.tsx'
    ),
    'utf8'
  );
  const stylesSource = readFileSync(
    path.resolve(
      __dirname,
      '../src/containers/Home/Stories/FeedCard/Body/styles/mainPreviewStyles.ts'
    ),
    'utf8'
  );
  const primitivesSource = readFileSync(
    path.resolve(
      __dirname,
      '../src/containers/Home/Stories/FeedCard/Body/PreviewPrimitives.tsx'
    ),
    'utf8'
  );
  const embedCopyBlock = stylesSource.match(
    /\.home-feed-card__subject-preview--with-embed \.home-feed-card__subject-copy \{([\s\S]*?)\n  \}/
  )?.[1];

  assert.equal(sizing.main.size, 'subject-rich-embed');
  assert.equal(sizing.flags.hasRichTextEmbed, true);
  assert.equal(sizing.card.bodyHeight, 'max(34rem, 340px)');
  assert.deepEqual(getMarkdownImageEmbedPreview(description), {
    alt: 'focus',
    src: '/ai-cards?cardId=1267',
    type: 'internal'
  });
  assert.equal(
    removeMarkdownImageEmbeds(description),
    'Looking forward to the next chapter'
  );
  assert.match(
    bodySource,
    /const descriptionEmbed = getMarkdownImageEmbedPreview\(description\);/
  );
  assert.match(
    bodySource,
    /const descriptionText = descriptionEmbed[\s\S]*removeMarkdownImageEmbeds\(description\)/
  );
  assert.match(bodySource, /className="home-feed-card__subject-embed-preview"/);
  assert.match(
    bodySource,
    /<MarkdownEmbedPreview[\s\S]*embed=\{descriptionEmbed\}/
  );
  assert.match(bodySource, /function renderRichTextEmbedPreview/);
  assert.match(bodySource, /className="home-feed-card__rich-embed-image"/);
  assert.match(
    primitivesSource,
    /internalLinkType === 'subjects'[\s\S]*home-feed-card__rich-embed-internal--subject/
  );
  assert.match(
    stylesSource,
    /\.home-feed-card__rich-embed-preview--with-text[\s\S]*\.home-feed-card__rich-embed-image\.home-feed-card__rich-embed-internal--subject[\s\S]*border: 0;[\s\S]*background: transparent;/
  );
  assert.match(
    stylesSource,
    /\.home-feed-card__subject-embed-preview:has\([\s\S]*compact-main-content-embed--ai-story-card:not[\s\S]*compact-main-content-embed--ai-story-has-image[\s\S]*flex: 0 0 auto;[\s\S]*align-self: start;/
  );
  assert.match(
    stylesSource,
    /\.home-feed-card__subject-embed-preview[\s\S]*\.compact-main-content-embed--ai-story-card:not\([\s\S]*compact-main-content-embed--ai-story-has-image[\s\S]*height: auto;[\s\S]*max-height: none;/
  );
  assert.ok(embedCopyBlock);
  assert.match(embedCopyBlock, /flex: 0 0 auto;/);
  assert.match(embedCopyBlock, /height: auto;/);
});

test('expands attachment-only image comments into full-width media frames', () => {
  const sizing = getFeedCardSizing({
    content: {
      contentType: 'comment',
      content: '',
      fileName: '1768454621269-pzfdsq.svg',
      filePath: '/attachments/1768454621269-pzfdsq.svg'
    },
    userId: 1
  });
  const bodySource = readFileSync(
    path.resolve(
      __dirname,
      '../src/containers/Home/Stories/FeedCard/Body/index.tsx'
    ),
    'utf8'
  );
  const primitivesSource = readFileSync(
    path.resolve(
      __dirname,
      '../src/containers/Home/Stories/FeedCard/Body/PreviewPrimitives.tsx'
    ),
    'utf8'
  );
  const fileViewerSource = readFileSync(
    path.resolve(__dirname, '../src/components/ContentFileViewer/index.tsx'),
    'utf8'
  );
  const imagePreviewSource = readFileSync(
    path.resolve(
      __dirname,
      '../src/components/ContentFileViewer/ImagePreview.tsx'
    ),
    'utf8'
  );
  const stylesSource = readFileSync(
    path.resolve(
      __dirname,
      '../src/containers/Home/Stories/FeedCard/Body/styles/mainPreviewStyles.ts'
    ),
    'utf8'
  );
  const attachmentPreviewBlock = stylesSource.match(
    /\.home-feed-card__attachment-preview \{([\s\S]*?)\n  \}/
  )?.[1];
  const videoAttachmentBlock = stylesSource.match(
    /\.home-feed-card__video-attachment \{([\s\S]*?)\n  \}/
  )?.[1];
  const videoMediaBlock = stylesSource.match(
    /\.home-feed-card__video-attachment img,\n  \.home-feed-card__video-attachment video \{([\s\S]*?)\n  \}/
  )?.[1];
  const videoPlayBlock = stylesSource.match(
    /\.home-feed-card__video-attachment-play \{([\s\S]*?)\n  \}/
  )?.[1];
  const videoTitleBlock = stylesSource.match(
    /\.home-feed-card__video-attachment-title \{([\s\S]*?)\n  \}/
  )?.[1];

  assert.equal(sizing.main.size, 'media-attachment');
  assert.equal(sizing.card.size, 'media-card');
  assert.equal(sizing.card.bodyHeight, 'max(40rem, 400px)');
  assert.equal(sizing.card.mobileBodyHeight, 'max(25rem, 250px)');
  assert.match(bodySource, /home-feed-card__attachment-only-preview/);
  assert.match(bodySource, /home-feed-card__attachment-only-preview--media/);
  assert.match(
    bodySource,
    /attachmentFileType === 'image' \|\| attachmentFileType === 'video'/
  );
  assert.match(bodySource, /`comment-\$\{attachmentFileType\}`/);
  assert.match(primitivesSource, /fillUnavailablePreview/);
  assert.match(
    fileViewerSource,
    /fillUnavailablePreview=\{fillUnavailablePreview\}/
  );
  assert.match(primitivesSource, /fillPreview=\{fileType === 'image'\}/);
  assert.match(
    primitivesSource,
    /previewObjectFit=\{fileType === 'image' \? 'contain' : undefined\}/
  );
  assert.match(fileViewerSource, /fillPreview=\{fillPreview\}/);
  assert.match(fileViewerSource, /previewObjectFit=\{previewObjectFit\}/);
  assert.match(
    imagePreviewSource,
    /height: \$\{fillUnavailablePreview \? '100%' : 'auto'\}/
  );
  assert.match(
    imagePreviewSource,
    /border: \$\{fillUnavailablePreview[\s\S]*\? '0'/
  );
  assert.ok(attachmentPreviewBlock);
  assert.match(attachmentPreviewBlock, /width: 100%;/);
  assert.match(stylesSource, /aspect-ratio: 16 \/ 9;/);
  assert.match(
    stylesSource,
    /home-feed-card__attachment-preview--comment-image img[\s\S]*object-fit: contain/
  );
  assert.ok(videoAttachmentBlock);
  assert.doesNotMatch(videoAttachmentBlock, /cursor: pointer;/);
  assert.ok(videoMediaBlock);
  assert.match(videoMediaBlock, /object-fit: contain;/);
  assert.match(videoMediaBlock, /pointer-events: none;/);
  assert.ok(videoPlayBlock);
  assert.match(videoPlayBlock, /pointer-events: none;/);
  assert.ok(videoTitleBlock);
  assert.match(videoTitleBlock, /width: fit-content;/);
  assert.doesNotMatch(videoTitleBlock, /right:/);
  assert.match(videoTitleBlock, /pointer-events: none;/);
  assert.match(imagePreviewSource, /previewObjectFit \|\| 'cover'/);
});

test('expands attachment-only video comments into media frames', () => {
  const sizing = getFeedCardSizing({
    content: {
      contentType: 'comment',
      content: '',
      fileName: '1712570559.mp4',
      filePath: '/attachments/1712570559.mp4'
    },
    userId: 1
  });
  const bodySource = readFileSync(
    path.resolve(
      __dirname,
      '../src/containers/Home/Stories/FeedCard/Body/index.tsx'
    ),
    'utf8'
  );
  const stylesSource = readFileSync(
    path.resolve(
      __dirname,
      '../src/containers/Home/Stories/FeedCard/Body/styles/mainPreviewStyles.ts'
    ),
    'utf8'
  );

  assert.equal(sizing.main.size, 'media-attachment');
  assert.equal(sizing.card.size, 'media-card');
  assert.equal(sizing.card.bodyHeight, 'max(40rem, 400px)');
  assert.equal(sizing.card.mobileBodyHeight, 'max(25rem, 250px)');
  assert.match(
    bodySource,
    /home-feed-card__attachment-only-preview--media/
  );
  assert.match(
    bodySource,
    /attachmentFileType === 'image' \|\| attachmentFileType === 'video'/
  );
  assert.match(bodySource, /`comment-\$\{attachmentFileType\}`/);
  assert.match(stylesSource, /aspect-ratio: 16 \/ 9;/);
  assert.match(
    stylesSource,
    /home-feed-card__attachment-preview--comment-video video[\s\S]*object-fit: contain/
  );
});

test('reserves extra height for mixed comment text and media attachments', () => {
  for (const fileName of ['diagram.png', 'demo.mp4']) {
    const sizing = getFeedCardSizing({
      content: {
        contentType: 'comment',
        content:
          'Here is the media attachment with enough text to prove the frame still gets reserved.',
        fileName,
        filePath: `/attachments/${fileName}`
      },
      userId: 1
    });

    assert.equal(sizing.main.size, 'media-attachment-with-text', fileName);
    assert.equal(sizing.main.textMaxLines, 2, fileName);
    assert.equal(sizing.card.size, 'media-card', fileName);
    assert.equal(sizing.card.bodyHeight, 'max(45rem, 450px)', fileName);
    assert.equal(sizing.card.mobileBodyHeight, 'max(31rem, 310px)', fileName);
  }
});

test('keeps non-previewable attachment-only files compact', () => {
  const sizing = getFeedCardSizing({
    content: {
      contentType: 'comment',
      content: '',
      fileName: 'worksheet.pdf',
      filePath: '/attachments/worksheet.pdf'
    },
    userId: 1
  });

  assert.equal(sizing.main.size, 'attachment-only');
  assert.equal(sizing.card.size, 'compact-card');
  assert.equal(sizing.card.bodyHeight, 'max(12rem, 120px)');
  assert.equal(sizing.card.mobileBodyHeight, 'max(11rem, 110px)');
});

test('uses comment text plus profile target for comments rooted on profile messages', () => {
  const sizing = getFeedCardSizing({
    content: {
      contentType: 'comment',
      content: 'ok',
      rootType: 'user',
      targetObj: {
        contentType: 'user',
        user: { id: 5, username: 'mikey' }
      }
    },
    rootObj: { id: 5, username: 'mikey' },
    userId: 1
  });

  assert.equal(sizing.main.size, 'compact');
  assert.equal(sizing.target?.size, 'standard');
  assert.equal(sizing.card.hasTarget, true);
  assert.equal(sizing.card.size, 'comment-with-target-card');
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
  assert.equal(sizing.main.subjectDescriptionMaxLines, 9);
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
      descriptionMaxLines: 3,
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
      descriptionMaxLines: 3,
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
      descriptionMaxLines: 2,
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

test('keeps sibling media-like content in bounded feed buckets', () => {
  for (const contentType of ['sharedTopic', 'url', 'video']) {
    const sizing = getFeedCardSizing({
      content: {
        contentType,
        description: 'A short media-like feed item.',
        title: `${contentType} item`
      },
      userId: 1
    });

    assert.equal(sizing.main.size, 'media', contentType);
    assert.equal(sizing.card.bodyHeight, 'max(22rem, 220px)', contentType);
    assert.equal(
      sizing.card.mobileBodyHeight,
      'max(20rem, 200px)',
      contentType
    );
  }
});

test('AI Story home previews render generated images when available', () => {
  const bodySource = readFileSync(
    path.resolve(
      __dirname,
      '../src/containers/Home/Stories/FeedCard/Body/index.tsx'
    ),
    'utf8'
  );
  const targetSource = readFileSync(
    path.resolve(
      __dirname,
      '../src/containers/Home/Stories/FeedCard/Body/TargetPreview.tsx'
    ),
    'utf8'
  );
  const primitivesSource = readFileSync(
    path.resolve(
      __dirname,
      '../src/containers/Home/Stories/FeedCard/Body/PreviewPrimitives.tsx'
    ),
    'utf8'
  );
  const stylesSource = readFileSync(
    path.resolve(
      __dirname,
      '../src/containers/Home/Stories/FeedCard/Body/styles/mainPreviewStyles.ts'
    ),
    'utf8'
  );

  assert.match(primitivesSource, /function getAIStoryImageUrl/);
  assert.match(primitivesSource, /imageUrl/);
  assert.match(primitivesSource, /imagePath/);
  assert.match(bodySource, /getAIStoryImageUrl\(content\)/);
  assert.match(targetSource, /getAIStoryImageUrl\(target\)/);
  assert.match(bodySource, /home-feed-card__ai-story-preview--has-image/);
  assert.match(bodySource, /home-feed-card__ai-story-image/);
  assert.match(targetSource, /home-feed-card__ai-story-image/);
  assert.match(stylesSource, /home-feed-card__ai-story-image-frame/);
  assert.match(
    stylesSource,
    /\.home-feed-card__ai-story-topline \{[\s\S]*line-height: 1\.25;/
  );
  assert.match(
    stylesSource,
    /\.home-feed-card__ai-story-topline span:first-child \{[\s\S]*overflow: visible;[\s\S]*padding-block: 0\.08rem;[\s\S]*line-height: 1\.35;/
  );
  assert.doesNotMatch(
    stylesSource,
    /\.home-feed-card__ai-story-topline \{[\s\S]*line-height: 1;/
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

test('keeps public subject media visible when only the secret answer is hidden', () => {
  const sizing = getFeedCardSizing({
    content: {
      contentType: 'subject',
      fileName: 'board.png',
      filePath: '/attachments/board.png',
      hasSecretAnswer: true,
      secretAnswer: 'hidden',
      title: 'Best move?',
      uploader: { id: 2 }
    },
    userId: 1
  });

  assert.equal(sizing.flags.secretHidden, true);
  assert.equal(sizing.flags.hasAttachment, true);
  assert.equal(sizing.main.size, 'subject-media');
  assert.match(
    sizing.main.className,
    /home-feed-card__panel-preview--size-subject-media/
  );
});

test('uses subject secret-message wording for locked subject previews', () => {
  const sizing = getFeedCardSizing({
    content: {
      contentType: 'subject',
      hasSecretAnswer: true,
      secretAnswer: 'hidden answer',
      title: 'tewt',
      uploader: { id: 2 }
    },
    userId: 1
  });
  const bodySource = readFileSync(
    path.resolve(
      __dirname,
      '../src/containers/Home/Stories/FeedCard/Body/index.tsx'
    ),
    'utf8'
  );
  const bodyStylesSource = readFileSync(
    path.resolve(
      __dirname,
      '../src/containers/Home/Stories/FeedCard/Body/styles.ts'
    ),
    'utf8'
  );

  assert.equal(sizing.flags.secretHidden, true);
  assert.equal(sizing.main.size, 'subject-locked');
  assert.equal(sizing.card.bodyHeight, 'max(16.5rem, 165px)');
  assert.equal(sizing.card.mobileBodyHeight, 'max(15.5rem, 155px)');
  assert.match(bodySource, /Submit your response to view the secret message/);
  assert.match(bodySource, /secretHidden && contentType !== 'subject'/);
  assert.match(bodySource, /home-feed-card__subject-secret-answer--locked/);
  assert.match(bodySource, /label=\{lockedSubjectSecretPreviewLabel\}/);
  assert.match(bodySource, /style=\{homeFeedSecretGuardBannerStyle\}/);
  assert.match(bodyStylesSource, /homeFeedSecretGuardBannerStyle/);
  assert.match(bodyStylesSource, /\.\.\.compactSecretCommentStyle/);
});

test('uses standard video-scale target previews for link roots', () => {
  const sizing = getFeedCardSizing({
    content: {
      contentType: 'subject',
      rootId: 9,
      rootType: 'url',
      title: 'subject on a link'
    },
    rootObj: {
      id: 9,
      contentType: 'url',
      thumbUrl: 'https://example.com/thumb.jpg'
    },
    userId: 1
  });
  const targetSource = readFileSync(
    path.resolve(
      __dirname,
      '../src/containers/Home/Stories/FeedCard/Body/TargetPreview.tsx'
    ),
    'utf8'
  );
  const stylesSource = readFileSync(
    path.resolve(
      __dirname,
      '../src/containers/Home/Stories/FeedCard/Body/styles/targetPreviewStyles.ts'
    ),
    'utf8'
  );

  assert.equal(sizing.target?.size, 'standard');
  assert.match(sizing.target?.className || '', /home-feed-card__url-target/);
  assert.doesNotMatch(
    sizing.target?.className || '',
    /home-feed-card__url-target-compact/
  );
  assert.match(targetSource, /function renderTargetUrlPreview/);
  assert.match(targetSource, /LinkPreviewImage/);
  assert.doesNotMatch(
    targetSource,
    /<Embedly small contentId=\{resolvedRootObj\.id\}/
  );
  assert.match(stylesSource, /home-feed-card__target-url\.has-media/);
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

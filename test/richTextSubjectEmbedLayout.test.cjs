const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const esbuild = require('esbuild');

function readSource(relativePath) {
  return readFileSync(path.resolve(__dirname, '..', relativePath), 'utf8');
}

const previewModeModule = loadTypeScriptModule(
  path.resolve(
    __dirname,
    '../src/components/Texts/RichText/embedPreviewMode.ts'
  )
);
const {
  getRichTextEmbedPreviewMode,
  getRichTextPreviewMaxHeight,
  getRichTextSubjectPreviewVariant
} = previewModeModule.exports;
const embeddedVideoNavigationModule = loadTypeScriptModule(
  path.resolve(
    __dirname,
    '../src/components/Texts/RichText/Markdown/EmbeddedComponent/InternalComponent/embeddedVideoNavigation.ts'
  )
);
const { shouldNavigateEmbeddedVideoContainerClick } =
  embeddedVideoNavigationModule.exports;
const feedCardNavigationModule = loadTypeScriptModule(
  path.resolve(
    __dirname,
    '../src/containers/Home/Stories/FeedCard/helpers/navigation.ts'
  )
);
const { shouldSkipFeedCardNavigation } = feedCardNavigationModule.exports;

test('keeps collapsed RichText embeds compact and expanded RichText unchanged', () => {
  assert.equal(
    getRichTextEmbedPreviewMode({
      compactEmbedPreview: false,
      isPreview: true
    }),
    'compactComment'
  );
  assert.equal(
    getRichTextEmbedPreviewMode({
      compactEmbedPreview: true,
      isPreview: true
    }),
    'compactComment'
  );
  assert.equal(
    getRichTextEmbedPreviewMode({
      compactEmbedPreview: true,
      isPreview: false
    }),
    'compactComment'
  );
  assert.equal(
    getRichTextEmbedPreviewMode({
      compactEmbedPreview: false,
      isPreview: false
    }),
    undefined
  );
});

test('lets full-width surfaces opt into subject cards without weakening compact comments', () => {
  assert.equal(
    getRichTextSubjectPreviewVariant({
      compactEmbedPreview: false,
      subjectPreviewVariant: 'fullWidth'
    }),
    'fullWidth'
  );
  assert.equal(
    getRichTextSubjectPreviewVariant({
      compactEmbedPreview: true,
      subjectPreviewVariant: 'fullWidth'
    }),
    undefined
  );
  assert.equal(
    getRichTextPreviewMaxHeight({
      hasMarkdownEmbed: true,
      lineHeight: 1.7,
      maxLines: 10,
      subjectPreviewVariant: 'fullWidth'
    }),
    'calc(1.7em * 10 + 13rem)'
  );
  assert.equal(
    getRichTextPreviewMaxHeight({
      hasMarkdownEmbed: false,
      lineHeight: 1.7,
      maxLines: 10,
      subjectPreviewVariant: 'fullWidth'
    }),
    'calc(1.7em * 10)'
  );
});

test('lets nested video links own navigation and handles only tile background clicks', () => {
  assert.equal(
    shouldNavigateEmbeddedVideoContainerClick({
      defaultPrevented: true,
      isNestedLink: true
    }),
    false
  );
  assert.equal(
    shouldNavigateEmbeddedVideoContainerClick({
      defaultPrevented: false,
      isNestedLink: true
    }),
    false
  );
  assert.equal(
    shouldNavigateEmbeddedVideoContainerClick({
      defaultPrevented: true,
      isNestedLink: false
    }),
    false
  );
  assert.equal(
    shouldNavigateEmbeddedVideoContainerClick({
      defaultPrevented: false,
      isNestedLink: false
    }),
    true
  );
});

test('makes clickable video tile whitespace interactive to the feed-card pointer gate', () => {
  const originalElement = global.Element;
  const originalNode = global.Node;

  class TestElement {
    constructor({ interactive = false, parent = null } = {}) {
      this.interactive = interactive;
      this.parentElement = parent;
    }

    closest(selector) {
      for (let current = this; current; current = current.parentElement) {
        if (
          current.interactive &&
          selector.includes('[data-feed-card-interactive="true"]')
        ) {
          return current;
        }
      }
      return null;
    }

    contains(candidate) {
      for (let current = candidate; current; current = current.parentElement) {
        if (current === this) return true;
      }
      return false;
    }
  }

  global.Element = TestElement;
  global.Node = TestElement;

  try {
    const card = new TestElement();
    const interactiveTile = new TestElement({
      interactive: true,
      parent: card
    });
    const tileWhitespace = new TestElement({ parent: interactiveTile });
    const plainPreview = new TestElement({ parent: card });

    assert.equal(
      shouldSkipFeedCardNavigation({
        currentTarget: card,
        defaultPrevented: false,
        target: tileWhitespace
      }),
      true
    );
    assert.equal(
      shouldSkipFeedCardNavigation({
        currentTarget: card,
        defaultPrevented: false,
        target: plainPreview
      }),
      false
    );
  } finally {
    global.Element = originalElement;
    global.Node = originalNode;
  }
});

test('routes each RichText embed mode through the complete render pipeline', () => {
  const richTextSource = readSource('src/components/Texts/RichText/index.tsx');
  const markdownSource = readSource(
    'src/components/Texts/RichText/Markdown/index.tsx'
  );
  const embeddedComponentSource = readSource(
    'src/components/Texts/RichText/Markdown/EmbeddedComponent/index.tsx'
  );
  const internalComponentSource = readSource(
    'src/components/Texts/RichText/Markdown/EmbeddedComponent/InternalComponent/index.tsx'
  );
  const mainContentSource = readSource(
    'src/components/Texts/RichText/Markdown/EmbeddedComponent/InternalComponent/MainContentComponent.tsx'
  );
  const wideSubjectEmbedSource = readSource(
    'src/components/Subjects/WideSubjectEmbedPreview.tsx'
  );
  const subjectMediaPreviewSource = readSource(
    'src/components/Subjects/SubjectMediaPreview.tsx'
  );
  const previewPrimitivesSource = readSource(
    'src/containers/Home/Stories/FeedCard/Body/PreviewPrimitives.tsx'
  );
  const targetPreviewSource = readSource(
    'src/containers/Home/Stories/FeedCard/Body/TargetPreview.tsx'
  );
  const contentPreviewSource = readSource('src/components/ContentPreview.tsx');
  const commentSource = readSource(
    'src/components/Comments/Container/Comment.tsx'
  );
  const pinnedCommentSource = readSource(
    'src/components/Comments/Container/PinnedComment/Comment.tsx'
  );
  const replySource = readSource(
    'src/components/Comments/Container/Replies/Reply.tsx'
  );
  const subjectDetailsSource = readSource(
    'src/components/ContentListItem/ContentDetails/SubjectDetails.tsx'
  );
  const rootContentSource = readSource(
    'src/components/ContentListItem/RootContent.tsx'
  );
  const videoThumbSource = readSource('src/components/VideoThumb.tsx');

  assert.match(
    richTextSource,
    /const embedPreviewMode = getRichTextEmbedPreviewMode\(\{[\s\S]*?compactEmbedPreview,[\s\S]*?isPreview/
  );
  assert.match(
    richTextSource,
    /const appliedSubjectPreviewVariant = getRichTextSubjectPreviewVariant\(\{[\s\S]*?compactEmbedPreview,[\s\S]*?subjectPreviewVariant/
  );
  assert.ok(
    (richTextSource.match(/embedPreviewMode=\{embedPreviewMode\}/g) || [])
      .length >= 2,
    'Visible and measurement Markdown must receive the same embed preview mode'
  );
  assert.ok(
    (
      richTextSource.match(
        /subjectPreviewVariant=\{appliedSubjectPreviewVariant\}/g
      ) || []
    ).length >= 2,
    'Visible and measurement Markdown must receive the same subject preview variant'
  );
  assert.ok(
    (markdownSource.match(/embedPreviewMode=\{embedPreviewMode\}/g) || [])
      .length >= 2,
    'Both Markdown image conversion paths must preserve embed preview mode'
  );
  assert.ok(
    (
      markdownSource.match(
        /subjectPreviewVariant=\{subjectPreviewVariant\}/g
      ) || []
    ).length >= 2,
    'Both Markdown image conversion paths must preserve the subject preview variant'
  );
  assert.match(
    embeddedComponentSource,
    /<InternalComponent[\s\S]*?embedPreviewMode=\{embedPreviewMode\}[\s\S]*?subjectPreviewVariant=\{subjectPreviewVariant\}/
  );

  const mainContentDispatch = internalComponentSource.match(
    /if \(mainContentTypes\.includes\(linkType\) && contentId\) \{([\s\S]*?)\n    \}/
  );
  assert.ok(mainContentDispatch, 'Missing main-content internal-link dispatch');
  assert.match(
    mainContentDispatch[1],
    /<MainContentComponent[\s\S]*?embedPreviewMode=\{embedPreviewMode\}[\s\S]*?subjectPreviewVariant=\{subjectPreviewVariant\}/
  );
  assert.match(
    mainContentSource,
    /isSubject &&[\s\S]*?subjectPreviewVariant === 'fullWidth'[\s\S]*?embedPreviewMode === 'fullWidth'[\s\S]*?<WideSubjectEmbedPreview[\s\S]*?contentType: 'subject'/
  );
  assert.match(
    mainContentSource,
    /function handleFullWidthSubjectClick[\s\S]*?event\.stopPropagation\(\);[\s\S]*?navigate\(path\);/
  );
  assert.match(
    wideSubjectEmbedSource,
    /<HomeFeedSubjectTargetPreview[\s\S]*?<CompactEffortStrip[\s\S]*?className="home-feed-card__target-reward-bar"/
  );
  assert.match(
    wideSubjectEmbedSource,
    /resolveWideSubjectMedia\(subject\)[\s\S]*?<SubjectMediaPreview[\s\S]*?descriptor=\{derivedMedia\}/
  );
  assert.match(
    subjectMediaPreviewSource,
    /descriptor\.kind === 'attachment'[\s\S]*?<AttachmentSurface[\s\S]*?descriptor\.kind === 'videoRoot'[\s\S]*?<VideoThumbImage[\s\S]*?<Embedly/
  );
  assert.match(
    wideSubjectEmbedSource,
    /\.home-feed-card__target-reward-bar \.home-feed-card__compact-effort-xp \{[\s\S]*?display: none;/
  );
  assert.match(
    previewPrimitivesSource,
    /function HomeFeedWideSubjectEmbedPreview[\s\S]*?<WideSubjectEmbedPreview/
  );
  assert.match(
    targetPreviewSource,
    /function renderTargetSubjectPreview[\s\S]*?<WideSubjectEmbedPreview/
  );
  assert.match(
    mainContentSource,
    /if \(isSubject\) \{[\s\S]*?<CompactSubjectEmbedPreview/
  );
  assert.match(
    mainContentSource,
    /contentType === 'video' && embedPreviewMode !== 'compactComment'[\s\S]*?<VideoThumb/
  );
  assert.match(
    mainContentSource,
    /function handleVideoClick[\s\S]*?event\.stopPropagation\(\);[\s\S]*?shouldNavigateEmbeddedVideoContainerClick\(\{[\s\S]*?defaultPrevented: event\.defaultPrevented,[\s\S]*?isNestedLink: Boolean\(targetElement\?\.closest\('a'\)\)[\s\S]*?event\.preventDefault\(\);[\s\S]*?navigate\(path\);/
  );
  assert.match(
    videoThumbSource,
    /data-feed-card-interactive=\{onClick \? 'true' : undefined\}[\s\S]*?onClick=\{onClick\}/
  );
  assert.match(
    mainContentSource,
    /hasVideoThumb \|\| hasImageThumb[\s\S]*?compact-main-content-embed--has-media/
  );
  assert.match(
    mainContentSource,
    /\{hasVideoThumb \? \([\s\S]*?<VideoThumbnail[\s\S]*?className="compact-main-content-embed__media"/
  );
  assert.match(
    previewPrimitivesSource,
    /embedPreviewMode=\{[\s\S]*?internalPreviewVariant === 'compact' \? 'thumbnail' : 'fullWidth'/
  );
  assert.equal(
    (contentPreviewSource.match(/subjectPreviewVariant="fullWidth"/g) || [])
      .length,
    3,
    'Each ContentPreview RichText path must explicitly own full-width subject embeds'
  );

  for (const compactCommentSource of [
    commentSource,
    pinnedCommentSource,
    replySource
  ]) {
    assert.match(
      compactCommentSource,
      /<RichText[\s\S]*?compactEmbedPreview=\{compactMode\}/
    );
  }
  assert.match(
    richTextSource,
    /rich-text--compact-comment-embeds[\s\S]*?compact-main-content-embed--has-media[\s\S]*?compact-main-content-embed__media/
  );
  assert.match(subjectDetailsSource, /Posted by \{uploader\.username\}/);
  assert.match(
    rootContentSource,
    /isRewardBarShown[\s\S]*?<RewardLevelBar[\s\S]*?rewardLevel=\{rewardLevel\}/
  );
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

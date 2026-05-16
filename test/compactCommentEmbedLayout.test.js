import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function readSource(path) {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

const commentsDrawerSource = readSource(
  '../src/containers/Build/Runtime/CommentsDrawer.tsx'
);
const commentSource = readSource(
  '../src/components/Comments/Container/Comment.tsx'
);
const replySource = readSource(
  '../src/components/Comments/Container/Replies/Reply.tsx'
);
const pinnedCommentSource = readSource(
  '../src/components/Comments/Container/PinnedComment/Comment.tsx'
);
const richTextSource = readSource('../src/components/Texts/RichText/index.tsx');
const invisibleTextSource = readSource(
  '../src/components/Texts/RichText/InvisibleTextContainer.tsx'
);
const embeddedComponentSource = readSource(
  '../src/components/Texts/RichText/Markdown/EmbeddedComponent/index.tsx'
);
const compactAiCardSource = readSource(
  '../src/components/Texts/RichText/Markdown/EmbeddedComponent/InternalComponent/AICardComponent/CompactPreview.tsx'
);
const compactMultiCardSource = readSource(
  '../src/components/Texts/RichText/Markdown/EmbeddedComponent/InternalComponent/AICardComponent/MultiCardComponent.tsx'
);
const mainContentEmbedSource = readSource(
  '../src/components/Texts/RichText/Markdown/EmbeddedComponent/InternalComponent/MainContentComponent.tsx'
);

assert.match(commentsDrawerSource, /<Comments[\s\S]*compactMode[\s\S]*theme="logoBlue"/);

for (const source of [commentSource, replySource, pinnedCommentSource]) {
  assert.match(source, /<RichText[\s\S]*compactEmbedPreview=\{compactMode\}/);
}

assert.match(richTextSource, /compactEmbedPreview\?: boolean;/);
assert.match(
  richTextSource,
  /const embedPreview = Boolean\(isPreview \|\| compactEmbedPreview\);/
);
assert.match(richTextSource, /isPreview=\{embedPreview\}/);
assert.match(richTextSource, /rich-text--compact-comment-embeds/);
assert.match(richTextSource, /\.rich-text-embedded-component \{/);
assert.match(richTextSource, /max-width: 100%;[\s\S]*min-width: 0;/);
assert.match(
  richTextSource,
  /\.compact-main-content-embed--build\.compact-main-content-embed--has-media \{[\s\S]*grid-template-columns: minmax\(0, 1fr\) !important;/
);
assert.match(richTextSource, /\.compact-main-content-embed__media \{[\s\S]*aspect-ratio: 16 \/ 9;/);
assert.match(richTextSource, /\.compact-ai-card-preview \{[\s\S]*grid-template-columns: 5\.6rem minmax\(0, 1fr\);/);
assert.match(richTextSource, /\.compact-ai-card-preview__market \{[\s\S]*display: none;/);
assert.match(richTextSource, /\.compact-ai-card-multi \{[\s\S]*grid-template-columns: minmax\(0, 1fr\);/);
assert.match(richTextSource, /\.compact-comment-embed--has-media,[\s\S]*grid-template-columns: 3\.8rem minmax\(0, 1fr\) !important;/);
assert.match(richTextSource, /\.compact-comment-embed__media \{[\s\S]*aspect-ratio: 16 \/ 9;/);
assert.match(
  richTextSource,
  /\.compact-default-internal-embed__description,[\s\S]*display: none;/
);

assert.match(invisibleTextSource, /isPreview\?: boolean;/);
assert.match(invisibleTextSource, /theme\?: string;/);
assert.match(invisibleTextSource, /isPreview=\{isPreview\}/);
assert.match(invisibleTextSource, /theme=\{theme\}/);

assert.match(embeddedComponentSource, /rich-text-embedded-component/);
assert.match(embeddedComponentSource, /rich-text-embedded-component--preview/);
assert.match(compactAiCardSource, /compact-ai-card-thumb compact-ai-card-thumb--static/);
assert.match(compactAiCardSource, /compact-ai-card-thumb`?\}/);
assert.match(compactAiCardSource, /compact-ai-card-preview/);
assert.match(compactMultiCardSource, /compact-ai-card-multi/);
assert.match(mainContentEmbedSource, /theme=\{theme\}/);
assert.match(
  mainContentEmbedSource,
  /\.compact-main-content-embed__story-title \{[\s\S]*display: -webkit-box;[\s\S]*overflow: hidden;[\s\S]*text-overflow: ellipsis;[\s\S]*-webkit-box-orient: vertical;[\s\S]*-webkit-line-clamp: 2;/
);
assert.match(
  mainContentEmbedSource,
  /\.compact-main-content-embed__story-title \{[\s\S]*max-height: calc\(2 \* 1\.34em\);/
);
assert.match(
  mainContentEmbedSource,
  /\.compact-main-content-embed__story-body \{[\s\S]*display: -webkit-box;[\s\S]*overflow: hidden;[\s\S]*text-overflow: ellipsis;[\s\S]*-webkit-box-orient: vertical;[\s\S]*-webkit-line-clamp: 3;/
);
assert.match(
  mainContentEmbedSource,
  /\.compact-main-content-embed__story-body \{[\s\S]*max-height: calc\(3 \* 1\.46em\);/
);
assert.doesNotMatch(mainContentEmbedSource, /max\(6\.05rem, 60\.5px\)/);
assert.match(
  mainContentEmbedSource,
  /\.compact-main-content-embed__story-topline span \{[^}]*line-height: 1\.25;/
);
assert.match(
  mainContentEmbedSource,
  /\.compact-main-content-embed__story-topline span:first-child \{[^}]*overflow: visible;[^}]*padding-block: 0\.08rem;[^}]*line-height: 1\.35;/
);
assert.doesNotMatch(
  mainContentEmbedSource,
  /\.compact-main-content-embed__story-topline span \{[^}]*line-height: 1\.1;/
);

console.log('Compact comment RichText embed layout verifier passed.');

import { normalizeRootType } from './navigation';

export type FeedCardPreviewKind =
  | 'ai-story'
  | 'build'
  | 'daily-goals'
  | 'fallback'
  | 'pass'
  | 'reflection'
  | 'shared-topic'
  | 'subject'
  | 'text'
  | 'url'
  | 'video';

export type FeedCardSize =
  | 'attachment-only'
  | 'ai-story-listening'
  | 'ai-story-reading'
  | 'build'
  | 'compact'
  | 'fallback'
  | 'media'
  | 'pass'
  | 'profile'
  | 'reflection'
  | 'reflection-tall'
  | 'reflection-tight'
  | 'rich-embed'
  | 'rich-embed-compact'
  | 'secret'
  | 'standard'
  | 'subject-media'
  | 'subject-minimal'
  | 'subject-rich-embed'
  | 'subject-root'
  | 'subject-tall'
  | 'tall';

export type FeedCardTargetSize = 'compact' | 'fallback' | 'standard';

export type FeedCardFrameSize =
  | 'comment-with-target-card'
  | 'compact-card'
  | 'fallback-card'
  | 'media-card'
  | 'profile-card'
  | 'reflection-card'
  | 'rich-embed-card'
  | 'standard-card'
  | 'tall-card';

export interface MarkdownImageEmbed {
  alt: string;
  src: string;
  type: 'image' | 'internal' | 'unknown' | 'youtube';
}

export interface FeedCardPanelSizing {
  className: string;
  kind: FeedCardPreviewKind;
  reflectionAnswerMaxLines: number;
  size: FeedCardSize;
  subjectDescriptionMaxLines: number;
  textMaxLines: number;
}

export interface FeedCardTargetSizing {
  className: string;
  size: FeedCardTargetSize;
}

export interface FeedCardFrameSizing {
  bodyHeight: string;
  className: string;
  desktopHeight: string;
  hasCommentPreview: boolean;
  hasTarget: boolean;
  headingHeight: string;
  mobileBodyHeight: string;
  mobileHeight: string;
  mobileHeadingHeight: string;
  placeholderHeight: string;
  size: FeedCardFrameSize;
}

export interface FeedCardSizing {
  card: FeedCardFrameSizing;
  flags: {
    hasAttachment: boolean;
    hasCommentPreview: boolean;
    hasRichTextEmbed: boolean;
    secretHidden: boolean;
  };
  main: FeedCardPanelSizing;
  target: FeedCardTargetSizing | null;
}

interface FeedCardSizingParams {
  content: any;
  rootObj?: any;
  targetObj?: any;
  userId?: number | string;
}

const KNOWN_CONTENT_TYPES = new Set([
  'aiStory',
  'build',
  'comment',
  'dailyReflection',
  'pass',
  'sharedTopic',
  'subject',
  'url',
  'video',
  'xpChange'
]);

const PANEL_HEIGHT_REM: Record<
  FeedCardSize,
  { desktop: number; mobile: number }
> = {
  'attachment-only': { desktop: 12, mobile: 11 },
  'ai-story-listening': { desktop: 18, mobile: 17 },
  'ai-story-reading': { desktop: 20, mobile: 19 },
  build: { desktop: 18, mobile: 17 },
  compact: { desktop: 11, mobile: 10 },
  fallback: { desktop: 20, mobile: 19 },
  media: { desktop: 22, mobile: 20 },
  pass: { desktop: 18.5, mobile: 17.5 },
  profile: { desktop: 24, mobile: 23 },
  reflection: { desktop: 27, mobile: 27 },
  'reflection-tall': { desktop: 34, mobile: 32 },
  'reflection-tight': { desktop: 22, mobile: 21 },
  'rich-embed': { desktop: 27, mobile: 25 },
  'rich-embed-compact': { desktop: 21, mobile: 20 },
  secret: { desktop: 12, mobile: 11 },
  standard: { desktop: 20, mobile: 19 },
  'subject-media': { desktop: 21, mobile: 20 },
  'subject-minimal': { desktop: 12, mobile: 11 },
  'subject-rich-embed': { desktop: 34, mobile: 32 },
  'subject-root': { desktop: 14.5, mobile: 14 },
  'subject-tall': { desktop: 32, mobile: 30 },
  tall: { desktop: 30, mobile: 28 }
};

const TARGET_HEIGHT_REM: Record<
  FeedCardTargetSize,
  { desktop: number; mobile: number }
> = {
  compact: { desktop: 8.5, mobile: 8.5 },
  fallback: { desktop: 13, mobile: 12 },
  standard: { desktop: 13, mobile: 12 }
};

const COMMENT_PREVIEW_HEIGHT_REM = {
  desktop: 7.4,
  mobile: 7.05
};

const CARD_FRAME_REM = {
  desktop: {
    actions: 1.6,
    commentPreviewGap: 0.85,
    gapAfterBody: 0.75,
    gapAfterHeading: 0.75,
    heading: 5.6,
    padding: 1.85,
    targetGap: 0.85
  },
  mobile: {
    actions: 1.6,
    commentPreviewGap: 0.85,
    gapAfterBody: 0.75,
    gapAfterHeading: 0.75,
    heading: 5.4,
    padding: 1.65,
    targetGap: 0.85
  }
};
const CARD_BORDER_PX = 2;

export function getFeedCardSizing({
  content,
  rootObj,
  targetObj,
  userId
}: FeedCardSizingParams): FeedCardSizing {
  const normalizedRootType = normalizeRootType(content?.rootType);
  const resolvedRootObj = hasResolvedRootObj(rootObj)
    ? rootObj
    : content?.rootObj || {};
  const resolvedTargetObj = hasResolvedTargetObj(targetObj)
    ? targetObj
    : content?.targetObj || {};
  const secretHidden = getSecretHidden({
    content,
    rootObj: resolvedRootObj,
    targetObj: resolvedTargetObj,
    userId
  });
  const kind = getPreviewKind(content);
  const flags = {
    hasAttachment: hasAttachment(content),
    hasCommentPreview: hasCommentPreview(content),
    hasRichTextEmbed: hasRichTextEmbed(content),
    secretHidden
  };
  const size = getMainPanelSize({
    content,
    flags,
    kind,
    normalizedRootType
  });
  const target = getTargetPanelSizing({
    content,
    normalizedRootType,
    rootObj: resolvedRootObj,
    targetObj: resolvedTargetObj
  });
  const main = {
    className: getFeedCardPanelClassName({ flags, kind, size }),
    kind,
    reflectionAnswerMaxLines: getReflectionAnswerMaxLines(size),
    size,
    subjectDescriptionMaxLines: getSubjectDescriptionMaxLines(size),
    textMaxLines: getTextMaxLines(size)
  };

  return {
    card: getFeedCardFrameSizing({
      hasCommentPreview: flags.hasCommentPreview,
      mainSize: size,
      target
    }),
    flags,
    main,
    target
  };
}

export function removeMarkdownImageEmbeds(text: string) {
  return text
    .replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+['"][^'"]*['"])?\)/g, '')
    .trim();
}

export function getMarkdownImageEmbedPreview(
  text: string
): MarkdownImageEmbed | null {
  const embeds = getMarkdownImageEmbeds(text);
  return embeds[0] || null;
}

function getSecretHidden({
  content,
  rootObj,
  targetObj,
  userId
}: {
  content: any;
  rootObj: any;
  targetObj: any;
  userId?: number | string;
}) {
  const contentUploaderId =
    content?.uploader?.id || content?.userId || content?.uploaderId || 0;
  const contentSecretHidden =
    content?.contentType === 'subject' &&
    hasSubjectSecret(content) &&
    !content?.secretShown &&
    String(contentUploaderId) !== String(userId || '');
  const subjectUploaderId =
    targetObj?.subject?.uploader?.id || targetObj?.subject?.userId || 0;
  const targetSecretHidden =
    content?.contentType === 'comment' &&
    hasSubjectSecret(targetObj?.subject) &&
    !targetObj?.subject?.secretShown &&
    String(subjectUploaderId) !== String(userId || '');
  const rootSecretHidden =
    content?.contentType === 'comment' &&
    hasSubjectSecret(rootObj) &&
    !rootObj?.secretShown &&
    String(
      rootObj?.uploader?.id || rootObj?.userId || rootObj?.uploaderId || 0
    ) !== String(userId || '');

  return Boolean(contentSecretHidden || targetSecretHidden || rootSecretHidden);
}

function hasSubjectSecret(subject: any) {
  return Boolean(
    subject?.hasSecretAnswer ||
    subject?.hasSecretAttachment ||
    subject?.secretAnswer ||
    subject?.secretAttachment
  );
}

function hasResolvedRootObj(rootObj: any) {
  return Boolean(rootObj?.id || rootObj?.notFound);
}

function hasResolvedTargetObj(targetObj: any) {
  return Boolean(targetObj?.comment || targetObj?.subject);
}

function getMainPanelSize({
  content,
  flags,
  kind,
  normalizedRootType
}: {
  content: any;
  flags: FeedCardSizing['flags'];
  kind: FeedCardPreviewKind;
  normalizedRootType: string;
}): FeedCardSize {
  if (flags.secretHidden) {
    return 'secret';
  }

  if (!KNOWN_CONTENT_TYPES.has(String(content?.contentType || ''))) {
    return 'fallback';
  }

  if (content?.contentType === 'comment' && normalizedRootType === 'user') {
    return 'profile';
  }

  if (
    content?.contentType === 'comment' &&
    !String(content?.content || '').trim() &&
    Boolean(content?.filePath)
  ) {
    return 'attachment-only';
  }

  if (content?.contentType === 'subject' && flags.hasRichTextEmbed) {
    return 'subject-rich-embed';
  }

  if (isCompactRichTextEmbedContent(content)) {
    return 'rich-embed-compact';
  }

  if (
    content?.subject &&
    flags.hasRichTextEmbed &&
    isSparseSubjectContent(content)
  ) {
    return 'rich-embed-compact';
  }

  if (flags.hasRichTextEmbed) {
    return 'rich-embed';
  }

  if (kind === 'reflection') {
    return getReflectionPanelSize(content);
  }

  if (kind === 'ai-story') {
    return content?.isListening ? 'ai-story-listening' : 'ai-story-reading';
  }

  if (kind === 'subject') {
    if (
      !content?.description &&
      !content?.content &&
      !content?.secretAnswer &&
      !content?.secretAttachment &&
      !content?.filePath &&
      !hasAttachedRootContent(content)
    ) {
      return 'subject-minimal';
    }

    if (content?.filePath && isSparseSubjectContent(content)) {
      return 'subject-media';
    }

    if (
      hasAttachedRootContent(content) &&
      !content?.filePath &&
      isSparseSubjectContent(content)
    ) {
      return 'subject-root';
    }

    return 'subject-tall';
  }

  if (kind === 'build') {
    return 'build';
  }

  if (kind === 'pass') {
    return 'pass';
  }

  if (
    kind === 'daily-goals' ||
    kind === 'shared-topic' ||
    kind === 'url' ||
    kind === 'video' ||
    flags.hasAttachment
  ) {
    return 'media';
  }

  return getPlainTextPanelSize(content);
}

function getTargetPanelSizing({
  content,
  normalizedRootType,
  rootObj,
  targetObj
}: {
  content: any;
  normalizedRootType: string;
  rootObj: any;
  targetObj: any;
}): FeedCardTargetSizing | null {
  const targetSubject = targetObj?.subject;
  const targetComment = targetObj?.comment;

  if (targetComment && !targetComment.notFound) {
    return buildTargetSizing(
      isTargetCommentCompact(targetComment) ? 'compact' : 'standard',
      targetComment.filePath ? ['attachment'] : []
    );
  }

  if (targetSubject?.id) {
    return buildTargetSizing('standard');
  }

  const hasExpectedRootTarget = Boolean(
    Number(rootObj?.id || content?.rootId || 0) > 0 && normalizedRootType
  );

  if (!hasExpectedRootTarget || rootObj.notFound) {
    return null;
  }

  if (
    content?.contentType !== 'comment' &&
    content?.contentType !== 'subject'
  ) {
    return null;
  }

  if (normalizedRootType === 'user') {
    return null;
  }

  if (normalizedRootType === 'url') {
    const subjectRootUrl = content?.contentType === 'subject';
    return buildTargetSizing(subjectRootUrl ? 'compact' : 'standard', [
      subjectRootUrl ? 'url-target-compact' : 'url-target'
    ]);
  }

  const standardRootTypes =
    content?.contentType === 'subject'
      ? ['aiStory', 'build', 'subject', 'video']
      : [
          'aiStory',
          'build',
          'dailyReflection',
          'pass',
          'sharedTopic',
          'subject',
          'video',
          'xpChange'
        ];

  if (standardRootTypes.includes(normalizedRootType)) {
    return buildTargetSizing('standard');
  }

  return buildTargetSizing('fallback');
}

function buildTargetSizing(
  size: FeedCardTargetSize,
  modifiers: string[] = []
): FeedCardTargetSizing {
  const legacyClasses = [
    size === 'compact' ? 'home-feed-card__target-preview--compact' : '',
    modifiers.includes('attachment')
      ? 'home-feed-card__target-preview--attachment'
      : '',
    modifiers.includes('url-target') ? 'home-feed-card__url-target' : '',
    modifiers.includes('url-target-compact')
      ? 'home-feed-card__url-target home-feed-card__url-target-compact'
      : ''
  ].filter(Boolean);

  return {
    className: [
      'home-feed-card__target-preview',
      `home-feed-card__target-preview--size-${size}`,
      ...legacyClasses
    ].join(' '),
    size
  };
}

function getFeedCardFrameSizing({
  hasCommentPreview,
  mainSize,
  target
}: {
  hasCommentPreview: boolean;
  mainSize: FeedCardSize;
  target: FeedCardTargetSizing | null;
}): FeedCardFrameSizing {
  const desktopBodyHeight = getBodyHeight({
    axis: 'desktop',
    hasCommentPreview,
    mainSize,
    target
  });
  const mobileBodyHeight = getBodyHeight({
    axis: 'mobile',
    hasCommentPreview,
    mainSize,
    target
  });
  const desktopFrame = CARD_FRAME_REM.desktop;
  const mobileFrame = CARD_FRAME_REM.mobile;
  const desktopHeight =
    desktopFrame.padding +
    desktopFrame.heading +
    desktopFrame.gapAfterHeading +
    desktopBodyHeight +
    desktopFrame.gapAfterBody +
    desktopFrame.actions;
  const mobileHeight =
    mobileFrame.padding +
    mobileFrame.heading +
    mobileFrame.gapAfterHeading +
    mobileBodyHeight +
    mobileFrame.gapAfterBody +
    mobileFrame.actions;

  const size = getFeedCardFrameSize({ mainSize, target });

  return {
    bodyHeight: toCssFixedHeight(desktopBodyHeight),
    className: `home-feed-card--size-${size}`,
    desktopHeight: toCssFixedHeight(desktopHeight, CARD_BORDER_PX),
    hasCommentPreview,
    hasTarget: Boolean(target),
    headingHeight: toCssFixedHeight(desktopFrame.heading),
    mobileBodyHeight: toCssFixedHeight(mobileBodyHeight),
    mobileHeight: toCssFixedHeight(mobileHeight, CARD_BORDER_PX),
    mobileHeadingHeight: toCssFixedHeight(mobileFrame.heading),
    placeholderHeight: toCssFixedHeight(desktopHeight, CARD_BORDER_PX),
    size
  };
}

function getBodyHeight({
  axis,
  hasCommentPreview,
  mainSize,
  target
}: {
  axis: 'desktop' | 'mobile';
  hasCommentPreview: boolean;
  mainSize: FeedCardSize;
  target: FeedCardTargetSizing | null;
}) {
  const panelHeight = PANEL_HEIGHT_REM[mainSize][axis];
  const targetHeight = target
    ? CARD_FRAME_REM[axis].targetGap + TARGET_HEIGHT_REM[target.size][axis]
    : 0;
  const commentPreviewHeight = hasCommentPreview
    ? CARD_FRAME_REM[axis].commentPreviewGap + COMMENT_PREVIEW_HEIGHT_REM[axis]
    : 0;

  return panelHeight + targetHeight + commentPreviewHeight;
}

function getFeedCardFrameSize({
  mainSize,
  target
}: {
  mainSize: FeedCardSize;
  target: FeedCardTargetSizing | null;
}): FeedCardFrameSize {
  if (target) {
    return 'comment-with-target-card';
  }

  if (mainSize === 'fallback') {
    return 'fallback-card';
  }

  if (mainSize === 'profile') {
    return 'profile-card';
  }

  if (mainSize === 'rich-embed' || mainSize === 'rich-embed-compact') {
    return 'rich-embed-card';
  }

  if (
    mainSize === 'reflection' ||
    mainSize === 'reflection-tight' ||
    mainSize === 'reflection-tall'
  ) {
    return 'reflection-card';
  }

  if (
    mainSize === 'ai-story-listening' ||
    mainSize === 'ai-story-reading' ||
    mainSize === 'media' ||
    mainSize === 'build' ||
    mainSize === 'pass' ||
    mainSize === 'subject-media'
  ) {
    return 'media-card';
  }

  if (
    mainSize === 'tall' ||
    mainSize === 'subject-tall' ||
    mainSize === 'subject-rich-embed'
  ) {
    return 'tall-card';
  }

  if (
    mainSize === 'compact' ||
    mainSize === 'attachment-only' ||
    mainSize === 'secret' ||
    mainSize === 'subject-minimal' ||
    mainSize === 'subject-root'
  ) {
    return 'compact-card';
  }

  return 'standard-card';
}

function toCssFixedHeight(remValue: number, extraPx = 0) {
  const roundedRem = Number(remValue.toFixed(2));
  const roundedPx = Number((remValue * 10).toFixed(1));
  const baseHeight = `max(${roundedRem}rem, ${roundedPx}px)`;

  return extraPx ? `calc(${baseHeight} + ${extraPx}px)` : baseHeight;
}

function getFeedCardPanelClassName({
  flags,
  kind,
  size
}: {
  flags: FeedCardSizing['flags'];
  kind: FeedCardPreviewKind;
  size: FeedCardSize;
}) {
  const modifierClasses = [
    flags.hasRichTextEmbed && !flags.secretHidden
      ? 'home-feed-card__panel-preview--rich-embed'
      : '',
    flags.hasAttachment && !flags.secretHidden
      ? 'home-feed-card__panel-preview--has-attachment'
      : ''
  ].filter(Boolean);

  return [
    'home-feed-card__panel-preview',
    `home-feed-card__panel-preview--${kind}`,
    `home-feed-card__panel-preview--size-${size}`,
    ...modifierClasses
  ].join(' ');
}

function getPreviewKind(content: any): FeedCardPreviewKind {
  if (!KNOWN_CONTENT_TYPES.has(String(content?.contentType || ''))) {
    return 'fallback';
  }

  if (content?.contentType === 'dailyReflection') {
    return 'reflection';
  }

  if (content?.contentType === 'xpChange') {
    return 'daily-goals';
  }

  if (content?.contentType === 'pass') {
    return 'pass';
  }

  if (content?.contentType === 'sharedTopic') {
    return 'shared-topic';
  }

  if (content?.contentType === 'url') {
    return 'url';
  }

  if (content?.contentType === 'video') {
    return 'video';
  }

  if (content?.contentType === 'build') {
    return 'build';
  }

  if (content?.contentType === 'aiStory') {
    return 'ai-story';
  }

  if (content?.contentType === 'subject' || content?.subject) {
    return 'subject';
  }

  return 'text';
}

function hasAttachment(content: any) {
  return Boolean(content?.filePath || content?.actualFilePath);
}

function hasCommentPreview(content: any) {
  if (typeof content?.__homeFeedHasCommentPreview === 'boolean') {
    return content.__homeFeedHasCommentPreview;
  }

  return getPreviewCommentCount(content) > 0;
}

function getPreviewCommentCount(content: any) {
  const count = Number(
    content?.numComments ??
      content?.commentCount ??
      content?.numReplies ??
      content?.replyCount ??
      content?.numAnswers ??
      content?.answerCount ??
      0
  );
  if (count > 0) return count;

  return Array.isArray(content?.comments) ? content.comments.length : 0;
}

function hasRichTextEmbed(content: any) {
  const text =
    content?.content ||
    content?.description ||
    content?.question ||
    content?.answer ||
    content?.body ||
    '';

  return Boolean(getMarkdownImageEmbedPreview(String(text)));
}

function isSparseSubjectContent(content: any) {
  const title = String(content?.title || '').trim();
  const description = removeMarkdownImageEmbeds(
    String(content?.description || content?.content || '')
  ).trim();
  const secretAnswer = String(content?.secretAnswer || '').trim();

  return (
    title.length + description.length + secretAnswer.length < 180 &&
    !String(content?.instructions || '').trim() &&
    !String(content?.rewardDescription || '').trim()
  );
}

function hasAttachedRootContent(content: any) {
  return Boolean(
    content?.contentType === 'subject' &&
    normalizeRootType(content?.rootType) &&
    Number(content?.rootId || 0) > 0
  );
}

function isCompactRichTextEmbedContent(content: any) {
  const embedPreview = getMarkdownImageEmbedPreview(
    String(content?.content || content?.description || '')
  );

  if (!embedPreview) {
    return false;
  }

  const plainTextLength = getPlainTextLength(content);
  if (embedPreview.type === 'image') {
    return plainTextLength > 0 && plainTextLength <= 120;
  }

  return plainTextLength <= 120;
}

function getPlainTextPanelSize(content: any): FeedCardSize {
  const plainTextLength = getPlainTextLength(content);

  if (plainTextLength <= 140 && !content?.title && !content?.filePath) {
    return 'compact';
  }

  if (plainTextLength > 520) {
    return 'tall';
  }

  return 'standard';
}

function getReflectionPanelSize(content: any): FeedCardSize {
  const answerLength = String(
    content?.answer ||
      content?.reflection ||
      content?.description ||
      content?.content ||
      ''
  ).trim().length;

  if (answerLength <= 180) {
    return 'reflection-tight';
  }

  if (answerLength > 720) {
    return 'reflection-tall';
  }

  return 'reflection';
}

function getTextMaxLines(size: FeedCardSize) {
  if (size === 'compact' || size === 'attachment-only') {
    return 5;
  }

  if (size === 'media') {
    return 6;
  }

  if (size === 'tall') {
    return 13;
  }

  if (size === 'rich-embed' || size === 'rich-embed-compact') {
    return 10;
  }

  if (size === 'fallback') {
    return 8;
  }

  return 9;
}

function getReflectionAnswerMaxLines(size: FeedCardSize) {
  if (size === 'reflection-tight') {
    return 6;
  }

  if (size === 'reflection-tall') {
    return 13;
  }

  return 9;
}

function getSubjectDescriptionMaxLines(size: FeedCardSize) {
  if (size === 'subject-rich-embed') {
    return 3;
  }

  if (size === 'rich-embed') {
    return 7;
  }

  if (size === 'rich-embed-compact') {
    return 5;
  }

  if (size === 'subject-media') {
    return 7;
  }

  if (size === 'subject-minimal' || size === 'subject-root') {
    return 3;
  }

  return 10;
}

function getPlainTextLength(content: any) {
  return removeMarkdownImageEmbeds(
    String(
      content?.content ||
        content?.description ||
        content?.answer ||
        content?.body ||
        content?.title ||
        ''
    )
  ).length;
}

function isTargetCommentCompact(targetComment: any) {
  const content = String(targetComment?.content || '');
  const embedPreview = getMarkdownImageEmbedPreview(content);
  const textWithoutEmbeds = embedPreview
    ? removeMarkdownImageEmbeds(content)
    : content;

  return (
    !textWithoutEmbeds.trim() &&
    Boolean(targetComment?.filePath || embedPreview)
  );
}

function getMarkdownImageEmbeds(text: string): MarkdownImageEmbed[] {
  if (!text) {
    return [];
  }

  return Array.from(
    text.matchAll(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+['"][^'"]*['"])?\)/g)
  ).map((match) => {
    const src = match[2]?.trim() || '';

    return {
      alt: match[1]?.trim() || '',
      src,
      type: getMarkdownEmbedType(src)
    };
  });
}

function getMarkdownEmbedType(src: string): MarkdownImageEmbed['type'] {
  if (!src) {
    return 'unknown';
  }

  if (isYoutubeUrl(src)) {
    return 'youtube';
  }

  if (isInternalEmbedSrc(src)) {
    return 'internal';
  }

  return 'image';
}

function isInternalEmbedSrc(src: string) {
  const internalHostRegex =
    /^(https?:\/\/(?:www\.)?|www\.)(twin-kle\.com|twinkle\.network|localhost:3000)/;

  if (internalHostRegex.test(src)) {
    return true;
  }

  try {
    const url = new URL(src, window.location.origin);
    return (
      url.hostname === window.location.hostname && url.pathname.startsWith('/')
    );
  } catch {
    return src.startsWith('/');
  }
}

function isYoutubeUrl(src: string) {
  return /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)/i.test(
    src
  );
}

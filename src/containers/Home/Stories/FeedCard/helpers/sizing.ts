import { normalizeRootType } from './navigation';
import { isRenderableHomeFeedTargetComment } from './targetComment';
import { isAICardEmbedSrc } from '~/helpers/aiCardEmbedHelpers';

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
  | 'compact-desktop'
  | 'fallback'
  | 'media'
  | 'media-attachment'
  | 'media-attachment-with-text'
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
  | 'subject-locked'
  | 'subject-rich-embed'
  | 'subject-root'
  | 'subject-root-text'
  | 'subject-secret-compact'
  | 'subject-secret-preview'
  | 'subject-secret-media'
  | 'subject-tall'
  | 'tall'
  | 'url';

export type FeedCardTargetSize =
  | 'compact'
  | 'fallback'
  | 'media-comment'
  | 'standard';
export type FeedCardLayoutAxis = 'desktop' | 'mobile';

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
  mobileTextMaxLines: number;
  reflectionAnswerMaxLines: number;
  size: FeedCardSize;
  subjectDescriptionMaxLines: number;
  textMaxLines: number;
}

export interface FeedCardSubjectPreviewLineLimits {
  descriptionMaxLines: number;
  secretMaxLines: number;
}

export interface FeedCardTargetSizing {
  className: string;
  size: FeedCardTargetSize;
}

export interface FeedCardFrameSizing {
  bodyHeight: string;
  className: string;
  commentPreviewHeight: string;
  desktopHeight: string;
  hasCommentPreview: boolean;
  hasTarget: boolean;
  headingHeight: string;
  mobileBodyHeight: string;
  mobileCommentPreviewHeight: string;
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
  build: { desktop: 18, mobile: 14 },
  compact: { desktop: 11, mobile: 10 },
  'compact-desktop': { desktop: 11, mobile: 19 },
  fallback: { desktop: 20, mobile: 19 },
  media: { desktop: 22, mobile: 20 },
  'media-attachment': { desktop: 40, mobile: 25 },
  'media-attachment-with-text': { desktop: 45, mobile: 31 },
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
  'subject-locked': { desktop: 16.5, mobile: 15.5 },
  'subject-rich-embed': { desktop: 34, mobile: 32 },
  'subject-root': { desktop: 15.5, mobile: 15.5 },
  'subject-root-text': { desktop: 29, mobile: 27 },
  'subject-secret-compact': { desktop: 17.5, mobile: 18.5 },
  'subject-secret-preview': { desktop: 22, mobile: 22 },
  'subject-secret-media': { desktop: 25, mobile: 24 },
  'subject-tall': { desktop: 32, mobile: 30 },
  tall: { desktop: 30, mobile: 28 },
  url: { desktop: 25, mobile: 23 }
};

const TARGET_HEIGHT_REM: Record<
  FeedCardTargetSize,
  { desktop: number; mobile: number }
> = {
  compact: { desktop: 8.5, mobile: 8.5 },
  fallback: { desktop: 13, mobile: 12 },
  'media-comment': { desktop: 20, mobile: 18 },
  standard: { desktop: 13, mobile: 12 }
};

const COMMENT_PREVIEW_HEIGHT_REM = {
  desktop: 7.4,
  mobile: 7.05
};

const CARD_FRAME_REM = {
  desktop: {
    actions: 2.95,
    commentPreviewGap: 0.85,
    gapAfterBody: 0.75,
    gapAfterHeading: 0.75,
    heading: 5.6,
    padding: 1.85,
    targetGap: 0.85
  },
  mobile: {
    actions: 3.1,
    commentPreviewGap: 1,
    gapAfterBody: 0.75,
    gapAfterHeading: 0.75,
    heading: 6.2,
    padding: 0.95,
    targetGap: 0.85
  }
};
const CARD_BORDER_PX = 2;
const REFLECTION_PREVIEW_LAYOUT_REM = {
  answerLineHeight: 1.9 * 1.36,
  footerMinHeight: 2.35,
  minAnswerLines: 2,
  mobileMasterpieceFooterMinHeight: 4.7,
  paddingY: 2,
  questionBorderY: 0.13,
  questionCharsPerLine: {
    desktop: 64,
    mobile: 34
  },
  questionContentGap: 0.35,
  questionLabelLines: 1,
  questionLineHeight: 1.85 * 1.32,
  questionMaxLines: 2,
  questionPaddingY: 1.7,
  rowGap: 0.75
};
const SUBJECT_PREVIEW_LAYOUT_REM = {
  attachmentSecretMinHeight: 5.9,
  descriptionLineHeight: 1.9 * 1.36,
  effortHeight: 2.9,
  gap: 0.85,
  minDescriptionLines: 2,
  previewPaddingY: 1.6,
  secretLineHeight: 1.8 * 1.3,
  secretMaxLines: 3,
  secretMinHeight: 5.4,
  secretPaddingY: 1.7,
  titleCharsPerLine: {
    desktop: 44,
    mobile: 38
  },
  titleLineHeight: {
    desktop: 2 * 1.28,
    mobile: 1.5 * 1.28
  },
  titleMaxLines: 2,
  titlePaddingBottom: {
    desktop: 2 * 0.08,
    mobile: 1.5 * 0.08
  }
};
const SUBJECT_ROOT_PREVIEW_LAYOUT_REM = {
  ...SUBJECT_PREVIEW_LAYOUT_REM,
  effortHeight: 2.6,
  gap: 0.72,
  previewPaddingY: 0.8,
  titleCharsPerLine: {
    desktop: 52,
    mobile: 34
  },
  titleLineHeight: {
    desktop: 2.064 * 1.12,
    mobile: 2.064 * 1.12
  },
  titlePaddingBottom: {
    desktop: 0,
    mobile: 0
  }
};
const PLAIN_TEXT_PREVIEW_LAYOUT = {
  charsPerLine: {
    desktop: 54,
    mobile: 34
  },
  compactDesktopCharsPerLine: 62,
  compactMaxLines: {
    desktop: 2,
    mobile: 3
  },
  desktopLineHeightBonus: 2,
  mobileLineHeightBonus: 3,
  tallRawLength: 520
};

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
    kind
  });
  const target = getTargetPanelSizing({
    content,
    flags,
    normalizedRootType,
    rootObj: resolvedRootObj,
    targetObj: resolvedTargetObj
  });
  const main = {
    className: getFeedCardPanelClassName({ flags, kind, size }),
    kind,
    mobileTextMaxLines: getTextMaxLines(size, 'mobile'),
    reflectionAnswerMaxLines: getReflectionAnswerMaxLines(size),
    size,
    subjectDescriptionMaxLines: getSubjectDescriptionMaxLines(size),
    textMaxLines: getTextMaxLines(size, 'desktop')
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

export function getDailyReflectionAnswerPreviewMaxLines({
  axis = 'desktop',
  content,
  maxLines,
  size
}: {
  axis?: FeedCardLayoutAxis;
  content: any;
  maxLines: number;
  size: FeedCardSize;
}) {
  const maxLineCount = Math.max(1, Math.floor(Number(maxLines) || 0));
  const hasQuestion = Boolean(String(content?.question || '').trim());
  const hasFooter = hasDailyReflectionMetaBadges(content);

  if (!hasQuestion && !hasFooter) {
    return maxLineCount;
  }

  return Math.min(
    maxLineCount,
    getDailyReflectionAnswerLineBudget({ axis, content, size })
  );
}

export function getSharedTopicPreviewMaxLines(main: FeedCardPanelSizing) {
  return Math.min(main.textMaxLines, 4);
}

export function getSubjectPreviewLineLimits({
  axis = 'desktop',
  content,
  hasDescriptionText,
  hasEffort,
  hasSecretAnswer,
  hasSecretAnswerText,
  hasSecretAttachment,
  hasTitle,
  size
}: {
  axis?: FeedCardLayoutAxis;
  content: any;
  hasDescriptionText: boolean;
  hasEffort: boolean;
  hasSecretAnswer: boolean;
  hasSecretAnswerText: boolean;
  hasSecretAttachment: boolean;
  hasTitle: boolean;
  size: FeedCardSize;
}): FeedCardSubjectPreviewLineLimits {
  const secretMaxLines = getSubjectSecretAnswerMaxLines({
    axis,
    content,
    hasSecretAnswerText
  });

  if (!hasDescriptionText) {
    return {
      descriptionMaxLines: 0,
      secretMaxLines
    };
  }

  return {
    descriptionMaxLines: getSubjectDescriptionLineBudget({
      axis,
      content,
      hasDescriptionText,
      hasEffort,
      hasSecretAnswer,
      hasSecretAnswerText,
      hasSecretAttachment,
      hasTitle,
      secretMaxLines,
      size
    }),
    secretMaxLines
  };
}

export function hasDailyReflectionMetaBadges(content: any) {
  return Boolean(
    content?.grade === 'Masterpiece' ||
    content?.isRefined ||
    Number(content?.xpAwarded || 0) > 0 ||
    Number(content?.streakAtTime || 0) > 0
  );
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

function shouldShowPublicSubjectPreview(content: any) {
  if (content?.contentType !== 'subject') return false;

  return Boolean(
    String(content?.title || '').trim() ||
    String(content?.description || content?.content || '').trim() ||
    content?.filePath ||
    content?.actualFilePath ||
    Number(content?.rewardLevel || 0) > 0 ||
    hasAttachedRootContent(content)
  );
}

function hasResolvedRootObj(rootObj: any) {
  return Boolean(rootObj?.id || rootObj?.notFound);
}

function hasResolvedTargetObj(targetObj: any) {
  return Boolean(
    targetObj?.comment ||
    targetObj?.subject ||
    targetObj?.user ||
    targetObj?.contentType === 'user'
  );
}

function getMainPanelSize({
  content,
  flags,
  kind
}: {
  content: any;
  flags: FeedCardSizing['flags'];
  kind: FeedCardPreviewKind;
}): FeedCardSize {
  if (flags.secretHidden && !shouldShowPublicSubjectPreview(content)) {
    return 'secret';
  }

  if (!KNOWN_CONTENT_TYPES.has(String(content?.contentType || ''))) {
    return 'fallback';
  }

  if (
    content?.contentType === 'comment' &&
    !String(content?.content || '').trim() &&
    hasAttachment(content)
  ) {
    return hasPreviewableMediaAttachment(content)
      ? 'media-attachment'
      : 'attachment-only';
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
    if (flags.secretHidden) {
      return getLockedSubjectPanelSize(content);
    }

    if (hasAttachedRootContent(content) && !content?.filePath) {
      return getSubjectWithRootPanelSize(content);
    }

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

    return getPlainSubjectPanelSize(content);
  }

  if (kind === 'build') {
    return 'build';
  }

  if (kind === 'url') {
    return 'url';
  }

  if (kind === 'pass') {
    return 'pass';
  }

  if (
    content?.contentType === 'comment' &&
    hasPreviewableMediaAttachment(content)
  ) {
    return 'media-attachment-with-text';
  }

  if (
    kind === 'daily-goals' ||
    kind === 'shared-topic' ||
    kind === 'video' ||
    flags.hasAttachment
  ) {
    return 'media';
  }

  return getPlainTextPanelSize(content);
}

function getTargetPanelSizing({
  content,
  flags,
  normalizedRootType,
  rootObj,
  targetObj
}: {
  content: any;
  flags: FeedCardSizing['flags'];
  normalizedRootType: string;
  rootObj: any;
  targetObj: any;
}): FeedCardTargetSizing | null {
  const targetSubject = targetObj?.subject;
  const targetComment = targetObj?.comment;
  const targetUser =
    targetObj?.user || (targetObj?.contentType === 'user' ? targetObj : null);

  if (content?.contentType === 'comment' && normalizedRootType === 'user') {
    return targetUser?.id || rootObj?.id || content?.rootId
      ? buildTargetSizing('standard')
      : null;
  }

  if (isRenderableHomeFeedTargetComment(targetComment)) {
    if (flags.secretHidden) return null;

    if (hasTargetCommentMedia(targetComment)) {
      return buildTargetSizing('media-comment');
    }

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

  if (normalizedRootType === 'url') {
    return buildTargetSizing('standard', ['url-target']);
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
    mainSize,
    target
  });
  const mobileBodyHeight = getBodyHeight({
    axis: 'mobile',
    mainSize,
    target
  });
  const desktopCommentPreviewFrameHeight = hasCommentPreview
    ? CARD_FRAME_REM.desktop.commentPreviewGap +
      COMMENT_PREVIEW_HEIGHT_REM.desktop
    : 0;
  const mobileCommentPreviewFrameHeight = hasCommentPreview
    ? CARD_FRAME_REM.mobile.commentPreviewGap +
      COMMENT_PREVIEW_HEIGHT_REM.mobile
    : 0;
  const desktopFrame = CARD_FRAME_REM.desktop;
  const mobileFrame = CARD_FRAME_REM.mobile;
  const desktopHeight =
    desktopFrame.padding +
    desktopFrame.heading +
    desktopFrame.gapAfterHeading +
    desktopBodyHeight +
    desktopFrame.gapAfterBody +
    desktopFrame.actions +
    desktopCommentPreviewFrameHeight;
  const mobileHeight =
    mobileFrame.padding +
    mobileFrame.heading +
    mobileFrame.gapAfterHeading +
    mobileBodyHeight +
    mobileFrame.gapAfterBody +
    mobileFrame.actions +
    mobileCommentPreviewFrameHeight;

  const size = getFeedCardFrameSize({ mainSize, target });

  return {
    bodyHeight: toCssFixedHeight(desktopBodyHeight),
    className: `home-feed-card--size-${size}`,
    commentPreviewHeight: toCssFixedHeight(COMMENT_PREVIEW_HEIGHT_REM.desktop),
    desktopHeight: toCssFixedHeight(desktopHeight, CARD_BORDER_PX),
    hasCommentPreview,
    hasTarget: Boolean(target),
    headingHeight: toCssFixedHeight(desktopFrame.heading),
    mobileBodyHeight: toCssFixedHeight(mobileBodyHeight),
    mobileCommentPreviewHeight: toCssFixedHeight(
      COMMENT_PREVIEW_HEIGHT_REM.mobile
    ),
    mobileHeight: toCssFixedHeight(mobileHeight, CARD_BORDER_PX),
    mobileHeadingHeight: toCssFixedHeight(mobileFrame.heading),
    placeholderHeight: toCssFixedHeight(desktopHeight, CARD_BORDER_PX),
    size
  };
}

function getBodyHeight({
  axis,
  mainSize,
  target
}: {
  axis: 'desktop' | 'mobile';
  mainSize: FeedCardSize;
  target: FeedCardTargetSizing | null;
}) {
  const panelHeight = PANEL_HEIGHT_REM[mainSize][axis];
  const targetHeight = target
    ? CARD_FRAME_REM[axis].targetGap + TARGET_HEIGHT_REM[target.size][axis]
    : 0;

  return panelHeight + targetHeight;
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
    mainSize === 'media-attachment' ||
    mainSize === 'media-attachment-with-text' ||
    mainSize === 'url' ||
    mainSize === 'build' ||
    mainSize === 'pass' ||
    mainSize === 'subject-media' ||
    mainSize === 'subject-secret-media'
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
    mainSize === 'subject-locked' ||
    mainSize === 'subject-minimal' ||
    mainSize === 'subject-root' ||
    mainSize === 'subject-secret-compact'
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

function hasPreviewableMediaAttachment(content: any) {
  if (!hasAttachment(content)) return false;

  const fileType = getAttachmentFileType(content);
  return fileType === 'image' || fileType === 'video';
}

function getAttachmentFileType(content: any) {
  const attachmentName = String(
    content?.fileName ||
      content?.actualFileName ||
      content?.filePath ||
      content?.actualFilePath ||
      ''
  );
  const extension =
    attachmentName
      .split('?')[0]
      .split('#')[0]
      .split('.')
      .pop()
      ?.toLowerCase?.() || '';

  if (
    [
      'jpg',
      'png',
      'jpeg',
      'bmp',
      'gif',
      'webp',
      'svg',
      'heic',
      'heif'
    ].includes(extension)
  ) {
    return 'image';
  }

  if (['wmv', 'mov', 'mp4', '3gp', 'ogg', 'm4v'].includes(extension)) {
    return 'video';
  }

  return '';
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

function getSubjectWithRootPanelSize(content: any): FeedCardSize {
  const descriptionLength = getSubjectDescriptionTextLength(content);
  const secretLength = getPlainTextValueLength(content?.secretAnswer);
  const hasDescription = descriptionLength > 0;
  const hasSecret = secretLength > 0 || Boolean(content?.secretAttachment);
  const hasEffort = Number(content?.rewardLevel || 0) > 0;

  if (content?.secretAttachment) {
    if (!secretLength && !hasEffort && descriptionLength <= 420) {
      return 'subject-secret-media';
    }
    return 'subject-tall';
  }

  if (!hasDescription && !hasSecret && !hasEffort) {
    return 'compact';
  }

  if (!hasDescription) {
    return secretLength > 80 ? 'standard' : 'subject-root';
  }

  if (secretLength > 160) {
    return 'subject-tall';
  }

  if (descriptionLength <= 180 && secretLength <= 80) {
    return 'subject-root';
  }

  if (descriptionLength <= 420 && secretLength <= 120) {
    return 'standard';
  }

  if (descriptionLength > 950) {
    return 'subject-tall';
  }

  return 'subject-root-text';
}

function getPlainSubjectPanelSize(content: any): FeedCardSize {
  const descriptionLength = getSubjectDescriptionTextLength(content);
  const fitsCompactDescription =
    getSubjectDescriptionPreviewLineCount({
      axis: 'desktop',
      content
    }) <= getSubjectNonTallDescriptionMaxLines('compact') &&
    getSubjectDescriptionPreviewLineCount({
      axis: 'mobile',
      content
    }) <= getSubjectNonTallDescriptionMaxLines('compact');
  const secretLength = getPlainTextValueLength(content?.secretAnswer);
  const hasEffort = Number(content?.rewardLevel || 0) > 0;

  if (content?.secretAttachment || content?.filePath) {
    if (
      content?.secretAttachment &&
      !secretLength &&
      !content?.filePath &&
      descriptionLength <= 420
    ) {
      return 'subject-secret-media';
    }
    return 'subject-tall';
  }

  if (descriptionLength <= 180 && secretLength > 0 && fitsCompactDescription) {
    return getShortPublicSubjectSecretPanelSize(content);
  }

  if (secretLength > 160 || descriptionLength > 750) {
    return 'subject-tall';
  }

  if (
    !hasEffort &&
    secretLength === 0 &&
    descriptionLength <= 120 &&
    fitsCompactDescription
  ) {
    return 'compact';
  }

  if (descriptionLength <= 420 && secretLength <= 120) {
    return 'standard';
  }

  return 'subject-tall';
}

function getShortPublicSubjectSecretPanelSize(content: any): FeedCardSize {
  const maxSecretLines = Math.max(
    getSubjectSecretAnswerMaxLines({
      axis: 'desktop',
      content,
      hasSecretAnswerText: true
    }),
    getSubjectSecretAnswerMaxLines({
      axis: 'mobile',
      content,
      hasSecretAnswerText: true
    })
  );

  return maxSecretLines <= 2
    ? 'subject-secret-compact'
    : 'subject-secret-preview';
}

function getLockedSubjectPanelSize(content: any): FeedCardSize {
  const descriptionLength = getSubjectDescriptionTextLength(content);
  const hasLockedSecret = Boolean(
    content?.hasSecretAnswer ||
      content?.hasSecretAttachment ||
      content?.secretAnswer ||
      content?.secretAttachment
  );

  if (content?.filePath && isSparseSubjectContent(content)) {
    return hasLockedSecret ? 'subject-secret-media' : 'subject-media';
  }

  if (descriptionLength > 420 || content?.filePath) {
    return 'subject-tall';
  }

  return 'subject-locked';
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
  if (
    plainTextLength === 0 &&
    embedPreview.type === 'internal' &&
    isAICardEmbedSrc(embedPreview.src)
  ) {
    return false;
  }
  if (embedPreview.type === 'image') {
    return plainTextLength > 0 && plainTextLength <= 120;
  }

  return plainTextLength <= 120;
}

function getPlainTextPanelSize(content: any): FeedCardSize {
  const plainTextLength = getPlainTextLength(content);

  if (isCompactPlainTextPreview(content)) {
    return 'compact';
  }

  if (isDesktopCompactPlainTextPreview(content)) {
    return 'compact-desktop';
  }

  if (plainTextLength > PLAIN_TEXT_PREVIEW_LAYOUT.tallRawLength) {
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

function getTextMaxLines(
  size: FeedCardSize,
  axis: FeedCardLayoutAxis = 'desktop'
) {
  const lineHeightBonus =
    axis === 'mobile'
      ? PLAIN_TEXT_PREVIEW_LAYOUT.mobileLineHeightBonus
      : PLAIN_TEXT_PREVIEW_LAYOUT.desktopLineHeightBonus;

  if (size === 'compact' || size === 'attachment-only') {
    return PLAIN_TEXT_PREVIEW_LAYOUT.compactMaxLines[axis];
  }

  if (size === 'compact-desktop' && axis === 'desktop') {
    return PLAIN_TEXT_PREVIEW_LAYOUT.compactMaxLines.desktop;
  }

  if (size === 'media-attachment') {
    return 0;
  }

  if (size === 'media-attachment-with-text') {
    return 2;
  }

  if (size === 'media' || size === 'url') {
    return 4;
  }

  if (size === 'tall') {
    return 8 + lineHeightBonus;
  }

  if (size === 'rich-embed') {
    return 6;
  }

  if (size === 'rich-embed-compact') {
    return 4;
  }

  if (size === 'fallback') {
    return 5 + lineHeightBonus;
  }

  return 5 + lineHeightBonus;
}

function getReflectionAnswerMaxLines(size: FeedCardSize) {
  return getDailyReflectionAnswerLineBudget({
    axis: 'desktop',
    content: {},
    size
  });
}

function getDailyReflectionAnswerLineBudget({
  axis,
  content,
  size
}: {
  axis: FeedCardLayoutAxis;
  content: any;
  size: FeedCardSize;
}) {
  const layout = REFLECTION_PREVIEW_LAYOUT_REM;
  const questionLines = estimatePreviewLineCount({
    charsPerLine: layout.questionCharsPerLine[axis],
    maxLines: layout.questionMaxLines,
    value: content?.question
  });
  const hasQuestion = questionLines > 0;
  const hasFooter = hasDailyReflectionMetaBadges(content);
  const gapCount = Number(hasQuestion) + Number(hasFooter);
  const occupiedHeight =
    layout.paddingY +
    gapCount * layout.rowGap +
    (hasQuestion ? getDailyReflectionQuestionBoxHeight(questionLines) : 0) +
    (hasFooter ? getDailyReflectionFooterMinHeight({ axis, content }) : 0);
  const panelHeight =
    PANEL_HEIGHT_REM[size]?.[axis] ?? PANEL_HEIGHT_REM.reflection[axis];
  const availableAnswerHeight = panelHeight - occupiedHeight;
  const answerLines = Math.floor(
    availableAnswerHeight / layout.answerLineHeight
  );

  return Math.max(layout.minAnswerLines, answerLines);
}

function getDailyReflectionFooterMinHeight({
  axis,
  content
}: {
  axis: FeedCardLayoutAxis;
  content: any;
}) {
  const layout = REFLECTION_PREVIEW_LAYOUT_REM;
  const hasMasterpiece = content?.grade === 'Masterpiece';
  const hasProgress =
    Number(content?.xpAwarded || 0) > 0 ||
    Number(content?.streakAtTime || 0) > 0;

  if (axis === 'mobile' && hasMasterpiece && hasProgress) {
    return layout.mobileMasterpieceFooterMinHeight;
  }

  return layout.footerMinHeight;
}

function getDailyReflectionQuestionBoxHeight(questionLines: number) {
  const layout = REFLECTION_PREVIEW_LAYOUT_REM;
  return (
    layout.questionPaddingY +
    layout.questionContentGap +
    layout.questionBorderY +
    (layout.questionLabelLines + questionLines) * layout.questionLineHeight
  );
}

function estimatePreviewLineCount({
  charsPerLine,
  maxLines,
  value
}: {
  charsPerLine: number;
  maxLines: number;
  value: any;
}) {
  const text = removeMarkdownImageEmbeds(String(value || '')).trim();

  if (!text || maxLines <= 0) {
    return 0;
  }

  const lineCount = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .reduce((count, line) => {
      return count + Math.max(1, Math.ceil(line.length / charsPerLine));
    }, 0);

  return Math.min(maxLines, lineCount);
}

function getSubjectDescriptionMaxLines(size: FeedCardSize) {
  if (isSubjectDescriptionBudgetedSize(size)) {
    return getSubjectDescriptionLineBudget({
      axis: 'desktop',
      content: {},
      hasDescriptionText: true,
      hasEffort: false,
      hasSecretAnswer: false,
      hasSecretAnswerText: false,
      hasSecretAttachment: false,
      hasTitle: false,
      secretMaxLines: 0,
      size
    });
  }

  if (size === 'subject-rich-embed') {
    return 3;
  }

  if (size === 'rich-embed') {
    return 5;
  }

  if (size === 'rich-embed-compact') {
    return 3;
  }

  if (size === 'subject-media') {
    return 5;
  }

  if (size === 'subject-minimal') {
    return 3;
  }

  if (size === 'compact') {
    return 2;
  }

  return 5;
}

function getSubjectDescriptionLineBudget({
  axis,
  content,
  hasDescriptionText,
  hasEffort,
  hasSecretAnswer,
  hasSecretAnswerText,
  hasSecretAttachment,
  hasTitle,
  secretMaxLines,
  size
}: {
  axis: FeedCardLayoutAxis;
  content: any;
  hasDescriptionText: boolean;
  hasEffort: boolean;
  hasSecretAnswer: boolean;
  hasSecretAnswerText: boolean;
  hasSecretAttachment: boolean;
  hasTitle: boolean;
  secretMaxLines: number;
  size: FeedCardSize;
}) {
  const maxLines = getSubjectDescriptionMaxLineCap({
    axis,
    content,
    size
  });

  if (!hasDescriptionText || !isSubjectDescriptionBudgetedSize(size)) {
    return maxLines;
  }

  const layout = getSubjectPreviewLayout({ content, size });
  const renderedChildrenCount = [
    hasEffort,
    hasTitle,
    hasDescriptionText,
    hasSecretAnswer
  ].filter(Boolean).length;
  const gapHeight = Math.max(0, renderedChildrenCount - 1) * layout.gap;
  const secretAnswerOverflowBuffer =
    hasDescriptionText && hasSecretAnswer
      ? layout.descriptionLineHeight * 1.45
      : 0;
  const occupiedHeight =
    layout.previewPaddingY +
    gapHeight +
    secretAnswerOverflowBuffer +
    (hasEffort ? layout.effortHeight : 0) +
    (hasTitle
      ? getSubjectTitleHeight({
          axis,
          content,
          size,
          title: content?.title
        })
      : 0) +
    (hasSecretAnswer
      ? getSubjectSecretAnswerHeight({
          hasSecretAnswerText,
          hasSecretAttachment,
          secretMaxLines
        })
      : 0);
  const panelHeight =
    PANEL_HEIGHT_REM[size]?.[axis] ?? PANEL_HEIGHT_REM['subject-tall'][axis];
  const availableDescriptionHeight = panelHeight - occupiedHeight;
  const descriptionLines = Math.floor(
    availableDescriptionHeight / layout.descriptionLineHeight
  );

  return Math.min(
    maxLines,
    Math.max(layout.minDescriptionLines, descriptionLines)
  );
}

function getSubjectDescriptionMaxLineCap({
  axis,
  content,
  size
}: {
  axis: FeedCardLayoutAxis;
  content: any;
  size: FeedCardSize;
}) {
  if (!isSubjectDescriptionBudgetedSize(size)) {
    return getSubjectNonTallDescriptionMaxLines(size);
  }

  const layout = getSubjectPreviewLayout({ content, size });
  const panelHeight =
    PANEL_HEIGHT_REM[size]?.[axis] ?? PANEL_HEIGHT_REM['subject-tall'][axis];
  return Math.max(
    layout.minDescriptionLines,
    Math.floor(
      (panelHeight - layout.previewPaddingY) / layout.descriptionLineHeight
    )
  );
}

function isSubjectDescriptionBudgetedSize(size: FeedCardSize) {
  return (
    size === 'subject-root' ||
    size === 'subject-root-text' ||
    size === 'subject-secret-media' ||
    size === 'subject-secret-compact' ||
    size === 'subject-secret-preview' ||
    size === 'subject-tall' ||
    size === 'standard'
  );
}

function getSubjectNonTallDescriptionMaxLines(size: FeedCardSize) {
  if (size === 'subject-rich-embed') {
    return 3;
  }

  if (size === 'rich-embed') {
    return 5;
  }

  if (size === 'rich-embed-compact') {
    return 3;
  }

  if (size === 'subject-media') {
    return 5;
  }

  if (size === 'subject-minimal') {
    return 3;
  }

  if (size === 'compact') {
    return 2;
  }

  return 5;
}

function getSubjectTitleHeight({
  axis,
  content,
  size,
  title
}: {
  axis: FeedCardLayoutAxis;
  content: any;
  size: FeedCardSize;
  title: any;
}) {
  const layout = getSubjectPreviewLayout({ content, size });
  const titleLines = estimatePreviewLineCount({
    charsPerLine: layout.titleCharsPerLine[axis],
    maxLines: layout.titleMaxLines,
    value: title
  });

  return (
    titleLines * layout.titleLineHeight[axis] + layout.titlePaddingBottom[axis]
  );
}

function getSubjectPreviewLayout({
  content,
  size
}: {
  content: any;
  size: FeedCardSize;
}) {
  const useAttachedRootLayout =
    hasAttachedRootContent(content) &&
    (size === 'standard' || size === 'subject-secret-media');

  if (
    size === 'subject-root' ||
    size === 'subject-root-text' ||
    useAttachedRootLayout
  ) {
    return SUBJECT_ROOT_PREVIEW_LAYOUT_REM;
  }

  return SUBJECT_PREVIEW_LAYOUT_REM;
}

function getSubjectSecretAnswerHeight({
  hasSecretAnswerText,
  hasSecretAttachment,
  secretMaxLines
}: {
  hasSecretAnswerText: boolean;
  hasSecretAttachment: boolean;
  secretMaxLines: number;
}) {
  const layout = SUBJECT_PREVIEW_LAYOUT_REM;
  const textHeight = hasSecretAnswerText
    ? layout.secretPaddingY + secretMaxLines * layout.secretLineHeight
    : 0;
  const minHeight = hasSecretAttachment
    ? layout.attachmentSecretMinHeight
    : layout.secretMinHeight;

  return Math.max(minHeight, textHeight);
}

function getSubjectSecretAnswerMaxLines({
  axis,
  content,
  hasSecretAnswerText
}: {
  axis: FeedCardLayoutAxis;
  content: any;
  hasSecretAnswerText: boolean;
}) {
  if (!hasSecretAnswerText) {
    return 0;
  }

  return estimatePreviewLineCount({
    charsPerLine: axis === 'desktop' ? 54 : 30,
    maxLines: SUBJECT_PREVIEW_LAYOUT_REM.secretMaxLines,
    value: content?.secretAnswer
  });
}

function getSubjectDescriptionPreviewLineCount({
  axis,
  content
}: {
  axis: FeedCardLayoutAxis;
  content: any;
}) {
  return estimatePreviewLineCount({
    charsPerLine: PLAIN_TEXT_PREVIEW_LAYOUT.charsPerLine[axis],
    maxLines: Number.MAX_SAFE_INTEGER,
    value: content?.description || content?.content || ''
  });
}

function getPlainTextLength(content: any) {
  return getPlainTextValue(content).length;
}

function getPlainTextValue(content: any) {
  return getPlainTextValueLengthSource(
    content?.content ||
      content?.description ||
      content?.answer ||
      content?.body ||
      content?.title ||
      ''
  );
}

function getSubjectDescriptionTextLength(content: any) {
  return getPlainTextValueLength(
    content?.description || content?.content || ''
  );
}

function getPlainTextValueLength(value: any) {
  return getPlainTextValueLengthSource(value).length;
}

function getPlainTextValueLengthSource(value: any) {
  return removeMarkdownImageEmbeds(String(value || '')).trim();
}

function isCompactPlainTextPreview(content: any) {
  if (content?.title || content?.filePath) return false;

  const text = getPlainTextValue(content);
  return (
    estimatePreviewLineCount({
      charsPerLine: PLAIN_TEXT_PREVIEW_LAYOUT.charsPerLine.desktop,
      maxLines: Number.MAX_SAFE_INTEGER,
      value: text
    }) <= PLAIN_TEXT_PREVIEW_LAYOUT.compactMaxLines.desktop &&
    estimatePreviewLineCount({
      charsPerLine: PLAIN_TEXT_PREVIEW_LAYOUT.charsPerLine.mobile,
      maxLines: Number.MAX_SAFE_INTEGER,
      value: text
    }) <= PLAIN_TEXT_PREVIEW_LAYOUT.compactMaxLines.mobile
  );
}

function isDesktopCompactPlainTextPreview(content: any) {
  if (content?.title || content?.filePath) return false;

  return (
    estimatePreviewLineCount({
      charsPerLine: PLAIN_TEXT_PREVIEW_LAYOUT.compactDesktopCharsPerLine,
      maxLines: Number.MAX_SAFE_INTEGER,
      value: getPlainTextValue(content)
    }) <= PLAIN_TEXT_PREVIEW_LAYOUT.compactMaxLines.desktop
  );
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

function hasTargetCommentMedia(targetComment: any) {
  const content = String(targetComment?.content || '');
  return Boolean(
    targetComment?.filePath ||
      targetComment?.actualFilePath ||
      targetComment?.thumbUrl ||
      getMarkdownImageEmbedPreview(content)
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

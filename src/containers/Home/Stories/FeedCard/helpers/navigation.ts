import { mobileMaxWidth } from '~/constants/css';

export function getHomeFeedContentPath({
  contentId,
  contentType,
  rootType
}: {
  contentId: number;
  contentType: string;
  rootType?: string;
}) {
  if (contentType === 'url') return `/links/${contentId}`;
  if (contentType === 'aiStory') return `/ai-stories/${contentId}`;
  if (contentType === 'build') return `/app/${contentId}`;
  if (contentType === 'pass') {
    return rootType === 'achievement'
      ? `/achievement-unlocks/${contentId}`
      : `/mission-passes/${contentId}`;
  }
  if (contentType === 'xpChange') return `/daily-rewards/${contentId}`;
  if (contentType === 'sharedTopic') return `/shared-prompts/${contentId}`;
  if (contentType === 'dailyReflection') {
    return `/daily-reflections/${contentId}`;
  }
  return `/${contentType}s/${contentId}`;
}

export function normalizeRootType(rootType?: string) {
  return rootType === 'missionPass' || rootType === 'achievementPass'
    ? 'pass'
    : rootType || '';
}

const nestedInteractiveSelector = [
  'a[href]',
  'button',
  'input',
  'textarea',
  'select',
  'summary',
  'details',
  'video',
  'audio',
  'iframe',
  '[role="button"]',
  '[role="link"]',
  '[role="menuitem"]',
  '[role="checkbox"]',
  '[role="switch"]',
  '[role="tab"]',
  '[role="textbox"]',
  '[contenteditable="true"]',
  '[data-feed-card-interactive="true"]',
  '.compact-comment-embed__username',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

export function shouldSkipFeedCardNavigation({
  currentTarget,
  defaultPrevented,
  target
}: {
  currentTarget: HTMLElement;
  defaultPrevented: boolean;
  target: EventTarget | null;
}) {
  if (defaultPrevented) return true;
  const targetElement =
    target instanceof Element
      ? target
      : target instanceof Node
        ? target.parentElement
        : null;
  if (!targetElement) return false;

  const buildEmbedWrapper = targetElement.closest(
    '.home-feed-card__rich-embed-internal--build'
  );
  if (buildEmbedWrapper && currentTarget.contains(buildEmbedWrapper)) {
    const embedContent = buildEmbedWrapper.firstElementChild;
    if (embedContent && embedContent.contains(targetElement)) {
      return true;
    }
  }

  const nestedInteractiveElement = targetElement.closest(
    nestedInteractiveSelector
  );
  return Boolean(
    nestedInteractiveElement &&
    nestedInteractiveElement !== currentTarget &&
    currentTarget.contains(nestedInteractiveElement)
  );
}

export function shouldUseExplicitFeedCardNavigation() {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return false;
  }

  return window.matchMedia(
    `(hover: none), (pointer: coarse), (max-width: ${mobileMaxWidth})`
  ).matches;
}

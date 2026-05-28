export type InternalEmbedPreviewKind =
  | 'achievement'
  | 'aiCard'
  | 'aiStory'
  | 'build'
  | 'comment'
  | 'dailyReflection'
  | 'genericInternal'
  | 'mission'
  | 'profile'
  | 'sharedPrompt'
  | 'subject'
  | 'url'
  | 'video';

export interface InternalEmbedPreviewInfo {
  cardId?: number;
  contentId?: number;
  contentType?: string;
  icon: string;
  kind: InternalEmbedPreviewKind;
  label: string;
  normalizedSrc: string;
}

export interface AICardCollectionPreviewTitleFilters {
  cardCount?: number | null;
  color?: string | null;
  engine?: string | null;
  isBuyNow?: string | null;
  isMystery?: string | boolean | null;
  owner?: string | null;
  quality?: string | null;
  style?: string | null;
  word?: string | null;
}

const internalHosts = new Set([
  'localhost',
  '127.0.0.1',
  'twin-kle.com',
  'twinkle.local',
  'twinkle.network',
  'www.twin-kle.com',
  'www.twinkle.network'
]);

export function isAICardEmbedSrc(src: string) {
  return getInternalEmbedPreviewInfo(src)?.kind === 'aiCard';
}

export function getAICardCollectionEmbedPreviewTitle(src: string) {
  const parsed = parseInternalEmbedSrc(src);
  if (!parsed) return '';

  const { parts, searchParams } = parsed;
  const linkType = parts[0] || '';
  const linkSubType = parts[1] || '';
  const isAICardsLink =
    linkType === 'ai-cards' ||
    (linkType === 'chat' && linkSubType === 'ai-cards');
  if (!isAICardsLink) return '';

  const cardId = getPositiveNumber(
    searchParams.get('cardId') ||
      (linkType === 'ai-cards' ? parts[1] : parts[2])
  );
  if (cardId) return '';

  return getAICardCollectionPreviewTitle({
    color: getAICardSearchParam(searchParams, 'color'),
    engine: getAICardSearchParam(searchParams, 'engine'),
    isBuyNow: getAICardSearchParam(searchParams, 'isBuyNow'),
    isMystery: getAICardSearchParam(searchParams, 'isMystery'),
    owner: getAICardSearchParam(searchParams, 'owner'),
    quality: getAICardSearchParam(searchParams, 'quality'),
    style: getAICardSearchParam(searchParams, 'style'),
    word: getAICardSearchParam(searchParams, 'word')
  });
}

export function getAICardCollectionPreviewTitle({
  cardCount,
  color,
  engine,
  isBuyNow,
  isMystery,
  owner,
  quality,
  style,
  word
}: AICardCollectionPreviewTitleFilters) {
  const mysteryFilterEnabled = isMystery === true || isMystery === 'true';
  const displayedEngine = mysteryFilterEnabled ? '' : engine;
  if (
    !color &&
    !displayedEngine &&
    !isBuyNow &&
    !mysteryFilterEnabled &&
    !owner &&
    !quality &&
    !style &&
    !word
  ) {
    return '';
  }

  const cardNoun = Number(cardCount) === 1 ? 'card' : 'cards';
  const mysteryLabel = mysteryFilterEnabled ? 'mystery ' : '';
  const titleParts = [];
  if (owner) {
    titleParts.push(`${owner}'s`);
  }
  if (color) {
    titleParts.push(
      `${color} ${quality ? `${quality} ` : ''}${
        displayedEngine ? `${displayedEngine} ` : ''
      }${mysteryLabel}${cardNoun}`
    );
  } else if (quality) {
    titleParts.push(
      `${quality ? `${quality} ` : ''}${
        displayedEngine ? `${displayedEngine} ` : ''
      }${mysteryLabel}${cardNoun}`
    );
  } else {
    titleParts.push(
      `${displayedEngine ? `${displayedEngine} ` : ''}${mysteryLabel}${cardNoun}`
    );
  }
  if (style && !mysteryFilterEnabled) {
    titleParts.push(`with "${style}" art style`);
  }
  if (word) {
    titleParts.push(`containing the word "${word}"`);
  }
  if (isBuyNow) {
    titleParts.push('you can buy now');
  }
  return titleParts.filter(Boolean).join(' ');
}

export function getInternalEmbedPreviewInfo(
  src: string
): InternalEmbedPreviewInfo | null {
  const parsed = parseInternalEmbedSrc(src);
  if (!parsed) return null;

  const { normalizedSrc, parts, searchParams } = parsed;
  const linkType = parts[0] || '';
  const linkSubType = parts[1] || '';

  if (linkType === 'ai-cards') {
    return {
      cardId: getPositiveNumber(searchParams.get('cardId') || parts[1]),
      icon: 'sparkles',
      kind: 'aiCard',
      label: 'AI card',
      normalizedSrc
    };
  }

  if (linkType === 'chat' && linkSubType === 'ai-cards') {
    return {
      cardId: getPositiveNumber(searchParams.get('cardId') || parts[2]),
      icon: 'sparkles',
      kind: 'aiCard',
      label: 'AI card',
      normalizedSrc
    };
  }

  if (['app', 'apps', 'build', 'builds'].includes(linkType)) {
    return {
      contentId: getPositiveNumber(parts[1] || searchParams.get('id')),
      contentType: 'build',
      icon: 'rocket',
      kind: 'build',
      label: 'Lumine App',
      normalizedSrc
    };
  }

  if (linkType === 'users') {
    return {
      contentId: getPositiveNumber(parts[1]),
      contentType: 'user',
      icon: 'user',
      kind: 'profile',
      label: 'Profile',
      normalizedSrc
    };
  }

  if (linkType === 'subjects') {
    return getMainContentPreviewInfo({
      contentType: 'subject',
      icon: 'comments',
      kind: 'subject',
      label: 'Subject',
      normalizedSrc,
      parts
    });
  }

  if (linkType === 'comments') {
    return getMainContentPreviewInfo({
      contentType: 'comment',
      icon: 'comment',
      kind: 'comment',
      label: 'Comment',
      normalizedSrc,
      parts
    });
  }

  if (linkType === 'videos') {
    return getMainContentPreviewInfo({
      contentType: 'video',
      icon: 'play',
      kind: 'video',
      label: 'Video',
      normalizedSrc,
      parts
    });
  }

  if (linkType === 'links') {
    return getMainContentPreviewInfo({
      contentType: 'url',
      icon: 'link',
      kind: 'url',
      label: 'Link',
      normalizedSrc,
      parts
    });
  }

  if (linkType === 'ai-stories') {
    return getMainContentPreviewInfo({
      contentType: 'aiStory',
      icon: 'book-open',
      kind: 'aiStory',
      label: 'AI Story',
      normalizedSrc,
      parts
    });
  }

  if (linkType === 'daily-reflections') {
    return getMainContentPreviewInfo({
      contentType: 'dailyReflection',
      icon: 'sparkles',
      kind: 'dailyReflection',
      label: 'Daily Reflection',
      normalizedSrc,
      parts
    });
  }

  if (linkType === 'missions') {
    return {
      contentId: getPositiveNumber(parts[1]),
      contentType: 'mission',
      icon: 'clipboard-check',
      kind: 'mission',
      label: 'Mission',
      normalizedSrc
    };
  }

  if (linkType === 'shared-prompts') {
    return {
      contentId: getPositiveNumber(parts[1]),
      icon: 'book',
      kind: 'sharedPrompt',
      label: 'Shared prompt',
      normalizedSrc
    };
  }

  if (linkType === 'achievement-unlocks') {
    return {
      contentId: getPositiveNumber(parts[1]),
      icon: 'trophy',
      kind: 'achievement',
      label: 'Achievement',
      normalizedSrc
    };
  }

  return {
    icon: 'globe',
    kind: 'genericInternal',
    label: 'Twinkle content',
    normalizedSrc
  };
}

export function getInternalEmbedCommentLabel(
  info: InternalEmbedPreviewInfo | null
) {
  if (!info) return 'shared a link';
  if (info.kind === 'aiCard') return 'shared an AI card';
  if (info.kind === 'aiStory') return 'shared an AI story';
  if (info.kind === 'build') return 'shared an app';
  if (info.kind === 'comment') return 'shared a comment';
  if (info.kind === 'dailyReflection') return 'shared a reflection';
  if (info.kind === 'mission') return 'shared a mission';
  if (info.kind === 'profile') return 'shared a profile';
  if (info.kind === 'sharedPrompt') return 'shared a prompt';
  if (info.kind === 'subject') return 'shared a subject';
  if (info.kind === 'url') return 'shared a link';
  if (info.kind === 'video') return 'shared a video';
  if (info.kind === 'achievement') return 'shared an achievement';
  return 'shared Twinkle content';
}

function getMainContentPreviewInfo({
  contentType,
  icon,
  kind,
  label,
  normalizedSrc,
  parts
}: {
  contentType: string;
  icon: string;
  kind: InternalEmbedPreviewKind;
  label: string;
  normalizedSrc: string;
  parts: string[];
}): InternalEmbedPreviewInfo {
  return {
    contentId: getPositiveNumber(parts[1]),
    contentType,
    icon,
    kind,
    label,
    normalizedSrc
  };
}

function parseInternalEmbedSrc(src: string) {
  const normalizedSrc = String(src || '')
    .replace(/<u>|<\/u>/g, '__')
    .trim();
  if (!normalizedSrc) return null;

  const hasProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(normalizedSrc);
  const urlSrc = normalizedSrc.startsWith('www.')
    ? `https://${normalizedSrc}`
    : normalizedSrc;

  try {
    const url = new URL(urlSrc, 'https://twinkle.local');
    const isRelative = !hasProtocol && !normalizedSrc.startsWith('www.');
    if (!isRelative && !internalHosts.has(url.hostname)) {
      return null;
    }
    const pathname = url.pathname.startsWith('/')
      ? url.pathname
      : `/${url.pathname}`;
    const parts = pathname.replace(/^\/+/, '').split('/').filter(Boolean);
    if (!parts.length) return null;

    return {
      normalizedSrc: `${pathname}${url.search}${url.hash}`,
      parts,
      searchParams: url.searchParams
    };
  } catch {
    const pathname = normalizedSrc.split('?')[0].split('#')[0];
    const parts = pathname.replace(/^\/+/, '').split('/').filter(Boolean);
    if (!parts.length) return null;

    return {
      normalizedSrc: pathname.startsWith('/') ? normalizedSrc : `/${normalizedSrc}`,
      parts,
      searchParams: new URLSearchParams(
        normalizedSrc.includes('?') ? normalizedSrc.split('?')[1].split('#')[0] : ''
      )
    };
  }
}

function getPositiveNumber(value: string | number | null | undefined) {
  const number = Math.floor(Number(value || 0));
  return number > 0 ? number : undefined;
}

function getAICardSearchParam(searchParams: URLSearchParams, key: string) {
  return searchParams.get(`search[${key}]`) || searchParams.get(key);
}

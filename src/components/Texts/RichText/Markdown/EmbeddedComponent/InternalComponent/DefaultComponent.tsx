import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { css } from '@emotion/css';
import { Color, borderRadius } from '~/constants/css';
import Icon from '~/components/Icon';

interface DefaultEmbedPreviewConfig {
  accent: string;
  border: string;
  description: string;
  icon: string;
  kicker: string;
  softAccent: string;
  title: string;
}

const getDescriptionForLinkType: { [key: string]: (src: string) => string } = {
  users: (src) => {
    const parts = src.split('/');
    const username = parts[2];
    const type = parts[3];
    const subtype = parts[4];
    const byUser = subtype === 'byuser' ? 'Created' : 'Posted';
    const contentByUser = type === 'byuser' ? 'Content Created' : 'Posts';

    switch (type) {
      case 'all':
        if (subtype === 'byuser') {
          return `All Content Created by ${username}`;
        } else {
          return `All ${contentByUser} by ${username}`;
        }
      case 'watched':
        return `Videos Watched by ${username}`;
      case 'likes':
        if (subtype) {
          return `${
            subtype === 'all' ? 'All Posts' : capitalize(subtype)
          } Liked by ${username}`;
        } else {
          return `All Liked Posts by ${username}`;
        }
      case 'comments':
        return `Comments ${byUser} by ${username}`;
      case 'videos':
        return `Videos ${byUser} by ${username}`;
      case 'links':
        if (subtype === 'byuser') {
          return `Webpages Created by ${username}`;
        } else {
          return `Links ${byUser} by ${username}`;
        }
      case 'subjects':
        return `Subjects ${byUser} by ${username}`;
      case 'ai-stories':
        return `AI Stories ${byUser} by ${username}`;
      default:
        return `${username}'s Profile`;
    }
  },
  'ai-cards': () => 'Explore AI Cards',
  'shared-prompts': (src) => {
    const promptId = getPathParts(src)[1] || getSearchParam(src, 'promptId');
    return promptId ? 'View Shared Prompt' : 'Browse Shared Prompts';
  },
  missions: (src) => {
    const mission = getPathParts(src)[1];
    if (!mission) {
      return `Browse Missions`;
    }
    return `Mission: ${mission.replace(/-/g, ' ')}`;
  },
  chat: (src) => {
    const chatType = getPathParts(src)[1];
    if (chatType === 'vocabulary') {
      return 'Collect Vocabulary';
    } else if (chatType === 'ai-cards') {
      return 'Collect AI Cards';
    } else {
      return 'Chat';
    }
  },
  explore: (src) => {
    const exploreType = getPathParts(src)[0] || 'content';
    return `Explore ${capitalize(exploreType)}`;
  },
  app: () => 'Browse Lumine Apps',
  apps: () => 'Browse Lumine Apps',
  build: () => 'Browse Lumine Apps',
  builds: () => 'Browse Lumine Apps',
  comments: () => 'Browse Comments',
  'ai-stories': () => 'Browse AI Stories',
  'daily-reflections': () => 'Browse Daily Reflections',
  'achievement-unlocks': (src) => {
    return getPathParts(src)[1] ? 'View Achievement' : 'Achievement Unlocks';
  }
};

export default function DefaultComponent({
  isPreview,
  linkType,
  src
}: {
  isPreview?: boolean;
  linkType: string;
  src: string;
}) {
  const appliedLinkType = useMemo(() => {
    const exploreType = ['subjects', 'videos', 'links'];
    if (exploreType.includes(linkType)) {
      return 'explore';
    }
    return linkType;
  }, [linkType]);
  const linkLabel = useMemo(
    () =>
      getDescriptionForLinkType[appliedLinkType]?.(src) ||
      getGenericTitle(linkType),
    [appliedLinkType, linkType, src]
  );
  const previewConfig = useMemo(
    () =>
      getDefaultEmbedPreviewConfig({
        appliedLinkType,
        linkLabel,
        linkType,
        src
      }),
    [appliedLinkType, linkLabel, linkType, src]
  );

  if (isPreview) {
    return (
      <Link
        className={compactDefaultEmbedClass}
        style={
          {
            '--default-embed-accent': previewConfig.accent,
            '--default-embed-accent-border': previewConfig.border,
            '--default-embed-accent-soft': previewConfig.softAccent
          } as React.CSSProperties & {
            '--default-embed-accent': string;
            '--default-embed-accent-border': string;
            '--default-embed-accent-soft': string;
          }
        }
        to={src}
        onClick={(event) => event.stopPropagation()}
      >
        <span className="compact-default-internal-embed__icon">
          <Icon icon={previewConfig.icon} />
        </span>
        <span className="compact-default-internal-embed__copy">
          <span className="compact-default-internal-embed__label">
            {previewConfig.kicker}
          </span>
          <strong>{previewConfig.title}</strong>
          <span className="compact-default-internal-embed__description">
            {previewConfig.description}
          </span>
        </span>
      </Link>
    );
  }

  return (
    <div>
      <Link to={src} style={{ fontWeight: 'bold' }}>
        <u>{linkLabel}</u>
      </Link>
    </div>
  );
}

const compactDefaultEmbedClass = css`
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 4.9rem minmax(0, 1fr);
  align-content: center;
  align-items: center;
  gap: 0.85rem;
  width: 100%;
  height: 100%;
  min-height: 8.2rem;
  padding: 0.9rem 1rem;
  overflow: hidden;
  border: 1px solid var(--default-embed-accent-border);
  border-radius: ${borderRadius};
  background: #fff;
  color: ${Color.darkerGray()};
  text-decoration: none;
  box-shadow: inset 0 0 0 1px var(--default-embed-accent-soft);
  .compact-default-internal-embed__icon {
    display: inline-flex;
    width: 4.4rem;
    height: 4.4rem;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--default-embed-accent-border);
    border-radius: 1rem;
    background: var(--default-embed-accent-soft);
    color: var(--default-embed-accent);
    font-size: 2rem;
    line-height: 1;
  }
  .compact-default-internal-embed__copy {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 0.28rem;
  }
  .compact-default-internal-embed__label {
    align-self: flex-start;
    color: var(--default-embed-accent);
    font-size: 1rem;
    font-weight: 900;
    line-height: 1.1;
  }
  strong {
    overflow: hidden;
    color: ${Color.black()};
    font-size: 1.3rem;
    font-weight: 900;
    line-height: 1.15;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  .compact-default-internal-embed__description {
    overflow: hidden;
    color: ${Color.darkGray()};
    font-size: 1.1rem;
    font-weight: 700;
    line-height: 1.25;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
`;

function getDefaultEmbedPreviewConfig({
  appliedLinkType,
  linkLabel,
  linkType,
  src
}: {
  appliedLinkType: string;
  linkLabel: string;
  linkType: string;
  src: string;
}): DefaultEmbedPreviewConfig {
  const pathParts = getPathParts(src);
  const linkSubType = pathParts[1] || '';

  if (appliedLinkType === 'explore') {
    return getExplorePreviewConfig({ linkLabel, linkType });
  }

  if (linkType === 'chat' && linkSubType === 'vocabulary') {
    return {
      accent: Color.green(),
      border: Color.green(0.38),
      description: 'Practice saved words and grow your vocabulary.',
      icon: 'book',
      kicker: 'Vocabulary',
      softAccent: Color.green(0.1),
      title: linkLabel
    };
  }

  if (linkType === 'chat' && linkSubType === 'ai-cards') {
    return {
      accent: Color.purple(),
      border: Color.purple(0.34),
      description: 'Open the AI card collection from chat.',
      icon: 'sparkles',
      kicker: 'AI Cards',
      softAccent: Color.purple(0.1),
      title: linkLabel
    };
  }

  switch (appliedLinkType) {
    case 'missions':
      return {
        accent: Color.gold(),
        border: Color.gold(0.48),
        description: 'Find guided missions, tasks, and rewards.',
        icon: 'clipboard-check',
        kicker: 'Missions',
        softAccent: Color.gold(0.13),
        title: linkLabel
      };
    case 'ai-cards':
      return {
        accent: Color.purple(),
        border: Color.purple(0.34),
        description: 'Browse cards, filters, and collection paths.',
        icon: 'sparkles',
        kicker: 'AI Cards',
        softAccent: Color.purple(0.1),
        title: linkLabel
      };
    case 'shared-prompts':
      return {
        accent: Color.logoBlue(),
        border: Color.logoBlue(0.36),
        description: 'Browse reusable prompts shared by the community.',
        icon: 'book-open',
        kicker: 'Shared Prompts',
        softAccent: Color.logoBlue(0.09),
        title: linkLabel
      };
    case 'achievement-unlocks':
      return {
        accent: Color.goldOrange(),
        border: Color.goldOrange(0.42),
        description: 'Open recent unlocks and achievement progress.',
        icon: 'trophy',
        kicker: 'Achievements',
        softAccent: Color.goldOrange(0.12),
        title: linkLabel
      };
    case 'app':
    case 'apps':
    case 'build':
    case 'builds':
      return {
        accent: Color.logoBlue(),
        border: Color.logoBlue(0.36),
        description: 'Browse Lumine apps and interactive builds.',
        icon: 'rocket',
        kicker: 'Lumine Apps',
        softAccent: Color.logoBlue(0.09),
        title: linkLabel
      };
    case 'comments':
      return {
        accent: Color.redOrange(),
        border: Color.redOrange(0.36),
        description: 'Open comments and conversation threads.',
        icon: 'comment',
        kicker: 'Comments',
        softAccent: Color.redOrange(0.1),
        title: linkLabel
      };
    case 'ai-stories':
      return {
        accent: Color.purple(),
        border: Color.purple(0.34),
        description: 'Browse AI reading and listening stories.',
        icon: 'book-open',
        kicker: 'AI Stories',
        softAccent: Color.purple(0.1),
        title: linkLabel
      };
    case 'daily-reflections':
      return {
        accent: Color.pink(),
        border: Color.pink(0.32),
        description: 'Browse daily reflection prompts and responses.',
        icon: 'sparkles',
        kicker: 'Daily Reflections',
        softAccent: Color.pink(0.09),
        title: linkLabel
      };
    case 'users':
      return {
        accent: Color.logoBlue(),
        border: Color.logoBlue(0.34),
        description: 'Open this profile or profile collection.',
        icon: 'user',
        kicker: 'Profile',
        softAccent: Color.logoBlue(0.09),
        title: linkLabel
      };
    default:
      return {
        accent: Color.logoBlue(),
        border: Color.logoBlue(0.32),
        description: 'Open this Twinkle link.',
        icon: 'globe',
        kicker: getGenericKicker(linkType),
        softAccent: Color.logoBlue(0.08),
        title: linkLabel === 'Home' ? getGenericTitle(linkType) : linkLabel
      };
  }
}

function getExplorePreviewConfig({
  linkLabel,
  linkType
}: {
  linkLabel: string;
  linkType: string;
}): DefaultEmbedPreviewConfig {
  if (linkType === 'videos') {
    return {
      accent: Color.logoBlue(),
      border: Color.logoBlue(0.36),
      description: 'Browse shared videos and lessons.',
      icon: 'play',
      kicker: 'Videos',
      softAccent: Color.logoBlue(0.09),
      title: linkLabel
    };
  }
  if (linkType === 'links') {
    return {
      accent: Color.orange(),
      border: Color.orange(0.36),
      description: 'Browse shared webpages and resources.',
      icon: 'link',
      kicker: 'Links',
      softAccent: Color.orange(0.1),
      title: linkLabel
    };
  }
  return {
    accent: Color.orange(),
    border: Color.orange(0.36),
    description: 'Browse active subjects and discussions.',
    icon: 'comments',
    kicker: 'Subjects',
    softAccent: Color.orange(0.1),
    title: linkLabel
  };
}

function getPathParts(src: string) {
  const normalizedSrc = String(src || '')
    .replace(/<u>|<\/u>/g, '__')
    .trim();
  try {
    const url = new URL(normalizedSrc, 'https://twinkle.local');
    return url.pathname.replace(/^\/+/, '').split('/').filter(Boolean);
  } catch {
    return normalizedSrc
      .split('?')[0]
      .split('#')[0]
      .replace(/^\/+/, '')
      .split('/')
      .filter(Boolean);
  }
}

function getSearchParam(src: string, key: string) {
  const normalizedSrc = String(src || '')
    .replace(/<u>|<\/u>/g, '__')
    .trim();
  try {
    const url = new URL(normalizedSrc, 'https://twinkle.local');
    return url.searchParams.get(key);
  } catch {
    const search = normalizedSrc.includes('?')
      ? normalizedSrc.split('?')[1].split('#')[0]
      : '';
    return new URLSearchParams(search).get(key);
  }
}

function getGenericKicker(linkType: string) {
  if (!linkType) return 'Twinkle';
  return capitalize(linkType.replace(/-/g, ' '));
}

function getGenericTitle(linkType: string) {
  if (!linkType) return 'Home';
  return `Open ${capitalize(linkType.replace(/-/g, ' '))}`;
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

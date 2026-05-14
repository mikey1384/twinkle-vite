import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { css } from '@emotion/css';
import { Color, borderRadius } from '~/constants/css';

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
  'shared-prompts': () => 'View Shared Prompt',
  missions: (src) => {
    const mission = src.split('/missions/')[1];
    if (!mission) {
      return `Browse Missions`;
    }
    return `Mission: ${mission.replace(/-/g, ' ')}`;
  },
  chat: (src) => {
    const chatType = src.split('/chat/')[1];
    if (chatType === 'vocabulary') {
      return 'Collect Vocabulary';
    } else if (chatType === 'ai-cards') {
      return 'Collect AI Cards';
    } else {
      return 'Chat';
    }
  },
  explore: (src) => {
    const exploreType = src.split('/')[1];
    return `Explore ${capitalize(exploreType)}`;
  },
  'achievement-unlocks': () => 'View Achievement'
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
    () => getDescriptionForLinkType[appliedLinkType]?.(src) || 'Home',
    [appliedLinkType, src]
  );

  if (isPreview) {
    return (
      <Link
        className={compactDefaultEmbedClass}
        to={src}
        onClick={(event) => event.stopPropagation()}
      >
        <span>Link</span>
        <strong>{linkLabel}</strong>
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
  display: flex;
  width: 100%;
  min-height: 6.4rem;
  flex-direction: column;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.75rem 0.9rem;
  overflow: hidden;
  border: 1px solid ${Color.logoBlue(0.42)};
  border-radius: ${borderRadius};
  background: #fff;
  color: ${Color.darkerGray()};
  text-decoration: none;
  span {
    color: ${Color.logoBlue()};
    font-size: 1rem;
    font-weight: 900;
    line-height: 1.1;
  }
  strong {
    overflow: hidden;
    color: ${Color.black()};
    font-size: 1.2rem;
    font-weight: 900;
    line-height: 1.15;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

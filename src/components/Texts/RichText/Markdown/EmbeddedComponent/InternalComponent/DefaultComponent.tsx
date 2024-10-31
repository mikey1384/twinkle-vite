import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';

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
  }
};

export default function DefaultComponent({
  linkType,
  src
}: {
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

  return (
    <div>
      <Link to={src} style={{ fontWeight: 'bold' }}>
        <u>{linkLabel}</u>
      </Link>
    </div>
  );
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

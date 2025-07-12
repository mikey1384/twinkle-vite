import React, { useMemo } from 'react';

export default function ActionBlock({
  action,
  target,
  style,
  type,
  username
}: {
  action: string;
  target: string;
  style: React.CSSProperties;
  type: string;
  username: string;
}) {
  const displayedAction = useMemo(() => {
    if (action === 'donation' && target === 'community') {
      return 'made a donation';
    }
    if (action === 'prompt') {
      return 'used premium AI prompt';
    }
    if (action === 'thinkHard' && target === 'aiChat') {
      return 'used "Think Hard" mode';
    }
    if (action === 'attempt') {
      if (target === 'mission') {
        return 'completed a mission';
      }
      if (target === 'grammarbles') {
        return 'completed daily grammarbles';
      }
      if (target === 'aiStory') {
        return 'completed an AI Story';
      }
    }
    if (action === 'burn') {
      return 'burned an AI card';
    }
    if (action === 'collect') {
      return 'completed daily goals';
    }
    if (action === 'generate') {
      return 'summoned a card';
    }
    if (action === 'offerPending') {
      if (type === 'decrease') {
        return 'made an offer (on hold)';
      } else {
        return 'withdrew an offer';
      }
    }
    if (action === 'offerAccepted') {
      if (type === 'decrease') {
        return 'made an offer (accepted)';
      }
    }
    if (action === 'purchase') {
      if (target === 'aiStoryImage') {
        return 'generated an AI Story image';
      }
      if (target === 'chatSubject') {
        return 'unlocked chat group topic feature';
      }
      if (target === 'aiCardAsk') {
        return 'purchased an AI card';
      }
      if ((target || '').includes('chatTheme')) {
        return `unlocked ${target
          .replace('chatTheme ', '')
          .toLowerCase()} chat theme`;
      }
      if (target === 'user') {
        return 'changed username';
      }
    }
    if (action === 'repeat') {
      return 'completed a repeatable mission';
    }
    if (action === 'recommend') {
      if (target === 'pass') {
        return 'recommended an achievement';
      }
      if (target === 'aiStory') {
        return 'recommended an AI Story';
      }
      if (target === 'xpChange') {
        return 'recommended a daily goal completion';
      }
      return `recommended a ${target}`;
    }
    if (action === 'register') {
      return 'discovered a word';
    }
    if (action === 'hit') {
      return 'collected a word';
    }
    if (action === 'reward') {
      if (type === 'decrease') {
        return 'rewarded XP';
      } else {
        return 'received rewards for recommending posts';
      }
    }
    if (action === 'sell') {
      if (target === 'aiCardAsk' || target === 'aiCardOffer') {
        return 'sold an AI card';
      }
    }
    if (action === 'receive') {
      return `received from ${username}`;
    }
    if (action === 'send') {
      return `sent ${username}`;
    }
    if (action === 'vocabRoulette') {
      if (type === 'decrease') {
        return 'placed a wager';
      }
      return 'won from the wheel';
    }
    if (action === 'watch') {
      return 'watched a video';
    }
    return `${action} ${target}`;
  }, [action, target, type, username]);
  return <div style={style}>{displayedAction}</div>;
}

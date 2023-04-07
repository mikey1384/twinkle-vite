import { useMemo } from 'react';
import PropTypes from 'prop-types';

ActionBlock.propTypes = {
  action: PropTypes.string.isRequired,
  target: PropTypes.string.isRequired,
  style: PropTypes.object,
  type: PropTypes.string.isRequired,
  username: PropTypes.string
};

export default function ActionBlock({ action, target, style, type, username }) {
  const displayedAction = useMemo(() => {
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
      return `recommended a ${target}`;
    }
    if (action === 'register') {
      return 'collected a vocabulary';
    }
    if (action === 'reward') {
      if (type === 'decrease') {
        return 'rewarded twinkles';
      } else {
        return 'received rewards for recommending a post';
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
    if (action === 'watch') {
      return 'watched a video';
    }
    return `${action} ${target}`;
  }, [action, target, type, username]);
  return <div style={style}>{displayedAction}</div>;
}

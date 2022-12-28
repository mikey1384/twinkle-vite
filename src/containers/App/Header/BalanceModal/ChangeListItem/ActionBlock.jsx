import { useMemo } from 'react';
import PropTypes from 'prop-types';

ActionBlock.propTypes = {
  action: PropTypes.string.isRequired,
  target: PropTypes.string.isRequired,
  style: PropTypes.object
};

export default function ActionBlock({ action, target, style }) {
  const displayedAction = useMemo(() => {
    if (action === 'generate') {
      return 'summoned a card';
    }
    if (action === 'repeat') {
      return 'completed a repeatable mission';
    }
    if (action === 'recommend') {
      if (target === 'pass') {
        return 'recommended an achievement';
      }
      return `recommended a ${target}`;
    }
    if (action === 'watch') {
      return 'watched a video';
    }
    if (action === 'purchase') {
      if (target === 'chatSubject') {
        return 'unlocked chat group topic feature';
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
    if (action === 'attempt') {
      if (target === 'mission') {
        return 'completed a mission';
      }
    }
    if (action === 'register') {
      return 'collected a vocabulary';
    }
    if (action === 'reward') {
      return 'rewarded twinkles';
    }
    return `${action} ${target}`;
  }, [action, target]);
  return <div style={style}>{displayedAction}</div>;
}

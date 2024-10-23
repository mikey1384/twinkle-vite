import React, { memo, useMemo } from 'react';
import Icon from '~/components/Icon';

function Starmarks({ stars }: { stars: number }) {
  const Marks = useMemo(() => {
    const baselines = [
      { baseline: 10, icon: ['far', 'star-half-alt'] },
      { baseline: 20, icon: ['far', 'star'] },
      { baseline: 30, icon: 'star-half-alt' },
      { baseline: 40, icon: 'star' }
    ];

    const starMarks = new Array(Math.min(stars, 10))
      .fill(null)
      .map((_, i) => (
        <Icon
          key={i}
          icon="certificate"
          style={{ marginLeft: i !== 0 ? '0.2rem' : undefined }}
        />
      ));

    for (const { baseline, icon } of baselines) {
      if (stars <= baseline) break;
      for (let i = 0; i < Math.min(stars - baseline, 10); i++) {
        starMarks[i] = (
          <Icon
            key={i}
            icon={icon}
            style={{ marginLeft: i !== 0 ? '0.2rem' : undefined }}
          />
        );
      }
    }

    return starMarks;
  }, [stars]);

  return <div style={{ width: '100%', textAlign: 'center' }}>{Marks}</div>;
}

export default memo(Starmarks);

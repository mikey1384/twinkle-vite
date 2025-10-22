import React, { memo, useMemo } from 'react';
import Icon from '~/components/Icon';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { Color } from '~/constants/css';

function Starmarks({
  stars,
  color = 'rgb(38, 55, 75)',
  fullWidth = true
}: {
  stars: number;
  color?: string;
  fullWidth?: boolean;
}) {
  const Marks = useMemo(() => {
    const starMarks = new Array(Math.min(stars, 10)).fill(null).map((_, i) => (
      <Icon
        key={i}
        icon={'certificate' as IconProp}
        style={{
          marginLeft: i !== 0 ? '0.15rem' : undefined,
          fontSize: '1.3rem',
          color: Color.orange()
        }}
      />
    ));

    if (stars > 10) {
      const outlineStarsCount = Math.min(stars - 10, 10);
      for (let i = 0; i < outlineStarsCount; i++) {
        starMarks[i] = (
          <Icon
            key={i}
            icon={['far', 'star'] as IconProp}
            style={{
              marginLeft: i !== 0 ? '0.15rem' : undefined,
              fontSize: '1.3rem',
              color
            }}
          />
        );
      }
    }

    if (stars > 20) {
      const halfStarsCount = Math.min(stars - 20, 10);
      for (let i = 0; i < halfStarsCount; i++) {
        starMarks[i] = (
          <Icon
            key={i}
            icon={['far', 'star-half-alt'] as IconProp}
            style={{
              marginLeft: i !== 0 ? '0.15rem' : undefined,
              fontSize: '1.3rem',
              color
            }}
          />
        );
      }
    }

    if (stars > 30) {
      const solidStarsCount = Math.min(stars - 30, 10);
      for (let i = 0; i < solidStarsCount; i++) {
        starMarks[i] = (
          <Icon
            key={i}
            icon={'star' as IconProp}
            style={{
              marginLeft: i !== 0 ? '0.15rem' : undefined,
              fontSize: '1.3rem',
              color
            }}
          />
        );
      }
    }

    if (stars > 40) {
      const goldStarsCount = Math.min(stars - 40, 10);
      for (let i = 0; i < goldStarsCount; i++) {
        starMarks[i] = (
          <Icon
            key={i}
            icon={['fas', 'star'] as IconProp}
            style={{
              marginLeft: i !== 0 ? '0.15rem' : undefined,
              fontSize: '1.3rem',
              color: 'var(--perfect-star-color, #ffd700)'
            }}
          />
        );
      }
    }

    return starMarks;
  }, [color, stars]);

  return (
    <div
      style={{
        width: fullWidth ? '100%' : 'auto',
        textAlign: 'center',
        lineHeight: 1.2
      }}
    >
      {Marks}
    </div>
  );
}

export default memo(Starmarks);

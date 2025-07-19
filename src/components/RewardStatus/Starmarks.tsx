import React, { memo, useMemo } from 'react';
import Icon from '~/components/Icon';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { getThemeStyles } from '~/constants/css';
import { useKeyContext } from '~/contexts';

function Starmarks({ stars, theme }: { stars: number; theme?: string }) {
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const themeStyles = useMemo(
    () => getThemeStyles(theme || profileTheme),
    [theme, profileTheme]
  );

  const Marks = useMemo(() => {
    const starMarks = new Array(Math.min(stars, 10)).fill(null).map((_, i) => (
      <Icon
        key={i}
        icon={'certificate' as IconProp}
        style={{
          marginLeft: i !== 0 ? '0.15rem' : undefined,
          fontSize: '1.3rem',
          color: 'rgb(255, 255, 255)'
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
              color: 'rgb(255, 255, 255)'
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
              color: 'rgb(255, 255, 255)'
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
              color: 'rgb(255, 255, 255)'
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
              color: themeStyles.perfectStarColor
            }}
          />
        );
      }
    }

    return starMarks;
  }, [stars, themeStyles]);

  return (
    <div
      style={{
        width: '100%',
        textAlign: 'center',
        lineHeight: 1.2
      }}
    >
      {Marks}
    </div>
  );
}

export default memo(Starmarks);

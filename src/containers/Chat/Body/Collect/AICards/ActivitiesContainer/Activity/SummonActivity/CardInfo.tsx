import React from 'react';
import { qualityProps } from '~/constants/defaultValues';
import { css } from '@emotion/css';
import { desktopMinWidth, mobileMaxWidth } from '~/constants/css';
import {
  isTotalMysteryQuality,
  totalMysteryTextClass
} from '~/components/AICard/totalMysteryGlow';

export default function CardInfo({
  quality,
  style
}: {
  quality: string;
  style: any;
}) {
  return (
    <div style={style}>
      <div
        className={css`
          font-size: 1.6rem;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.2rem;
          }
        `}
      >
        <div
          className={css`
            @media (min-width: ${desktopMinWidth}) {
              display: inline;
            }
          `}
        >
          summoned {quality === 'elite' ? 'an' : 'a'}{' '}
        </div>
        <span
          className={
            isTotalMysteryQuality(quality) ? totalMysteryTextClass : undefined
          }
          style={{ ...qualityProps[quality] }}
        >
          {quality}
        </span>{' '}
        card
      </div>
    </div>
  );
}

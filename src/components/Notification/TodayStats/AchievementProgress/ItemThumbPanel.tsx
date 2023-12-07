import React, { useMemo, useState, useEffect, useRef } from 'react';
import FullTextReveal from '~/components/Texts/FullTextRevealFromOuterLayer';

import { css } from '@emotion/css';
import { isMobile } from '~/helpers';
import { mobileFullTextRevealShowDuration } from '~/constants/defaultValues';

const deviceIsMobile = isMobile(navigator);

export default function ItemThumbPanel({
  thumbSize = '4rem',
  itemName,
  badgeSrc,
  progressObj
}: {
  thumbSize?: string;
  itemName: string;
  badgeSrc?: string;
  progressObj?: { label: string; currentValue: number; targetValue: number };
}) {
  const timerRef: React.MutableRefObject<any> = useRef(null);
  const ThumbLabelContainerRef: React.RefObject<any> = useRef(null);
  const [titleContext, setTitleContext] = useState(null);
  useEffect(() => {
    if (titleContext && deviceIsMobile) {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setTitleContext(null);
      }, mobileFullTextRevealShowDuration);
    }
  }, [titleContext]);
  const progress = useMemo(() => {
    if (progressObj) {
      const { currentValue, targetValue } = progressObj;
      return Math.ceil(100 * (currentValue / targetValue));
    } else {
      return 0;
    }
  }, [progressObj]);

  return (
    <div
      style={{ margin: '0.5rem' }}
      className={css`
        position: relative;
        width: ${thumbSize};
        height: ${thumbSize};
        &:after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: ${100 - progress}%;
          background: rgba(0, 0, 0, 0.3);
          pointer-events: none;
        }
      `}
    >
      {badgeSrc && (
        <img
          onMouseOver={() => {
            const parentElementDimensions =
              ThumbLabelContainerRef.current?.getBoundingClientRect?.() || {
                x: 0,
                y: 0,
                width: 0,
                height: 0
              };
            setTitleContext(parentElementDimensions);
          }}
          onMouseLeave={() => setTitleContext(null)}
          ref={ThumbLabelContainerRef}
          src={badgeSrc}
          alt="Badge"
          className={css`
            width: 100%;
            height: 100%;
          `}
        />
      )}
      <div
        className={css`
          bottom: 0;
          right: 2px;
          position: absolute;
          color: white;
          font-size: 1.2rem;
          font-weight: bold;
          z-index: 1;
        `}
      >
        {progress || 0}%
      </div>
      {titleContext && (
        <FullTextReveal textContext={titleContext} text={itemName} />
      )}
    </div>
  );
}

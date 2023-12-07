import React, { useMemo, useState, useEffect, useRef } from 'react';
import FullTextReveal from '~/components/Texts/FullTextRevealFromOuterLayer';
import ProgressBar from '~/components/ProgressBar';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import { isMobile } from '~/helpers';
import { mobileFullTextRevealShowDuration } from '~/constants/defaultValues';
import { addCommasToNumber } from '~/helpers/stringHelpers';

const deviceIsMobile = isMobile(navigator);

export default function ItemThumbPanel({
  thumbSize = '4rem',
  itemName,
  badgeSrc,
  progressObj,
  style
}: {
  thumbSize?: string;
  itemName: string;
  badgeSrc?: string;
  progressObj?: { label: string; currentValue: number; targetValue: number };
  style?: React.CSSProperties;
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
      className={css`
        margin: 0.5rem;
        width: ${thumbSize};
        height: ${thumbSize};
      `}
      style={style}
    >
      {progressObj && (
        <div style={{ position: 'absolute' }}>
          <h3
            className={css`
              margin-top: 1.7rem;
              margin-bottom: -0.5rem;
              font-weight: bold;
              font-size: 1.5rem;
              color: ${Color.black()};
            `}
          >
            {progressObj.label}: {addCommasToNumber(progressObj.currentValue)}
          </h3>
          <ProgressBar progress={progress} />
        </div>
      )}
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
            width: ${thumbSize};
            height: ${thumbSize};
          `}
        />
      )}
      {titleContext && (
        <FullTextReveal textContext={titleContext} text={itemName} />
      )}
    </div>
  );
}

import React, { useMemo, useState, useEffect, useRef } from 'react';
import FullTextReveal from '~/components/Texts/FullTextRevealFromOuterLayer';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { isMobile } from '~/helpers';
import { mobileFullTextRevealShowDuration } from '~/constants/defaultValues';

const deviceIsMobile = isMobile(navigator);

export default function ItemThumb({
  isUnlocked,
  thumbSize = '4rem',
  itemName,
  badgeSrc,
  progressObj
}: {
  isUnlocked?: boolean;
  thumbSize?: string;
  itemName: string;
  badgeSrc?: string;
  progressObj?: { currentValue: number; targetValue: number };
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

  const thumbRadius = useMemo(() => parseInt(thumbSize) / 2, [thumbSize]);
  const circumference = useMemo(() => 2 * Math.PI * thumbRadius, [thumbRadius]);
  const strokeDashoffset = useMemo(
    () => -1 * (progress / 100) * circumference,
    [progress, circumference]
  );

  return (
    <div
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
      style={{ margin: '0.5rem' }}
      className={css`
        width: ${thumbSize};
        height: ${thumbSize};
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
      `}
    >
      <div
        style={{
          cursor: 'pointer',
          width: '100%',
          height: '100%',
          position: 'relative'
        }}
      >
        <svg
          width={thumbSize}
          height={thumbSize}
          viewBox={`0 0 ${2 * thumbRadius} ${2 * thumbRadius}`}
          style={{
            position: 'absolute',
            transform: 'rotate(-90deg)',
            transformOrigin: 'center'
          }}
        >
          <circle
            cx={thumbRadius}
            cy={thumbRadius}
            r={thumbRadius}
            fill="transparent"
            stroke="rgba(0, 0, 0, 0.7)"
            strokeWidth={thumbRadius * 2}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <div
          className={css`
            position: absolute;
            font-size: 1.3rem;
            font-weight: bold;
            bottom: 0px;
            right: 3px;
            z-index: 2;
            color: white;
          `}
        >
          {isUnlocked ? <Icon icon="check" size="lg" /> : <>{progress || 0}%</>}
        </div>
        <img
          ref={ThumbLabelContainerRef}
          src={badgeSrc}
          alt="Badge"
          className={css`
            width: 100%;
            height: 100%;
          `}
        />
      </div>
      {titleContext && (
        <FullTextReveal textContext={titleContext} text={itemName} />
      )}
    </div>
  );
}

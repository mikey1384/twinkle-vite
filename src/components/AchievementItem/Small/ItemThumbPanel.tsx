import React, { useState, useEffect, useRef } from 'react';
import FullTextReveal from '~/components/Texts/FullTextRevealFromOuterLayer';
import { css } from '@emotion/css';
import { isMobile } from '~/helpers';
import { mobileFullTextRevealShowDuration } from '~/constants/defaultValues';
import { Color } from '~/constants/css';

const deviceIsMobile = isMobile(navigator);

export default function ItemThumbPanel({
  isThumb,
  thumbSize = '4rem',
  itemName,
  badgeSrc,
  style
}: {
  isThumb?: boolean;
  thumbSize?: string;
  itemName: string;
  badgeSrc?: string;
  style?: React.CSSProperties;
}) {
  const timerRef: React.RefObject<any> = useRef(null);
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

  return (
    <div
      className={
        isThumb
          ? css`
              width: ${thumbSize};
              height: ${thumbSize};
            `
          : css`
              display: flex;
              align-items: center;
              gap: 1rem;
            `
      }
      style={style}
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
          loading="lazy"
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
      {isThumb && titleContext && (
        <FullTextReveal textContext={titleContext} text={itemName} />
      )}
      {!isThumb && (
        <span
          className={css`
            font-weight: bold;
            color: ${Color.black()};
            font-size: 1.5rem;
          `}
        >
          {itemName}
        </span>
      )}
    </div>
  );
}

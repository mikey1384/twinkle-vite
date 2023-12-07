import React, { useState, useEffect, useRef } from 'react';
import FullTextReveal from '~/components/Texts/FullTextRevealFromOuterLayer';
import { css } from '@emotion/css';
import { isMobile } from '~/helpers';
import { mobileFullTextRevealShowDuration } from '~/constants/defaultValues';

const deviceIsMobile = isMobile(navigator);

export default function ItemThumbPanel({
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

  return (
    <div
      className={css`
        margin: 0.5rem;
        width: ${thumbSize};
        height: ${thumbSize};
      `}
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

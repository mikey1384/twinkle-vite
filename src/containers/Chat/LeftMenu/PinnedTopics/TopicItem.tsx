import React, { useState, useCallback, useRef } from 'react';
import Icon from '~/components/Icon';
import FullTextReveal from '~/components/Texts/FullTextReveal';
import { textIsOverflown, isMobile } from '~/helpers';
import { useOutsideTap } from '~/helpers/hooks';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

const deviceIsMobile = isMobile(navigator);

const navStyle = css`
  color: ${Color.darkerGray()};
  cursor: pointer;
  width: 100%;
  padding: 0.7rem 2.5rem;
  text-align: left;
  font-size: 1.4rem;
  font-family: Helvetica;
  &:hover {
    background: ${Color.checkboxAreaGray()};
  }
  &.active {
    color: ${Color.vantaBlack()};
    background: ${Color.highlightGray()};
  }
`;

export default function TopicItem({
  icon,
  children,
  onClick,
  isSelected
}: {
  icon: string;
  children: React.ReactNode;
  onClick: () => void;
  isSelected: boolean;
}) {
  const [showFullText, setShowFullText] = useState(false);
  const timerRef = useRef<number | null>(null);
  const topicRef = useRef<HTMLDivElement>(null);

  const handleInteraction = useCallback(
    (
      event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
    ) => {
      if (deviceIsMobile) {
        if (isSelected) {
          if (textIsOverflown(event.currentTarget)) {
            setShowFullText((prev) => !prev);
          }
        }
      } else {
        if (textIsOverflown(event.currentTarget)) {
          timerRef.current = window.setTimeout(() => {
            setShowFullText(true);
          }, 500);
        }
      }
    },
    [isSelected]
  );

  const handleMouseLeave = useCallback(() => {
    if (!deviceIsMobile) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setShowFullText(false);
    }
  }, []);

  useOutsideTap(topicRef, () => {
    if (deviceIsMobile && showFullText) {
      setShowFullText(false);
    }
  });

  return (
    <div style={{ position: 'relative' }} ref={topicRef}>
      <nav
        style={{ display: 'flex', alignItems: 'center' }}
        className={`${navStyle} ${isSelected ? 'active' : ''}`}
        onClick={onClick}
      >
        <Icon icon={icon} />
        <div
          style={{
            width: 'CALC(100% - 1rem)',
            marginLeft: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexGrow: 1
          }}
        >
          <div
            style={{
              width: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={deviceIsMobile ? undefined : handleInteraction}
            onMouseLeave={deviceIsMobile ? undefined : handleMouseLeave}
            onClick={deviceIsMobile ? handleInteraction : undefined}
          >
            {children}
          </div>
        </div>
      </nav>
      <FullTextReveal
        show={showFullText}
        text={children}
        style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          fontSize: '1rem',
          zIndex: 1000,
          width: '70%'
        }}
      />
    </div>
  );
}

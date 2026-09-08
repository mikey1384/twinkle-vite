import React, { useState, useCallback, useEffect, useRef } from 'react';
import Icon from '~/components/Icon';
import FullTextReveal from '~/components/Texts/FullTextReveal';
import { textIsOverflown, isMobile } from '~/helpers';
import { useOutsideClick } from '~/helpers/hooks';
import { chatSubnavRowClass } from '../../containers';

const deviceIsMobile = isMobile(navigator);

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
  const textRef = useRef<HTMLSpanElement>(null);

  const handleDismiss = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setShowFullText(false);
  }, []);

  useEffect(() => () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
  }, []);

  const handleInteraction = useCallback(
    (
      event: React.MouseEvent<HTMLSpanElement> | React.TouchEvent<HTMLSpanElement>
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
      handleDismiss();
    }
  }, [handleDismiss]);

  useOutsideClick(topicRef, handleDismiss, {
    enabled: deviceIsMobile && showFullText,
    closeOnScroll: true
  });

  return (
    <div style={{ position: 'relative' }} ref={topicRef}>
      <button
        type="button"
        aria-current={isSelected ? 'page' : undefined}
        style={{ display: 'flex', alignItems: 'center' }}
        className={`${chatSubnavRowClass} ${isSelected ? 'active' : ''}`}
        onClick={onClick}
        onFocus={(event) => {
          if (event.currentTarget.matches(':focus-visible') &&
              textRef.current && textIsOverflown(textRef.current)) {
            setShowFullText(true);
          }
        }}
        onBlur={handleDismiss}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && showFullText) {
            event.stopPropagation();
            handleDismiss();
          }
        }}
      >
        <Icon icon={icon} />
        <span
          style={{
            minWidth: 0,
            marginLeft: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flex: '1 1 0'
          }}
        >
          <span
            ref={textRef}
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
          </span>
        </span>
      </button>
      <FullTextReveal
        anchorRef={topicRef}
        onDismiss={handleDismiss}
        show={showFullText}
        text={children}
        direction="left"
        style={{
          fontSize: 'max(14px, 1.4rem)',
          width: 'max-content',
          maxWidth: 'min(32rem, calc(100vw - 24px))',
          maxHeight: 'min(50vh, 24rem)',
          overflowY: 'auto'
        }}
      />
    </div>
  );
}

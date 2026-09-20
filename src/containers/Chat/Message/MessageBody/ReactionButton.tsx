import React, { useEffect, useId, useRef } from 'react';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useKeyContext } from '~/contexts';
import { isMobile } from '~/helpers';
import { useOutsideClick } from '~/helpers/hooks';
import Icon from '~/components/Icon';
import ReactionPicker from './ReactionPicker';
import usePointerBlurGuard, { focusLeft } from './hooks/usePointerBlurGuard';
import { messageControlClass } from './messageControlStyles';

const deviceIsMobile = isMobile(navigator);

export default function ReactionButton({
  style,
  openOnHover = true,
  onReactionClick,
  onSetReactionsMenuShown,
  reactionsMenuShown
}: {
  style?: React.CSSProperties;
  openOnHover?: boolean;
  onReactionClick: (reaction: string) => void;
  onSetReactionsMenuShown: (v: any) => void;
  reactionsMenuShown: boolean;
}) {
  const ContainerRef = useRef<HTMLDivElement | null>(null);
  const TriggerRef = useRef<HTMLButtonElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pickerId = useId();
  const userId = useKeyContext(v => v.myState.userId);
  const blurGuard = usePointerBlurGuard();

  useEffect(() => {
    if (!reactionsMenuShown) clearTimeout(closeTimerRef.current);
    return () => clearTimeout(closeTimerRef.current);
  }, [reactionsMenuShown]);

  useOutsideClick(ContainerRef, dismissPicker, {
    enabled: reactionsMenuShown,
    closeOnScroll: false
  });

  return (
    <ErrorBoundary componentPath="Message/ReactionButton">
      <div
        ref={ContainerRef}
        {...blurGuard.guardProps}
        style={{ position: 'relative', display: 'flex', ...style, zIndex: reactionsMenuShown ? 6000 : undefined }}
        onMouseEnter={() => {
          clearTimeout(closeTimerRef.current);
          // An explicitly opened action menu takes priority over incidental hover.
          if (!deviceIsMobile && openOnHover) onSetReactionsMenuShown(true);
        }}
        onMouseLeave={() => {
          if (
            !deviceIsMobile &&
            !ContainerRef.current?.contains(document.activeElement)
          ) {
            clearTimeout(closeTimerRef.current);
            // Allow a diagonal path into the picker or a brief pointer overshoot.
            closeTimerRef.current = setTimeout(() => {
              if (!ContainerRef.current?.contains(document.activeElement)) {
                dismissPicker();
              }
            }, 200);
          }
        }}
        onBlur={(event) => {
          if (focusLeft(event, blurGuard.isPressedInside)) {
            dismissPicker();
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && reactionsMenuShown) {
            event.preventDefault();
            event.stopPropagation();
            dismissPicker();
            TriggerRef.current?.focus();
          }
        }}
      >
        <Button
          buttonRef={TriggerRef}
          aria-label="Add reaction"
          aria-expanded={reactionsMenuShown}
          aria-controls={pickerId}
          className={`menu-button ${messageControlClass}`}
          color="darkerGray"
          variant="solid"
          tone="raised"
          onClick={(event) => {
            clearTimeout(closeTimerRef.current);
            event?.stopPropagation();
            // Preserve desktop hover-to-open. A mouse click keeps it open;
            // keyboard activation and touch toggle it normally.
            if (deviceIsMobile || event?.detail === 0) {
              onSetReactionsMenuShown((shown: boolean) => !shown);
            } else {
              onSetReactionsMenuShown(true);
            }
          }}
        >
          <Icon icon="thumbs-up" />
        </Button>
        {reactionsMenuShown && <ReactionPicker
          key={userId || 'guest'}
          id={pickerId}
          userId={userId}
          anchorRef={ContainerRef}
          onDismiss={dismissPicker}
          onReact={reaction => {
            onReactionClick(reaction);
            dismissPicker();
            TriggerRef.current?.focus();
          }}
        />}
      </div>
    </ErrorBoundary>
  );

  function dismissPicker() {
    clearTimeout(closeTimerRef.current);
    onSetReactionsMenuShown(false);
  }
}

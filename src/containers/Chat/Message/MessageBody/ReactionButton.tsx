import React, { useId, useRef } from 'react';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useKeyContext } from '~/contexts';
import { isMobile } from '~/helpers';
import { useOutsideClick } from '~/helpers/hooks';
import Icon from '~/components/Icon';
import ReactionPicker from './ReactionPicker';
import { messageControlClass } from './messageControlStyles';

const deviceIsMobile = isMobile(navigator);

export default function ReactionButton({
  style,
  onReactionClick,
  onSetReactionsMenuShown,
  reactionsMenuShown
}: {
  style?: React.CSSProperties;
  onReactionClick: (reaction: string) => void;
  onSetReactionsMenuShown: (v: any) => void;
  reactionsMenuShown: boolean;
}) {
  const ContainerRef = useRef<HTMLDivElement | null>(null);
  const TriggerRef = useRef<HTMLButtonElement | null>(null);
  const pickerId = useId();
  const userId = useKeyContext(v => v.myState.userId);

  useOutsideClick(ContainerRef, () => onSetReactionsMenuShown(false), {
    enabled: reactionsMenuShown,
    closeOnScroll: false
  });

  return (
    <ErrorBoundary componentPath="Message/ReactionButton">
      <div
        ref={ContainerRef}
        style={{ position: 'relative', display: 'flex', ...style, zIndex: reactionsMenuShown ? 6000 : undefined }}
        onMouseEnter={() => {
          if (!deviceIsMobile) onSetReactionsMenuShown(true);
        }}
        onMouseLeave={() => {
          if (
            !deviceIsMobile &&
            !ContainerRef.current?.contains(document.activeElement)
          ) {
            onSetReactionsMenuShown(false);
          }
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            onSetReactionsMenuShown(false);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && reactionsMenuShown) {
            event.preventDefault();
            event.stopPropagation();
            onSetReactionsMenuShown(false);
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
          onDismiss={() => onSetReactionsMenuShown(false)}
          onReact={reaction => {
            onReactionClick(reaction);
            onSetReactionsMenuShown(false);
            TriggerRef.current?.focus();
          }}
        />}
      </div>
    </ErrorBoundary>
  );
}

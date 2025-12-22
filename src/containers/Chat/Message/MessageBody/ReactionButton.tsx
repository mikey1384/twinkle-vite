import React, { useRef } from 'react';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import { reactionsObj } from '~/constants/defaultValues';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { isMobile } from '~/helpers';
import { useOutsideTap } from '~/helpers/hooks';
import Icon from '~/components/Icon';

const deviceIsMobile = isMobile(navigator);

const reactions = [
  'angry',
  'crying',
  'surprised',
  'wave',
  'laughing',
  'heart',
  'thumb'
];

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
  const BarRef = useRef(null);
  const coolDownRef: React.RefObject<any> = useRef(null);

  // Only register outside-tap listener on mobile when menu is shown
  useOutsideTap(
    deviceIsMobile && reactionsMenuShown ? BarRef : { current: null },
    () => {
      coolDownRef.current = true;
      onSetReactionsMenuShown(false);
      setTimeout(() => {
        coolDownRef.current = false;
      }, 100);
    }
  );

  return (
    <ErrorBoundary componentPath="Message/ReactionButton">
      <div
        style={{ display: 'flex', ...style }}
        onMouseEnter={() =>
          deviceIsMobile ? {} : onSetReactionsMenuShown(true)
        }
        onMouseLeave={() =>
          deviceIsMobile ? {} : onSetReactionsMenuShown(false)
        }
      >
        <div
          ref={BarRef}
          style={{
            zIndex: reactionsMenuShown ? 5000 : 0,
            display: reactionsMenuShown ? 'flex' : 'none',
            background: 'rgb(255, 255, 255)',
            justifyContent: 'space-around',
            alignItems: 'center',
            marginRight: '0.5rem',
            boxShadow: `0 0 1px ${Color.black()}`,
            outline: 0
          }}
          className={css`
            width: 20rem;
            @media (max-width: ${mobileMaxWidth}) {
              width: 16rem;
            }
          `}
        >
          {reactions.map((reaction) => (
            <div
              key={reaction}
              className={css`
                cursor: pointer;
                width: 2rem;
                height: 2rem;
                background: url('/img/emojis.png')
                  ${reactionsObj[reaction].position} / 5100%;
                transition: all 0.1s ease-in-out;
                &:hover {
                  transform: scale(1.5);
                }
                @media (max-width: ${mobileMaxWidth}) {
                  width: 1.7rem;
                  height: 1.7rem;
                  &:hover {
                    transform: none;
                  }
                }
              `}
              onClick={() => handleReactionClick(reaction)}
            />
          ))}
        </div>
        <Button
          className="menu-button"
          style={{
            zIndex: 5000,
            padding: '0.5rem 0.7rem',
            lineHeight: 1
          }}
          color="darkerGray"
          variant="solid"
          tone="raised"
          onClick={() => (deviceIsMobile ? handleReactionBarShown() : {})}
        >
          <Icon icon="thumbs-up" />
        </Button>
      </div>
    </ErrorBoundary>
  );

  function handleReactionBarShown() {
    if (coolDownRef.current) return;
    coolDownRef.current = true;
    onSetReactionsMenuShown((shown: boolean) => !shown);
    setTimeout(() => {
      coolDownRef.current = false;
    }, 100);
  }

  function handleReactionClick(reaction: any) {
    onReactionClick(reaction);
    onSetReactionsMenuShown(false);
  }
}

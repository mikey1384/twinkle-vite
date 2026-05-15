import React, { useRef, useState } from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useContentContext, useKeyContext } from '~/contexts';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import FullTextReveal from '~/components/Texts/FullTextReveal';
import { isMobile } from '~/helpers';
import { mobileFullTextRevealShowDuration } from '~/constants/defaultValues';
import { getXpRewardActionBlockedReason } from '~/helpers/contentActionAvailability';

const rewardLabel = 'Reward';

const blockedRewardButtonClass = css`
  cursor: default;

  &:hover {
    cursor: default;
  }
`;

export default function RewardButton({
  className,
  contentId,
  contentType,
  disableReason,
  labelClassName,
  hideLabel,
  style,
  theme,
  variant = 'soft',
  tone = 'raised'
}: {
  className?: string;
  contentId: number;
  contentType: string;
  disableReason?: string | boolean;
  labelClassName?: string;
  hideLabel?: boolean;
  style?: React.CSSProperties;
  theme?: string;
  variant?: 'solid' | 'soft' | 'outline' | 'ghost';
  tone?: 'flat' | 'raised';
}) {
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const onSetXpRewardInterfaceShown = useContentContext(
    (v) => v.actions.onSetXpRewardInterfaceShown
  );
  const { colorKey: rewardColor } = useRoleColor('reward', {
    themeName: theme || profileTheme,
    fallback: 'pink'
  });
  const deviceIsMobile = isMobile(navigator);
  const [showReason, setShowReason] = useState(false);
  const timerRef = useRef<number | null>(null);
  const blockedReason =
    typeof disableReason === 'string'
      ? getXpRewardActionBlockedReason(disableReason) || disableReason
      : getXpRewardActionBlockedReason(disableReason);
  const isBlocked = Boolean(blockedReason);

  function handleMouseEnter() {
    if (!deviceIsMobile && blockedReason) {
      setShowReason(true);
    }
  }

  function handleMouseLeave() {
    if (!deviceIsMobile) {
      setShowReason(false);
    }
  }

  function handleTouchStart() {
    if (blockedReason) {
      setShowReason(true);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        setShowReason(false);
        timerRef.current = null;
      }, mobileFullTextRevealShowDuration);
    }
  }

  function handleTouchEnd() {
    // Let the timer close it; no-op here
  }

  function handleRewardButtonClick(
    event?: React.MouseEvent<HTMLButtonElement>
  ) {
    if (isBlocked) {
      event?.preventDefault();
      event?.stopPropagation();
      return;
    }
    onSetXpRewardInterfaceShown({
      contentId,
      contentType,
      shown: true
    });
  }

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <Button
        variant={variant}
        tone={tone}
        className={`${className || ''} ${isBlocked ? blockedRewardButtonClass : ''}`}
        color={rewardColor}
        style={style}
        onClick={handleRewardButtonClick}
      >
        <Icon icon="certificate" />
        {!hideLabel && (
          <span className={labelClassName} style={{ marginLeft: '0.7rem' }}>
            {rewardLabel}
          </span>
        )}
      </Button>
      <FullTextReveal
        show={!!(showReason && blockedReason)}
        text={blockedReason}
        style={{
          minWidth: '14rem',
          width: 'max-content',
          maxWidth: '32rem',
          fontSize: '1.2rem'
        }}
      />
    </div>
  );
}

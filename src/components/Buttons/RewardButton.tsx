import React, { useRef, useState } from 'react';
import Button from '~/components/Button';import Icon from '~/components/Icon';
import { useContentContext, useKeyContext } from '~/contexts';
import { useRoleColor } from '~/theme/useRoleColor';
import FullTextReveal from '~/components/Texts/FullTextReveal';
import { isMobile } from '~/helpers';
import { mobileFullTextRevealShowDuration } from '~/constants/defaultValues';

const rewardLabel = 'Reward';

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

  function handleMouseEnter() {
    if (!deviceIsMobile && typeof disableReason === 'string' && hideLabel) {
      setShowReason(true);
    }
  }

  function handleMouseLeave() {
    if (!deviceIsMobile) {
      setShowReason(false);
    }
  }

  function handleTouchStart() {
    if (typeof disableReason === 'string' && hideLabel) {
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
        className={className}
        color={rewardColor}
        style={style}
        onClick={() =>
          onSetXpRewardInterfaceShown({
            contentId,
            contentType,
            shown: true
          })
        }
        disabled={!!disableReason}
      >
        <Icon icon="certificate" />
        {!hideLabel && (
          <span className={labelClassName} style={{ marginLeft: '0.7rem' }}>
            {disableReason || rewardLabel}
          </span>
        )}
      </Button>
      <FullTextReveal
        show={!!(showReason && typeof disableReason === 'string' && hideLabel)}
        text={disableReason as string}
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

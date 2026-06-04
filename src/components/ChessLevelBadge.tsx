import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { useAppContext, useHomeContext, useKeyContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import { User } from '~/types';

type BadgeSize = 'sm' | 'md' | 'lg';

type ChessLevelUser = Pick<User, 'id' | 'username' | 'profilePicUrl'> & {
  chessMaxLevelUnlocked?: number | null;
};

const sizeStyles: Record<
  BadgeSize,
  {
    fontSize: string;
    iconSize: string;
    minHeight: string;
    mobileFontSize: string;
    mobileIconSize: string;
    mobileMinHeight: string;
    mobilePadding: string;
    padding: string;
  }
> = {
  sm: {
    fontSize: '1.05rem',
    iconSize: '1rem',
    minHeight: '2.2rem',
    mobileFontSize: '1rem',
    mobileIconSize: '1rem',
    mobileMinHeight: '2rem',
    mobilePadding: '0.28rem 0.55rem',
    padding: '0.3rem 0.65rem'
  },
  md: {
    fontSize: '1.2rem',
    iconSize: '1.1rem',
    minHeight: '2.6rem',
    mobileFontSize: '1rem',
    mobileIconSize: '1rem',
    mobileMinHeight: '2.1rem',
    mobilePadding: '0.3rem 0.6rem',
    padding: '0.4rem 0.8rem'
  },
  lg: {
    fontSize: '1.35rem',
    iconSize: '1.2rem',
    minHeight: '3rem',
    mobileFontSize: '1rem',
    mobileIconSize: '1rem',
    mobileMinHeight: '2.2rem',
    mobilePadding: '0.32rem 0.65rem',
    padding: '0.45rem 1rem'
  }
};

export default function ChessLevelBadge({
  className,
  level,
  onOpenOptions,
  size = 'md',
  style,
  user
}: {
  className?: string;
  level?: number | null;
  onOpenOptions?: () => void;
  size?: BadgeSize;
  style?: React.CSSProperties;
  user?: ChessLevelUser;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const onOpenSigninModal = useAppContext(
    (v) => v.user.actions.onOpenSigninModal
  );
  const onSetChessOptionsTargetUser = useHomeContext(
    (v) => v.actions.onSetChessOptionsTargetUser
  );
  const normalizedLevel = useMemo(() => {
    const rawLevel = Number(level ?? user?.chessMaxLevelUnlocked);
    return Number.isInteger(rawLevel) && rawLevel >= 5 ? rawLevel : null;
  }, [level, user?.chessMaxLevelUnlocked]);

  if (!normalizedLevel || !user?.id || !user.username) return null;

  const badgeUser = user;
  const theme = getChessBadgeTheme(normalizedLevel);
  const dimensions = sizeStyles[size];
  const displayLevel =
    normalizedLevel === 42 ? '42' : `Lv ${normalizedLevel}`;

  return (
    <button
      type="button"
      title={`Chess puzzle level ${normalizedLevel}`}
      aria-label={`Chess puzzle level ${normalizedLevel}`}
      className={`${className || ''} ${css`
        align-items: center;
        appearance: none;
        background: ${theme.background};
        border: 1px solid ${theme.border};
        border-radius: 999px;
        box-shadow: ${theme.shadow};
        color: ${theme.color};
        cursor: pointer;
        display: inline-flex;
        font-family: inherit;
        font-size: ${dimensions.fontSize};
        font-weight: 800;
        gap: 0.45rem;
        justify-content: center;
        letter-spacing: 0;
        line-height: 1;
        min-height: ${dimensions.minHeight};
        padding: ${dimensions.padding};
        text-shadow: none;
        white-space: nowrap;

        @media (max-width: ${mobileMaxWidth}) {
          font-size: ${dimensions.mobileFontSize};
          gap: 0.35rem;
          min-height: ${dimensions.mobileMinHeight};
          padding: ${dimensions.mobilePadding};
        }

        &:hover {
          filter: brightness(0.96);
          transform: translateY(1px);
        }

        &:active {
          filter: brightness(0.92);
          transform: translateY(2px);
        }
      `}`}
      style={style}
      onClick={handleClick}
    >
      <Icon
        icon="chess"
        className={css`
          font-size: ${dimensions.iconSize};
          @media (max-width: ${mobileMaxWidth}) {
            font-size: ${dimensions.mobileIconSize};
          }
        `}
      />
      <span>{displayLevel}</span>
    </button>
  );

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (!userId) {
      onOpenSigninModal();
      return;
    }

    onSetChessOptionsTargetUser({
      id: badgeUser.id,
      username: badgeUser.username,
      profilePicUrl: badgeUser.profilePicUrl,
      chessMaxLevelUnlocked: normalizedLevel
    });
    onOpenOptions?.();
  }
}

function getChessBadgeTheme(level: number) {
  if (level >= 42) {
    return {
      background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
      border: '#64748b',
      color: '#f1f5f9',
      shadow: '0 2px 8px rgba(30, 41, 59, 0.28)'
    };
  }
  if (level >= 37) {
    return {
      background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
      border: '#d97706',
      color: '#fff',
      shadow: '0 2px 8px rgba(251, 191, 36, 0.28)'
    };
  }
  if (level >= 31) {
    return {
      background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
      border: '#991b1b',
      color: '#fff',
      shadow: '0 2px 8px rgba(220, 38, 38, 0.28)'
    };
  }
  if (level >= 25) {
    return {
      background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
      border: '#7c3aed',
      color: '#fff',
      shadow: '0 2px 8px rgba(139, 92, 246, 0.28)'
    };
  }
  if (level >= 20) {
    return {
      background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
      border: '#334155',
      color: '#fff',
      shadow: '0 2px 8px rgba(100, 116, 139, 0.18)'
    };
  }
  if (level >= 15) {
    return {
      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      border: '#1d4ed8',
      color: '#fff',
      shadow: '0 2px 8px rgba(59, 130, 246, 0.18)'
    };
  }
  return {
    background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
    border: '#22c55e',
    color: '#15803d',
    shadow: '0 2px 8px rgba(34, 197, 94, 0.16)'
  };
}

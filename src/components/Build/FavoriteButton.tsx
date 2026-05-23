import React, { useState } from 'react';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import {
  useAppContext,
  useBuildContext,
  useContentContext,
  useKeyContext
} from '~/contexts';
import { css, cx } from '@emotion/css';

const buildFavoriteButtonClass = css`
  width: 2.35rem;
  height: 2.35rem;
  flex: 0 0 auto;
  border: 1px solid rgba(20, 35, 60, 0.16);
  border-radius: 8px;
  background: #fff;
  color: ${Color.brownOrange()};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;

  &:hover {
    border-color: ${Color.brownOrange(0.4)};
    background: ${Color.brownOrange(0.08)};
    transform: translateY(-1px);
  }

  &.active {
    background: #fff;
    border-color: ${Color.brownOrange(0.65)};
    box-shadow:
      inset 0 0 0 1px ${Color.brownOrange(0.24)},
      0 2px 7px ${Color.brownOrange(0.18)};
  }

  &.active:hover {
    background: #fff;
  }

  &:disabled {
    cursor: default;
    opacity: 0.66;
    transform: none;
  }

  &:focus-visible {
    outline: 2px solid ${Color.brownOrange()};
    outline-offset: 2px;
  }
`;

const smallBuildFavoriteButtonClass = css`
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 7px;
`;

const pillBuildFavoriteButtonClass = css`
  width: auto;
  min-width: 2.75rem;
  height: 2.75rem;
  gap: 0.42rem;
  padding: 0 0.82rem;
  border-radius: 999px;
  font-size: 1.1rem;
  font-weight: 900;
`;

const labelClass = css`
  font-size: 1.1rem;
  font-weight: 900;
`;

export interface BuildFavoriteChange {
  buildId: number;
  favoritedAt: number | null;
  favoriteActivityAt: number | null;
  isFavorited: boolean;
  requestedFavorited: boolean;
  result: any;
}

export default function FavoriteButton({
  buildId,
  className,
  disabled,
  favorited,
  label,
  loading,
  onChange,
  onError,
  onStart,
  preventDefault,
  stopPropagation,
  size = 'md'
}: {
  buildId: number;
  className?: string;
  disabled?: boolean;
  favorited: boolean;
  label?: string;
  loading?: boolean;
  onChange?: (change: BuildFavoriteChange) => void;
  onError?: (
    error: unknown,
    params: { buildId: number; requestedFavorited: boolean }
  ) => void;
  onStart?: (params: { buildId: number; requestedFavorited: boolean }) => void;
  preventDefault?: boolean;
  size?: 'sm' | 'md' | 'pill';
  stopPropagation?: boolean;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const onOpenSigninModal = useAppContext(
    (v) => v.user.actions.onOpenSigninModal
  );
  const updateBuildFavorite = useAppContext(
    (v) => v.requestHelpers.updateBuildFavorite
  );
  const onUpdateBuildFavorite = useContentContext(
    (v) => v.actions.onUpdateBuildFavorite
  );
  const onPatchBuildSummary = useBuildContext(
    (v) => v.actions.onPatchBuildSummary
  );
  const [requestLoading, setRequestLoading] = useState(false);
  const buttonLoading = Boolean(loading || requestLoading);
  const title = favorited ? 'Remove favorite' : 'Add favorite';
  return (
    <button
      type="button"
      className={cx(
        buildFavoriteButtonClass,
        size === 'sm' && smallBuildFavoriteButtonClass,
        size === 'pill' && pillBuildFavoriteButtonClass,
        favorited && 'active',
        className
      )}
      disabled={disabled || buttonLoading}
      title={title}
      aria-label={title}
      aria-pressed={favorited}
      onClick={handleClick}
    >
      <Icon
        icon={buttonLoading ? 'spinner' : favorited ? 'star' : ['far', 'star']}
        pulse={buttonLoading}
      />
      {label ? <span className={labelClass}>{label}</span> : null}
    </button>
  );

  async function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (preventDefault) {
      event.preventDefault();
    }
    if (stopPropagation) {
      event.stopPropagation();
    }
    if (!buildId || disabled || buttonLoading) return;
    if (!userId) {
      onOpenSigninModal();
      return;
    }
    const requestedFavorited = !favorited;
    setRequestLoading(true);
    onStart?.({ buildId, requestedFavorited });
    try {
      const result = await updateBuildFavorite({
        buildId,
        favorited: requestedFavorited
      });
      if (typeof result?.isFavorited !== 'boolean') {
        throw new Error('Favorite response did not include state.');
      }
      const nextState: BuildFavoriteChange = {
        buildId,
        favoritedAt: result.isFavorited
          ? Number(result?.favoritedAt || 0) || null
          : null,
        favoriteActivityAt: result.isFavorited
          ? Number(result?.favoriteActivityAt || result?.favoritedAt || 0) ||
            null
          : null,
        isFavorited: result.isFavorited,
        requestedFavorited,
        result
      };
      onUpdateBuildFavorite(nextState);
      onPatchBuildSummary({
        buildId,
        patch: {
          favoriteActivityAt: nextState.favoriteActivityAt,
          favoriteStateUserId: Number(userId) || null,
          favoritedAt: nextState.favoritedAt,
          isFavorited: nextState.isFavorited
        }
      });
      onChange?.(nextState);
    } catch (error) {
      if (onError) {
        onError(error, { buildId, requestedFavorited });
      } else {
        console.error('Failed to update build favorite:', error);
      }
    } finally {
      setRequestLoading(false);
    }
  }
}

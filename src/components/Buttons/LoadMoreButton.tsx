import React from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { useTheme } from '~/helpers/hooks';
import { useKeyContext } from '~/contexts';
import localize from '~/constants/localize';

const loadMoreLabel = localize('loadMore');
const loadingLabel = localize('loading');

export default function LoadMoreButton({
  label,
  loading,
  color,
  theme,
  ...props
}: {
  label?: string;
  loading?: boolean;
  color?: string;
  theme?: string;
  [key: string]: any;
}) {
  const { profileTheme } = useKeyContext((v) => v.myState);
  const {
    loadMoreButton: { color: loadMoreButtonColor }
  } = useTheme(theme || profileTheme);

  return (
    <ErrorBoundary componentPath="LoadMoreButton">
      <div
        className={css`
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        `}
      >
        <Button
          disabled={!!loading}
          color={color || loadMoreButtonColor}
          {...props}
        >
          {loading ? loadingLabel : label || loadMoreLabel}
          {loading && (
            <Icon style={{ marginLeft: '0.7rem' }} icon="spinner" pulse />
          )}
        </Button>
      </div>
    </ErrorBoundary>
  );
}

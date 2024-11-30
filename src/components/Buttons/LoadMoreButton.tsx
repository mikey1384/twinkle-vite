import React, { useMemo } from 'react';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { returnTheme } from '~/helpers';
import { useKeyContext } from '~/contexts';
import localize from '~/constants/localize';

const loadMoreLabel = localize('loadMore');
const loadingLabel = localize('loading');

export default function LoadMoreButton({
  label,
  loading,
  color,
  onClick,
  theme,
  ...props
}: {
  label?: string;
  loading?: boolean;
  color?: string;
  onClick: () => any;
  theme?: string;
  [key: string]: any;
}) {
  const { profileTheme } = useKeyContext((v) => v.myState);
  const {
    loadMoreButton: { color: loadMoreButtonColor }
  } = useMemo(() => returnTheme(theme || profileTheme), [profileTheme, theme]);

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
          loading={!!loading}
          color={color || loadMoreButtonColor}
          onClick={onClick}
          {...props}
        >
          {loading ? loadingLabel : label || loadMoreLabel}
        </Button>
      </div>
    </ErrorBoundary>
  );
}

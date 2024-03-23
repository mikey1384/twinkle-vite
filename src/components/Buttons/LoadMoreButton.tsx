import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { returnTheme } from '~/helpers';
import { useKeyContext } from '~/contexts';
import localize from '~/constants/localize';

const loadMoreLabel = localize('loadMore');
const loadingLabel = localize('loading');

LoadMoreButton.propTypes = {
  label: PropTypes.string,
  loading: PropTypes.bool,
  color: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  theme: PropTypes.string
};
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
          disabled={!!loading}
          color={color || loadMoreButtonColor}
          onClick={onClick}
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

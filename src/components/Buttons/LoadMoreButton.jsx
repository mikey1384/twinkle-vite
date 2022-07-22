import PropTypes from 'prop-types';
import React from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import localize from '~/constants/localize';

const loadMoreLabel = localize('loadMore');
const loadingLabel = localize('loading');

LoadMoreButton.propTypes = {
  label: PropTypes.string,
  style: PropTypes.object,
  onClick: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default function LoadMoreButton({ label, loading, ...props }) {
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
        <Button disabled={!!loading} {...props}>
          {loading ? loadingLabel : label || loadMoreLabel}
          {loading && (
            <Icon style={{ marginLeft: '0.7rem' }} icon="spinner" pulse />
          )}
        </Button>
      </div>
    </ErrorBoundary>
  );
}

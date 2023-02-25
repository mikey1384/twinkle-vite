import PropTypes from 'prop-types';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { useTheme } from '~/helpers/hooks';
import { useKeyContext } from '~/contexts';
import localize from '~/constants/localize';

const loadMoreLabel = localize('loadMore');
const loadingLabel = localize('loading');

LoadMoreButton.propTypes = {
  color: PropTypes.string,
  label: PropTypes.string,
  style: PropTypes.object,
  theme: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default function LoadMoreButton({
  label,
  loading,
  color,
  theme,
  ...props
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

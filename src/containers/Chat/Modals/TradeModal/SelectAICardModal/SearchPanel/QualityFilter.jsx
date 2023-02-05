import PropTypes from 'prop-types';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

QualityFilter.propTypes = {
  filters: PropTypes.object,
  onSetFilters: PropTypes.func
};

export default function QualityFilter({ filters, onSetFilters }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <div className="label">Quality</div>
      <div style={{ marginTop: '0.5rem' }}>
        <Button
          mobilePadding="0.5rem 1rem"
          color={
            filters.quality === 'superior'
              ? 'green'
              : filters.quality === 'rare'
              ? 'purple'
              : filters.quality === 'elite'
              ? 'redOrange'
              : filters.quality === 'legendary'
              ? 'gold'
              : 'darkerGray'
          }
          skeuomorphic
          onClick={() => onSetFilters('quality')}
        >
          <Icon icon="caret-down" />
          <span>&nbsp;&nbsp;</span>
          <span
            className={css`
              font-size: 1.4rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.1rem;
              }
            `}
          >
            {filters.quality || 'Any'}
          </span>
        </Button>
      </div>
    </div>
  );
}

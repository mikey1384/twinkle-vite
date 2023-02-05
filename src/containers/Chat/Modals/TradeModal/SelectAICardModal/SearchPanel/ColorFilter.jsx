import PropTypes from 'prop-types';
import Button from '~/components/Button';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { mobileMaxWidth } from '~/constants/css';

ColorFilter.propTypes = {
  filters: PropTypes.object,
  onSetFilters: PropTypes.func
};

export default function ColorFilter({ filters, onSetFilters }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <div className="label">Color</div>
      <div style={{ marginTop: '0.5rem' }}>
        <Button
          mobilePadding="0.5rem 1rem"
          color={
            filters.color
              ? filters.color === 'blue'
                ? 'logoBlue'
                : filters.color
              : 'darkerGray'
          }
          skeuomorphic
          onClick={() => onSetFilters('color')}
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
            {filters.color || 'Any'}
          </span>
        </Button>
      </div>
    </div>
  );
}

import PropTypes from 'prop-types';
import ColorFilter from './ColorFilter';
import QualityFilter from './QualityFilter';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

SearchPanel.propTypes = {
  filters: PropTypes.object.isRequired,
  onSetFilters: PropTypes.func.isRequired
};

export default function SearchPanel({ filters, onSetFilters }) {
  return (
    <div
      className={css`
        font-size: 1.7rem;
        width: 50%;
        padding: 1rem;
        background: #fff;
        border: 1px solid ${Color.borderGray()};
        margin-bottom: 2rem;
        .label {
          font-family: 'Roboto', sans-serif;
          font-weight: bold;
          font-size: 1.5rem;
          color: ${Color.darkerGray()};
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.1rem;
          }
        }
        @media (max-width: ${mobileMaxWidth}) {
          width: 100%;
        }
      `}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          width: '100%'
        }}
      >
        <ColorFilter filters={filters} onSetFilters={onSetFilters} />
        <QualityFilter filters={filters} onSetFilters={onSetFilters} />
      </div>
    </div>
  );
}

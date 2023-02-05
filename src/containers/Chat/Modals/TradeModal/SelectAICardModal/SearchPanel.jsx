import PropTypes from 'prop-types';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
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
      </div>
    </div>
  );
}

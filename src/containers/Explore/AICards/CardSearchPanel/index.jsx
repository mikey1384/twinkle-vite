import PropTypes from 'prop-types';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import ButtonContainer from './ButtonContainer';
import SwitchButton from '~/components/Buttons/SwitchButton';
import { isMobile } from '~/helpers';

const deviceIsMobile = isMobile(navigator);

CardSearchPanel.propTypes = {
  filters: PropTypes.object.isRequired,
  onSetSelectedFilter: PropTypes.func.isRequired
};

export default function CardSearchPanel({ filters, onSetSelectedFilter }) {
  return (
    <div
      className={css`
        font-size: 1.7rem;
        width: 100%;
        padding: 1rem;
        background: #fff;
        border: 1px solid ${Color.borderGray()};
        .label {
          font-family: 'Roboto', sans-serif;
          font-weight: bold;
          font-size: 1.5rem;
          color: ${Color.darkerGray()};
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
        <ButtonContainer label="Owner:">
          <Button
            color={filters.owner ? 'logoBlue' : 'darkerGray'}
            skeuomorphic
            onClick={() => onSetSelectedFilter('owner')}
          >
            <Icon icon="caret-down" />
            <span>&nbsp;&nbsp;</span>
            {filters.owner || 'Anyone'}
          </Button>
        </ButtonContainer>
        <ButtonContainer label="Color:">
          <Button
            color={
              filters.color
                ? filters.color === 'blue'
                  ? 'logoBlue'
                  : filters.color
                : 'darkerGray'
            }
            skeuomorphic
            onClick={() => onSetSelectedFilter('color')}
          >
            <Icon icon="caret-down" />
            <span>&nbsp;&nbsp;</span>
            {filters.color || 'Any'}
          </Button>
        </ButtonContainer>
        <ButtonContainer label="Quality:">
          <Button
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
            onClick={() => onSetSelectedFilter('quality')}
          >
            <Icon icon="caret-down" />
            <span>&nbsp;&nbsp;</span>
            {filters.quality || 'Any'}
          </Button>
        </ButtonContainer>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <SwitchButton
            small={deviceIsMobile}
            checked={filters.isBuyNow}
            label="Buy Now"
            onChange={() => console.log('pressed')}
          />
        </div>
      </div>
    </div>
  );
}

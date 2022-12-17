import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

UnlistedMenu.propTypes = {
  onSetSellModalShown: PropTypes.func.isRequired,
  onSetIsBurned: PropTypes.func.isRequired
};

export default function UnlistedMenu({ onSetSellModalShown, onSetIsBurned }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column'
      }}
      className={css`
        font-size: 1.6rem;
        @media (max-width: ${mobileMaxWidth}) {
          font-size: 1.1rem;
        }
      `}
    >
      <div
        className={css`
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
        `}
      >
        <p
          className={css`
            margin-bottom: 2rem;
            @media (max-width: ${mobileMaxWidth}) {
              margin-bottom: 1rem;
            }
          `}
        >
          {`List this card on the market so others can buy it.`}
        </p>
        <Button
          onClick={() => onSetSellModalShown(true)}
          color="oceanBlue"
          filled
        >
          <Icon icon="shopping-cart" />
          <span style={{ marginLeft: '0.7rem' }}>Sell</span>
        </Button>
      </div>
      <div
        style={{
          marginTop: '5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }}
      >
        <p
          className={css`
            margin-bottom: 2rem;
            @media (max-width: ${mobileMaxWidth}) {
              margin-bottom: 1rem;
            }
          `}
        >
          {`Destroy this card and receive XP based on its color and quality. The more valuable the color and the higher the quality, the more XP you will receive. This action is irreversible, so use it wisely.`}
        </p>
        <Button onClick={() => onSetIsBurned(true)} color="redOrange" filled>
          <Icon icon="fire" />
          <span style={{ marginLeft: '0.7rem' }}>Burn</span>
        </Button>
      </div>
    </div>
  );
}

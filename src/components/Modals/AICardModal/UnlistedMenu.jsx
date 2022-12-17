import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import Button from '~/components/Button';

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
    >
      <div
        style={{
          height: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }}
      >
        <p style={{ marginBottom: '2rem' }}>
          {`List this card on the market so others can buy it. You can set the price and choose how long you want it to be listed for.`}
        </p>
        <Button
          onClick={() => onSetSellModalShown(true)}
          color="oceanBlue"
          filled
          style={{ border: 'none' }}
        >
          <Icon icon="shopping-cart" />
          <span style={{ marginLeft: '0.7rem' }}>Sell</span>
        </Button>
      </div>
      <div
        style={{
          height: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }}
      >
        <p style={{ marginBottom: '2rem' }}>
          {`Destroy this card and receive XP based on its color and quality. The more valuable the color and the higher the quality, the more XP you will receive. This action is irreversible, so use it wisely.`}
        </p>
        <Button
          onClick={() => onSetIsBurned(true)}
          color="redOrange"
          filled
          style={{ border: 'none' }}
        >
          <Icon icon="fire" />
          <span style={{ marginLeft: '0.7rem' }}>Burn</span>
        </Button>
      </div>
    </div>
  );
}

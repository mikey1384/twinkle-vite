import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import Input from '~/components/Texts/Input';
import Button from '~/components/Button';
import SelectedCards from './SelectedCards';
import { css } from '@emotion/css';
import { useKeyContext } from '~/contexts';
import { borderRadius, Color } from '~/constants/css';

MyWant.propTypes = {
  coinAmount: PropTypes.number.isRequired,
  style: PropTypes.object,
  onSetCoinAmount: PropTypes.func.isRequired,
  onShowAICardSelector: PropTypes.func.isRequired,
  selectedCardIds: PropTypes.array.isRequired,
  onDeselect: PropTypes.func.isRequired,
  partnerId: PropTypes.number.isRequired
};

export default function MyWant({
  coinAmount,
  style,
  onSetCoinAmount,
  onShowAICardSelector,
  selectedCardIds,
  onDeselect,
  partnerId
}) {
  const { profileTheme } = useKeyContext((v) => v.myState);
  return (
    <div
      style={{
        width: '100%',
        ...style
      }}
    >
      <p style={{ fontWeight: 'bold', fontSize: '2rem' }}>I want...</p>
      <div
        style={{
          marginTop: '0.5rem',
          padding: '2rem',
          border: `1px solid ${Color.borderGray()}`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          borderRadius
        }}
      >
        <div style={{ width: 'auto' }}>
          <div
            className={css`
              font-weight: bold;
              font-size: 1.6rem;
              color: ${Color.darkerGray()};
              display: flex;
              align-items: center;
            `}
          >
            Twinkle Coins (
            <Icon
              style={{ color: Color.brownOrange() }}
              icon={['far', 'badge-dollar']}
            />
            )
          </div>
          <Input
            onChange={handleAmountChange}
            placeholder="Amount"
            value={coinAmount}
            style={{
              fontSize: '1.7rem',
              padding: '0.5rem',
              borderRadius,
              lineHeight: 1.5,
              marginTop: '0.5rem'
            }}
          />
        </div>
        <div
          style={{
            marginTop: '2rem',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <div
            className={css`
              font-weight: bold;
              font-size: 1.6rem;
              color: ${Color.darkerGray()};
              display: flex;
              align-items: center;
            `}
          >
            AI Cards
          </div>
          {selectedCardIds.length ? (
            <SelectedCards
              style={{ marginTop: '1rem' }}
              type="want"
              selectedCardIds={selectedCardIds}
              onDeselect={onDeselect}
              onShowAICardSelector={onShowAICardSelector}
              partnerId={partnerId}
            />
          ) : (
            <Button
              skeuomorphic
              style={{
                fontSize: '3.5rem',
                padding: '1.5rem',
                marginTop: '0.5rem'
              }}
              color={profileTheme}
              onClick={onShowAICardSelector}
            >
              <Icon icon="cards-blank" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  function handleAmountChange(amount) {
    const newAmount = Number(amount.replace(/[^0-9]/g, ''));
    onSetCoinAmount(Math.min(newAmount, 999_999_999));
  }
}

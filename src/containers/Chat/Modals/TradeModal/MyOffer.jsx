import { useState } from 'react';
import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import Input from '~/components/Texts/Input';
import Button from '~/components/Button';
import { css } from '@emotion/css';
import { borderRadius, Color } from '~/constants/css';
import { useKeyContext } from '~/contexts';

MyOffer.propTypes = {
  onShowAICard: PropTypes.func.isRequired,
  selectedOption: PropTypes.string.isRequired,
  style: PropTypes.object
};

export default function MyOffer({ onShowAICard, selectedOption, style }) {
  const { twinkleCoins, profileTheme } = useKeyContext((v) => v.myState);
  const [amount, setAmount] = useState(0);
  return (
    <div
      style={{
        width: '100%',
        ...style
      }}
    >
      <p style={{ fontWeight: 'bold', fontSize: '2rem' }}>
        I{' '}
        {selectedOption === 'want'
          ? 'offer'
          : selectedOption === 'give'
          ? 'want to give'
          : 'have'}
        ...
      </p>
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
            value={amount}
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
          <Button
            skeuomorphic
            style={{
              fontSize: '3.5rem',
              padding: '1.5rem',
              marginTop: '0.5rem'
            }}
            color={profileTheme}
            onClick={onShowAICard}
          >
            <Icon icon="cards-blank" />
          </Button>
        </div>
      </div>
    </div>
  );

  function handleAmountChange(amount) {
    const newAmount = Number(amount.replace(/[^0-9]/g, ''));
    const amounts = [newAmount, twinkleCoins];
    setAmount(Math.min(...amounts));
  }
}

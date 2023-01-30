import { useState } from 'react';
import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import Input from '~/components/Texts/Input';
import { css } from '@emotion/css';
import { borderRadius, Color } from '~/constants/css';

MyWant.propTypes = {
  style: PropTypes.object
};

export default function MyWant({ style }) {
  const [amount, setAmount] = useState(0);
  return (
    <div
      style={{
        width: '100%',
        ...style
      }}
    >
      <p style={{ fontWeight: 'bold' }}>I want...</p>
      <div
        style={{
          marginTop: '0.5rem',
          padding: '1rem',
          border: `1px solid ${Color.borderGray()}`,
          display: 'flex',
          justifyContent: 'center',
          borderRadius
        }}
      >
        <div
          style={{ display: 'flex', flexDirection: 'column', width: 'auto' }}
        >
          <div>
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
          <div style={{ marginTop: '2rem' }}>
            <div
              className={css`
                font-weight: bold;
                font-size: 1.6rem;
                color: ${Color.darkerGray()};
                display: flex;
                align-items: center;
              `}
            >
              Cards
            </div>
            button
          </div>
        </div>
      </div>
    </div>
  );

  function handleAmountChange(amount) {
    const newAmount = Number(amount.replace(/[^0-9]/g, ''));
    setAmount(Math.min(newAmount, 999_999_999));
  }
}

import React, { useMemo, useState } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { priceTable } from '~/constants/defaultValues';
import Icon from '~/components/Icon';
import DonorFundsModal from '~/components/Modals/DonorFundsModal';

export default function ThinkHardToggle({
  thinkHard,
  twinkleCoins,
  communityFundsAvailable,
  onToggle
}: {
  thinkHard: boolean;
  twinkleCoins: number;
  communityFundsAvailable?: boolean;
  onToggle: (value: boolean) => void;
}) {
  const [donorModalShown, setDonorModalShown] = useState(false);

  const insufficientFunds = useMemo(
    () => twinkleCoins < priceTable.thinkHard,
    [twinkleCoins]
  );

  const isDisabled = !thinkHard && insufficientFunds && !communityFundsAvailable;

  return (
    <div
      className={css`
        border-top: 1px solid ${Color.borderGray()};
        padding: 1rem 0;
        width: 100%;
      `}
    >
      <div
        className={css`
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.8rem;
          width: 100%;
        `}
      >
        <div
          className={css`
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
          `}
        >
          <h3
            className={css`
              font-size: 1.4rem;
              color: #333;
              margin: 0;
              font-weight: 600;
              display: flex;
              align-items: center;
              gap: 0.5rem;
            `}
          >
            <Icon icon="lightbulb" />
            Think Hard
          </h3>
          {communityFundsAvailable && (
            <div
              className={css`
                background: linear-gradient(135deg, ${Color.logoBlue()} 0%, ${Color.rose()} 100%);
                border-radius: 1rem;
                padding: 0.2rem 0.5rem;
                font-size: 0.7rem;
                color: white;
                font-weight: bold;
                cursor: pointer;
                transition: transform 0.2s ease;
                display: flex;
                align-items: center;
                gap: 0.3rem;

                &:hover {
                  transform: scale(1.05);
                }
              `}
              onClick={() => setDonorModalShown(true)}
              title="Community sponsored - click for details"
            >
              <Icon icon="heart" style={{ fontSize: '0.7rem' }} />
              SPONSORED
            </div>
          )}
        </div>
        <label
          className={css`
            position: relative;
            display: inline-block;
            width: 54px;
            height: 28px;
            cursor: ${isDisabled ? 'not-allowed' : 'pointer'};
            opacity: ${isDisabled ? 0.6 : 1};
          `}
          title={
            isDisabled
              ? `Not enough coins. You need ${priceTable.thinkHard} coins.`
              : ''
          }
        >
          <input
            type="checkbox"
            checked={thinkHard}
            disabled={isDisabled}
            onChange={(e) => onToggle(e.target.checked)}
            className={css`
              opacity: 0;
              width: 0;
              height: 0;
            `}
          />
          <span
            className={css`
              position: absolute;
              cursor: pointer;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background-color: ${thinkHard ? '#00aa00' : '#ddd'};
              transition: all 0.3s ease;
              border-radius: 28px;
              box-shadow: ${thinkHard
                ? '0 2px 6px rgba(0, 170, 0, 0.3)'
                : '0 2px 4px rgba(0, 0, 0, 0.1)'};

              &:before {
                position: absolute;
                content: '';
                height: 22px;
                width: 22px;
                left: ${thinkHard ? '29px' : '3px'};
                bottom: 3px;
                background-color: white;
                transition: all 0.3s ease;
                border-radius: 50%;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
              }

              &:hover {
                background-color: ${thinkHard ? '#00bb00' : '#ccc'};
              }
            `}
          />
        </label>
        <p
          className={css`
            font-size: 0.8rem;
            color: #666;
            margin: 0;
            text-align: center;
            line-height: 1.3;
            font-weight: normal;
          `}
        >
          {insufficientFunds && !thinkHard && !communityFundsAvailable
            ? `Not enough coins (need ${priceTable.thinkHard})`
            : thinkHard && communityFundsAvailable
            ? 'Enhanced reasoning active (community sponsored)'
            : thinkHard
            ? 'Enhanced reasoning active (500 coins/message)'
            : communityFundsAvailable
            ? 'Enhanced reasoning mode (community sponsored)'
            : 'Enhanced reasoning mode (500 coins/message)'}
        </p>
      </div>
      {donorModalShown && (
        <DonorFundsModal onHide={() => setDonorModalShown(false)} />
      )}
    </div>
  );
}

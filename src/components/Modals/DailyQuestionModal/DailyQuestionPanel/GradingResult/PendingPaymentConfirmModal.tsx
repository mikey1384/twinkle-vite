import React from 'react';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

interface Props {
  label: string;
  price: number;
  availableTwinkleCoins: number;
  onHide: () => void;
  onConfirm: () => void;
}

export default function PendingPaymentConfirmModal({
  label,
  price,
  availableTwinkleCoins,
  onHide,
  onConfirm
}: Props) {
  return (
    <ConfirmModal
      title="Confirm coin payment"
      onHide={onHide}
      onConfirm={onConfirm}
      confirmButtonColor="orange"
      confirmButtonLabel="Confirm and Continue"
      description={
        <div
          className={css`
            font-size: 1.3rem;
            line-height: 1.65;
            text-align: left;
            color: ${Color.black()};
          `}
        >
          <p style={{ marginTop: 0 }}>
            This will set <strong>{label}</strong> and costs{' '}
            <strong>{price.toLocaleString()} coins</strong>.
          </p>
          <p style={{ marginBottom: 0 }}>
            Your current balance: {availableTwinkleCoins.toLocaleString()} coins
          </p>
        </div>
      }
    />
  );
}

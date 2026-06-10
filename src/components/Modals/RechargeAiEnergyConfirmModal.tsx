import React from 'react';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import { addCommasToNumber } from '~/helpers/stringHelpers';

export default function RechargeAiEnergyConfirmModal({
  cost,
  loading = false,
  modalLevel,
  onHide,
  onConfirm
}: {
  cost: number;
  loading?: boolean;
  modalLevel?: number;
  onHide: () => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmModal
      modalOverModal
      modalLevel={modalLevel}
      title="Recharge AI Energy"
      description={
        <div style={{ textAlign: 'center', lineHeight: 1.45 }}>
          Spend <b>{addCommasToNumber(cost)} Twinkle Coins</b> to recharge one
          full AI Energy battery?
        </div>
      }
      descriptionFontSize="1.35rem"
      confirmButtonColor="orange"
      confirmButtonLabel="Recharge"
      disabled={loading}
      onHide={onHide}
      onConfirm={onConfirm}
    />
  );
}

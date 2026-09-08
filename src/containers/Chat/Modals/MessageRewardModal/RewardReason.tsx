import React from 'react';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import { rewardReasons } from '~/constants/defaultValues';

export default function RewardReason({
  selectedReasonId,
  reasonId,
  onSelectReasonId,
  disabled = false,
  style
}: {
  selectedReasonId: number;
  reasonId: number;
  onSelectReasonId: (v: number) => void;
  disabled?: boolean;
  style: React.CSSProperties;
}) {
  const reason = rewardReasons[reasonId];
  if (!reason) return null;

  return (
    <Button
      aria-pressed={reasonId === selectedReasonId}
      disabled={disabled}
      color={reason.color}
      onClick={() => {
        if (!disabled) onSelectReasonId(reasonId);
      }}
      variant={reasonId === selectedReasonId ? 'solid' : 'soft'}
      tone="raised"
      style={style}
    >
      <Icon size="lg" icon={reason.icon} />
      <span style={{ marginLeft: '1rem' }}>{reason.message}</span>
    </Button>
  );
}

import React from 'react';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import { Color } from '~/constants/css';
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
      variant={reasonId === selectedReasonId ? 'soft' : 'ghost'}
      uppercase={false}
      style={{ ...style, border: 0, color: '#334155', fontFamily: 'inherit', fontWeight: 500 }}
    >
      <Icon size="lg" icon={reason.icon} style={{ color: Color[reason.color]() }} />
      <span style={{ marginLeft: '1rem' }}>{reason.message}</span>
    </Button>
  );
}

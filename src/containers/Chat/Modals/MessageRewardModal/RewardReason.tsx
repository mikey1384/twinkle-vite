import React from 'react';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import { rewardReasons } from '~/constants/defaultValues';

export default function RewardReason({
  selectedReasonId,
  reasonId,
  onSelectReasonId,
  style
}: {
  selectedReasonId: number;
  reasonId: number;
  onSelectReasonId: (v: number) => void;
  style: React.CSSProperties;
}) {
  return (
    <Button
      color={rewardReasons[reasonId].color}
      onClick={() => onSelectReasonId(reasonId)}
      filled={reasonId === selectedReasonId}
      style={style}
    >
      <Icon size="lg" icon={rewardReasons[reasonId].icon} />
      <span style={{ marginLeft: '1rem' }}>
        {rewardReasons[reasonId].message}
      </span>
    </Button>
  );
}

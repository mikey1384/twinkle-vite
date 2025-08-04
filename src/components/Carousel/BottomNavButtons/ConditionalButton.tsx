import React from 'react';
import Button from '~/components/Button';

export default function ConditionalButton({
  conditionPassStatus,
  onCheckNavCondition,
  nextButtonDisabled
}: {
  conditionPassStatus?: string;
  onCheckNavCondition: () => void;
  nextButtonDisabled?: boolean;
}) {
  return conditionPassStatus === 'fail' ? null : (
    <Button
      disabled={nextButtonDisabled}
      filled
      color={conditionPassStatus ? 'green' : 'logoBlue'}
      onClick={onCheckNavCondition}
    >
      {conditionPassStatus ? 'Continue' : 'Check'}
    </Button>
  );
}

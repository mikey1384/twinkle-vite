import React from 'react';
import PropTypes from 'prop-types';
import Button from '~/components/Button';

ConditionalButton.propTypes = {
  conditionPassStatus: PropTypes.string,
  onCheckNavCondition: PropTypes.func.isRequired,
  nextButtonDisabled: PropTypes.bool
};
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

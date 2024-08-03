import React from 'react';
import { Color } from '~/constants/css';
import Button from '~/components/Button';

export default function Submitted({
  status,
  value,
  onTryAgain
}: {
  status: string | null;
  value: string | null;
  onTryAgain: () => void;
}) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      {status === 'pending' && (
        <div>
          <p>Your submission has been received</p>
          <p>Please wait for verification</p>
        </div>
      )}
      {status === 'approved' && (
        <div>
          <p>
            Your submission has been{' '}
            <span style={{ color: Color.limeGreen() }}>verified</span>
          </p>
        </div>
      )}
      {status === 'rejected' && (
        <div>
          <p>
            Your submission was{' '}
            <span style={{ color: Color.redOrange() }}>rejected</span>
          </p>
          <p>{value}</p>
          <div style={{ marginTop: '1rem' }}>
            <Button filled color="logoBlue" onClick={onTryAgain}>
              Try again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

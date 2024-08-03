import React from 'react';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
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
    <div
      className={css`
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
      `}
    >
      <div
        className={css`
          font-size: 1.6rem;
          font-weight: bold;
          margin-bottom: 1rem;
          text-align: center;
          color: ${Color.darkerGray()};
          p {
            margin-bottom: 0.5rem;
          }
        `}
      >
        {renderStatusView()}
      </div>
    </div>
  );

  function renderStatusView() {
    switch (status) {
      case 'pending':
        return (
          <div>
            <p>Your submission has been received</p>
            <p>Please wait for verification</p>
          </div>
        );
      case 'approved':
        return (
          <div>
            <p>
              Your submission has been{' '}
              <span style={{ color: Color.limeGreen() }}>verified</span>
            </p>
          </div>
        );
      case 'rejected':
        return (
          <div>
            <p>
              Your submission was{' '}
              <span style={{ color: Color.redOrange() }}>rejected</span>
            </p>
            <p>{value}</p>
            <div
              style={{
                marginTop: '2rem',
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <Button filled color="logoBlue" onClick={onTryAgain}>
                Try again
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  }
}

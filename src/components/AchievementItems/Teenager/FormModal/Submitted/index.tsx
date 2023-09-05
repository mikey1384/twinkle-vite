import React, { useMemo } from 'react';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';

export default function Submitted({
  status,
  dob
}: {
  status: string | null;
  dob: string | null;
}) {
  const renderStatusView = useMemo(() => {
    switch (status) {
      case 'pending':
        return (
          <div>
            <p>Your birthdate has been submitted</p>
            <p>Please wait for verification</p>
          </div>
        );
      case 'approved':
        return (
          <div>
            <p>Your birthdate has been verified</p>
          </div>
        );
      case 'rejected':
        return (
          <div>
            <p>Your birthdate could not be verified</p>
            <p>{dob}</p>
            <p>{`You've been rejected`}</p>
          </div>
        );
      default:
        return null;
    }
  }, [dob, status]);

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
        {renderStatusView}
      </div>
    </div>
  );
}

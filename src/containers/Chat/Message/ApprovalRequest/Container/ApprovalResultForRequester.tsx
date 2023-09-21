import React, { useMemo } from 'react';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';

export default function ApprovalResultForRequester({
  status,
  style
}: {
  status: string | null;
  style?: React.CSSProperties;
}) {
  const renderStatusView = useMemo(() => {
    switch (status) {
      case 'approved':
        return (
          <div>
            <p>
              Your birthdate has been{' '}
              <span style={{ color: Color.limeGreen() }}>verified</span>
            </p>
          </div>
        );
      case 'rejected':
        return (
          <div>
            <p>
              Your birthdate submission was{' '}
              <span style={{ color: Color.redOrange() }}>rejected</span>
            </p>
          </div>
        );
      default:
        return null;
    }
  }, [status]);

  return (
    <div
      className={css`
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
      `}
      style={style}
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

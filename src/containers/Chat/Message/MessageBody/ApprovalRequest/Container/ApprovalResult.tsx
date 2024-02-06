import React, { useState } from 'react';
import { css } from '@emotion/css';
import { Color, borderRadius } from '~/constants/css';
import { useAppContext, useManagementContext } from '~/contexts';
import Icon from '~/components/Icon';

export default function ApprovalResult({
  status,
  userId,
  onSetStatus,
  type
}: {
  status: string;
  userId: number;
  onSetStatus: (status: string) => void;
  type: string;
}) {
  const revertApproval = useAppContext((v) => v.requestHelpers.revertApproval);
  const onApproveRequest = useManagementContext(
    (v) => v.actions.onApproveRequest
  );
  const [reverting, setReverting] = useState(false);

  return (
    <div>
      <div
        style={{
          marginTop: '2.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          borderRadius,
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
          background:
            Color[status === 'approved' ? 'limeGreen' : 'redOrange'](),
          color: '#fff',
          fontWeight: 'bold'
        }}
      >
        <Icon
          icon={status === 'approved' ? 'check' : 'times'}
          style={{ marginRight: '0.7rem' }}
        />
        {status.toUpperCase()}
      </div>
      <div
        className={css`
          margin-top: 1rem;
          font-size: 1.3rem;
          color: ${reverting ? Color.lightGray() : Color.darkerGray()};
          display: flex;
          justify-content: center;
          align-items: center;
        `}
      >
        <Icon icon="undo" style={{ marginRight: '0.5rem' }} />
        <span
          onClick={handleRevert}
          className={css`
            cursor: ${reverting ? 'default' : 'pointer'};
            ${reverting ? '' : '&:hover { text-decoration: underline; }'}
          `}
        >
          revert
        </span>
      </div>
    </div>
  );

  async function handleRevert() {
    setReverting(true);
    const status = await revertApproval({ userId, type });
    onSetStatus(status);
    onApproveRequest({ userId, status, requestType: type });
    setReverting(false);
  }
}

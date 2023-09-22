import React, { useState } from 'react';
import Button from '~/components/Button';
import Modal from '~/components/Modal';
import Icon from '~/components/Icon';
import Dob from './Dob';
import Mentor from './Mentor';
import { useAppContext, useManagementContext } from '~/contexts';
import { borderRadius, Color } from '~/constants/css';
import { css } from '@emotion/css';

export default function ApproveModal({
  target,
  onSetApprovalModalTarget,
  onHide
}: {
  target: {
    userId: number;
    username: string;
    content: string;
    status: string;
    type: string;
  };
  onSetApprovalModalTarget: (target: any) => void;
  onHide: () => void;
}) {
  const [reverting, setReverting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const approveRequest = useAppContext((v) => v.requestHelpers.approveRequest);
  const revertApproval = useAppContext((v) => v.requestHelpers.revertApproval);
  const onApproveRequest = useManagementContext(
    (v) => v.actions.onApproveRequest
  );

  return (
    <Modal onHide={onHide}>
      <header>Approve Request</header>
      <main>
        <div
          style={{
            width: '100%',
            marginTop: '1rem',
            lineHeight: 1.7,
            textAlign: 'center'
          }}
        >
          {target.type === 'dob' && (
            <Dob username={target.username} content={target.content} />
          )}
          {target.type === 'mentor' && <Mentor content={target.content} />}
        </div>
        {target.status === 'pending' ? (
          <div
            style={{
              marginTop: '3rem',
              width: '100%',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <Button
              color="rose"
              filled
              disabled={submitting}
              loading={submitting && !isApproved}
              onClick={() =>
                handleSubmit({
                  isApproved: false,
                  userId: target.userId
                })
              }
            >
              Reject
            </Button>
            <Button
              style={{ marginLeft: '1.5rem' }}
              filled
              color="green"
              disabled={submitting}
              loading={submitting && isApproved}
              onClick={() =>
                handleSubmit({
                  isApproved: true,
                  userId: target.userId
                })
              }
            >
              Approve
            </Button>
          </div>
        ) : (
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
                  Color[
                    target.status === 'approved' ? 'limeGreen' : 'redOrange'
                  ](),
                color: '#fff',
                fontWeight: 'bold'
              }}
            >
              <Icon
                icon={target.status === 'approved' ? 'check' : 'times'}
                style={{ marginRight: '0.7rem' }}
              />
              {target.status.toUpperCase()}
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
        )}
      </main>
      <footer>
        <Button transparent onClick={onHide} style={{ marginRight: '0.7rem' }}>
          Close
        </Button>
      </footer>
    </Modal>
  );

  async function handleRevert() {
    setReverting(true);
    const status = await revertApproval({
      userId: target.userId,
      type: target.type
    });
    onApproveRequest({
      userId: target.userId,
      status,
      requestType: target.type
    });
    onSetApprovalModalTarget({
      ...target,
      status
    });
    setReverting(false);
  }

  async function handleSubmit({
    isApproved,
    userId
  }: {
    isApproved: boolean;
    userId: number;
  }) {
    setSubmitting(true);
    setIsApproved(isApproved);
    const data: {
      dob?: string;
    } = {};
    if (target.type === 'dob') data.dob = target.content;
    const status = await approveRequest({
      isApproved,
      type: target.type,
      userId,
      data
    });
    onApproveRequest({ userId, status, requestType: target.type });
    onSetApprovalModalTarget({
      ...target,
      status
    });
    setSubmitting(false);
  }
}

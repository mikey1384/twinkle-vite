import React, { useState } from 'react';
import Button from '~/components/Button';
import Modal from '~/components/Modal';
import Icon from '~/components/Icon';
import { useAppContext, useManagementContext } from '~/contexts';
import { borderRadius, Color } from '~/constants/css';
import { getAge } from '~/helpers';
import { css } from '@emotion/css';

export default function ApproveDobModal({
  target,
  onSetApprovalModalTarget,
  onHide
}: {
  target: {
    userId: number;
    username: string;
    content: string;
    status: string;
  };
  onSetApprovalModalTarget: (target: any) => void;
  onHide: () => void;
}) {
  const [reverting, setReverting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const approveDob = useAppContext((v) => v.requestHelpers.approveDob);
  const revertDobApproval = useAppContext(
    (v) => v.requestHelpers.revertDobApproval
  );
  const onApproveDob = useManagementContext((v) => v.actions.onApproveDob);

  return (
    <Modal onHide={onHide}>
      <header>Approve Date of Birth</header>
      <main>
        <div
          style={{
            marginTop: '1rem',
            fontWeight: 'bold',
            fontSize: '2rem',
            color: Color.logoBlue()
          }}
        >
          {target.username}
        </div>
        <div
          style={{ marginTop: '1.5rem', textAlign: 'center', lineHeight: 1.7 }}
        >
          <p
            style={{
              color: Color.black(),
              fontWeight: 'bold',
              fontSize: '1.6rem'
            }}
          >
            {target.content}
          </p>
          <p style={{ fontSize: '1.2rem', color: Color.darkerGray() }}>
            ({getAge(target.content)} years old)
          </p>
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
    const status = await revertDobApproval(target.userId);
    onApproveDob({ userId: target.userId, status });
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
    const status = await approveDob({
      isApproved,
      userId,
      dob: target.content
    });
    onApproveDob({ userId, status });
    onSetApprovalModalTarget({
      ...target,
      status
    });
    setSubmitting(false);
  }
}

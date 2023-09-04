import React, { useState } from 'react';
import Button from '~/components/Button';
import Modal from '~/components/Modal';
import { useAppContext, useManagementContext } from '~/contexts';
import { Color } from '~/constants/css';

export default function ApproveDobModal({
  target,
  onHide
}: {
  target: {
    userId: number;
    username: string;
    content: string;
  };
  onHide: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const approveDob = useAppContext((v) => v.requestHelpers.approveDob);
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
      </main>
      <footer>
        <Button transparent onClick={onHide} style={{ marginRight: '0.7rem' }}>
          Close
        </Button>
      </footer>
    </Modal>
  );

  function getAge(dateString: string) {
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
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
    const status = await approveDob({ isApproved, userId });
    console.log(status);
    onApproveDob({ userId, status });
    onHide();
  }
}

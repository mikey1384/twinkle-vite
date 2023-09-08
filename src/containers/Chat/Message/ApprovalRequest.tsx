import React, { useState } from 'react';
import Button from '~/components/Button';
import { useAppContext, useManagementContext } from '~/contexts';
import { Color, liftedEffect } from '~/constants/css';
import { getAge } from '~/helpers';

export default function ApprovalRequest({
  requestId,
  userId,
  username
}: {
  requestId: number;
  userId: number;
  username: string;
}) {
  const content = '1984-01-03';
  const approveDob = useAppContext((v) => v.requestHelpers.approveDob);
  const onApproveDob = useManagementContext((v) => v.actions.onApproveDob);
  const [submitting, setSubmitting] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  return (
    <div
      style={{
        width: '100%',
        padding: '2rem 1rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        marginTop: '3rem',
        marginBottom: '3rem',
        backgroundColor: '#f9f9f9',
        ...liftedEffect
      }}
    >
      <div
        style={{
          marginTop: '1rem',
          fontWeight: 'bold',
          fontSize: '2rem',
          color: Color.logoBlue()
        }}
      >
        {username} {requestId}
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
          {content}
        </p>
        <p style={{ fontSize: '1.2rem', color: Color.darkerGray() }}>
          ({getAge(content)} years old)
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
              userId
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
              userId
            })
          }
        >
          Approve
        </Button>
      </div>
    </div>
  );

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
      dob: content
    });
    onApproveDob({ userId, status });
    setSubmitting(false);
  }
}

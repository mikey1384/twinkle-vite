import React, { useState } from 'react';
import { css } from '@emotion/css';
import { Color, liftedBoxShadow, wideBorderRadius } from '~/constants/css';
import { getAge } from '~/helpers';
import { useAppContext, useManagementContext } from '~/contexts';
import ApprovalButtons from './ApprovalButtons';

export default function Details({
  username,
  requestId,
  content,
  userId,
  myId
}: {
  username: string;
  requestId: number;
  content: string;
  userId: number;
  myId: number;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const approveDob = useAppContext((v) => v.requestHelpers.approveDob);
  const onApproveDob = useManagementContext((v) => v.actions.onApproveDob);

  return (
    <div
      className={css`
        border-radius: ${wideBorderRadius};
        box-shadow: ${liftedBoxShadow};
        background: ${Color.whiteGray()};
        &:hover {
          background: ${Color.highlightGray()};
        }
      `}
      style={{
        width: '100%',
        padding: '2rem 0',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        marginTop: '1.5rem',
        marginBottom: '3rem'
      }}
    >
      <div
        style={{
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
      <ApprovalButtons
        submitting={submitting}
        isApproved={isApproved}
        onSubmit={handleSubmit}
        userId={userId}
        myId={myId}
      />
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
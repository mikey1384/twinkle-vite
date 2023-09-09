import React, { useState } from 'react';
import ApprovalButtons from './ApprovalButtons';
import { css } from '@emotion/css';
import { useAppContext, useKeyContext, useManagementContext } from '~/contexts';
import {
  borderRadius,
  Color,
  liftedBoxShadow,
  wideBorderRadius
} from '~/constants/css';
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
  const { userId: myId } = useKeyContext((v) => v.myState);
  const approveDob = useAppContext((v) => v.requestHelpers.approveDob);
  const onApproveDob = useManagementContext((v) => v.actions.onApproveDob);
  const [submitting, setSubmitting] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  return (
    <div
      style={{
        width: '100%',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <div style={{ borderRadius, color: Color.darkGray() }}>
        {userId === myId ? 'requested approval' : 'requests your approval'}
      </div>
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

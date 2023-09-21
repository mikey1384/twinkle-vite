import React, { useState } from 'react';
import { css } from '@emotion/css';
import {
  Color,
  liftedBoxShadow,
  liftedBoxShadowDarker,
  wideBorderRadius
} from '~/constants/css';
import { useAppContext, useManagementContext } from '~/contexts';
import ApprovalButtons from './ApprovalButtons';
import ApprovalResult from './ApprovalResult';
import ApprovalResultForRequester from './ApprovalResultForRequester';
import Details from './Details';

export default function Container({
  username,
  content,
  userId,
  myId,
  status,
  type,
  onSetStatus
}: {
  username: string;
  content: string;
  userId: number;
  myId: number;
  status: string;
  type: string;
  onSetStatus: (status: string) => void;
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
          box-shadow: ${liftedBoxShadowDarker};
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
        {username}
      </div>
      <Details content={content} type={type} />
      {userId === myId && status !== 'pending' && (
        <ApprovalResultForRequester
          style={{ marginTop: '1.5rem' }}
          status={status}
        />
      )}
      {userId !== myId && (
        <>
          {status === 'pending' ? (
            <ApprovalButtons
              submitting={submitting}
              isApproved={isApproved}
              onSubmit={handleSubmit}
              userId={userId}
            />
          ) : (
            <ApprovalResult
              status={status}
              userId={userId}
              onSetStatus={onSetStatus}
            />
          )}
        </>
      )}
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
    onSetStatus(status);
    onApproveDob({ userId, status });
    setSubmitting(false);
  }
}

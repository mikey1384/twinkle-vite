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
  displayedThemeColor,
  messageId,
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
  displayedThemeColor: string;
  messageId: number;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const approveRequest = useAppContext((v) => v.requestHelpers.approveRequest);
  const onApproveRequest = useManagementContext(
    (v) => v.actions.onApproveRequest
  );

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
      <Details
        content={content}
        type={type}
        messageId={messageId}
        displayedThemeColor={displayedThemeColor}
      />
      {userId === myId && status !== 'pending' && (
        <ApprovalResultForRequester
          style={{ marginTop: '1.5rem' }}
          status={status}
          type={type}
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
              type={type}
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
    const data: {
      dob?: string;
    } = {};
    if (type === 'dob') data.dob = content;
    const status = await approveRequest({
      isApproved,
      type,
      userId,
      data
    });
    onSetStatus(status);
    onApproveRequest({ userId, status, requestType: type });
    setSubmitting(false);
  }
}

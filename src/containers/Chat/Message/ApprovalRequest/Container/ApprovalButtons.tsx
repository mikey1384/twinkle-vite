import React from 'react';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';

export default function ApprovalButtons({
  userId,
  submitting,
  isApproved,
  onSubmit
}: {
  userId: number;
  submitting: boolean;
  isApproved: boolean;
  onSubmit: (args: { isApproved: boolean; userId: number }) => Promise<void>;
}) {
  return (
    <ErrorBoundary componentPath="Chat/Message/ApprovalRequest/ApprovalButtons">
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
            onSubmit({
              isApproved: false,
              userId
            })
          }
        >
          Reject
        </Button>
        <Button
          style={{ marginLeft: '1.5rem' }}
          color="green"
          filled
          disabled={submitting}
          loading={submitting && isApproved}
          onClick={() =>
            onSubmit({
              isApproved: true,
              userId
            })
          }
        >
          Approve
        </Button>
      </div>
    </ErrorBoundary>
  );
}

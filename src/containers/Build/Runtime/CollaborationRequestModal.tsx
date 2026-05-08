import React from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import Modal from '~/components/Modal';
import Textarea from '~/components/Texts/Textarea';
import { Color } from '~/constants/css';
import type { BuildCollaborationRequest } from './types';

const footerClass = css`
  display: flex;
  justify-content: flex-end;
  gap: 0.65rem;
  flex-wrap: wrap;
`;

const bodyClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  width: 100%;
`;

const pendingStatusClass = css`
  color: ${Color.darkGray()};
  font-weight: 800;
  line-height: 1.4;
`;

const invitedStatusClass = css`
  color: ${Color.logoBlue()};
  font-weight: 800;
  line-height: 1.4;
`;

const requestPromptClass = css`
  color: ${Color.darkGray()};
  font-weight: 700;
  line-height: 1.45;
`;

const hiddenRequestClass = css`
  color: ${Color.darkGray(0.7)};
  font-size: 1.1rem;
  font-weight: 700;
`;

const errorClass = css`
  color: #be123c;
  font-weight: 800;
`;

export default function CollaborationRequestModal({
  buildId,
  error,
  loading,
  message,
  request,
  onAcceptInvite,
  onCancelRequest,
  onClose,
  onDeclineInvite,
  onMessageChange,
  onOpenWorkspace,
  onSubmitRequest
}: {
  buildId: number;
  error: string;
  loading: boolean;
  message: string;
  request: BuildCollaborationRequest | null;
  onAcceptInvite: () => void;
  onCancelRequest: () => void;
  onClose: () => void;
  onDeclineInvite: () => void;
  onMessageChange: (message: string) => void;
  onOpenWorkspace: () => void;
  onSubmitRequest: () => void;
}) {
  const pending = request?.status === 'pending';
  const accepted = request?.status === 'accepted';
  const invited = request?.status === 'invited';
  return (
    <Modal
      modalKey={`BuildRuntimeCollaborationRequestModal-${buildId}`}
      isOpen
      onClose={loading ? () => {} : onClose}
      closeOnBackdropClick={!loading}
      title="Ask to join"
      size="sm"
      footer={
        <div className={footerClass}>
          <Button variant="ghost" disabled={loading} onClick={onClose}>
            Close
          </Button>
          {pending ? (
            <Button
              color="darkerGray"
              variant="outline"
              loading={loading}
              disabled={loading}
              onClick={onCancelRequest}
            >
              Cancel request
            </Button>
          ) : invited ? (
            <>
              <Button
                color="darkerGray"
                variant="outline"
                loading={loading}
                disabled={loading}
                onClick={onDeclineInvite}
              >
                Decline
              </Button>
              <Button
                color="logoBlue"
                loading={loading}
                disabled={loading}
                onClick={onAcceptInvite}
              >
                Join team
              </Button>
            </>
          ) : accepted ? (
            <Button
              color="logoBlue"
              loading={loading}
              disabled={loading}
              onClick={onOpenWorkspace}
            >
              Open workspace
            </Button>
          ) : (
            <Button
              color="pink"
              loading={loading}
              disabled={loading}
              onClick={onSubmitRequest}
            >
              Send join request
            </Button>
          )}
        </div>
      }
    >
      <div className={bodyClass}>
        {pending ? (
          <div className={pendingStatusClass}>
            Your request has been sent. The owner can accept or decline it.
          </div>
        ) : invited ? (
          <div className={invitedStatusClass}>
            The owner invited you to join the team for this Build.
          </div>
        ) : accepted ? (
          <div className={invitedStatusClass}>
            You&apos;re on the team. Open the workspace to start a branch.
          </div>
        ) : (
          <div className={requestPromptClass}>
            Ask the owner if you can join the team.
          </div>
        )}
        {!accepted && !invited ? (
          <Textarea
            value={message}
            onChange={(event) => onMessageChange(event.target.value)}
            disabled={pending || loading}
            maxLength={1000}
            minRows={4}
            maxRows={8}
            placeholder="Optional message"
          />
        ) : null}
        {request?.ownerHidden ? (
          <div className={hiddenRequestClass}>
            This request is saved in the owner&apos;s hidden request list.
          </div>
        ) : null}
        {error ? <div className={errorClass}>{error}</div> : null}
      </div>
    </Modal>
  );
}

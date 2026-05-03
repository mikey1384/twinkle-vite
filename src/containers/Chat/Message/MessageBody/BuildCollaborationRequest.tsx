import React, { useEffect, useMemo, useState } from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { Color, borderRadius } from '~/constants/css';
import { useAppContext } from '~/contexts';

interface BuildCollaborationRequestPayload {
  type?: string;
  buildId?: number;
  requestId?: number;
  title?: string;
  message?: string;
  status?: BuildCollaborationRequestStatus;
  respondedAt?: number;
  canceledAt?: number;
  ownerHidden?: number;
}

type BuildCollaborationRequestStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'canceled';

export default function BuildCollaborationRequest({
  content,
  request,
  myId,
  sender
}: {
  content: string;
  request?: BuildCollaborationRequestPayload | null;
  myId: number;
  sender: {
    id: number;
    username: string;
  };
}) {
  const navigate = useNavigate();
  const acceptBuildCollaborationRequest = useAppContext(
    (v) => v.requestHelpers.acceptBuildCollaborationRequest
  );
  const rejectBuildCollaborationRequest = useAppContext(
    (v) => v.requestHelpers.rejectBuildCollaborationRequest
  );
  const payload = useMemo(
    () => request || parseBuildCollaborationRequestPayload(content),
    [content, request]
  );
  const buildId = Number(payload?.buildId || 0);
  const requestId = Number(payload?.requestId || 0);
  const title = String(payload?.title || 'Build');
  const requestMessage = String(payload?.message || '').trim();
  const payloadStatus = getBuildCollaborationRequestStatus(payload);
  const [status, setStatus] =
    useState<BuildCollaborationRequestStatus>(payloadStatus);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');
  const sentByMe = Number(sender.id) === Number(myId);

  useEffect(() => {
    setStatus(payloadStatus);
  }, [payloadStatus, requestId]);

  if (!buildId || !requestId) {
    return <span>{content}</span>;
  }

  return (
    <div className={requestCardClass}>
      <div className={requestHeaderClass}>
        <Icon icon="users" />
        <strong>Build collaboration request</strong>
      </div>
      <div className={requestBodyClass}>
        {sentByMe ? (
          <span>
            {status === 'accepted'
              ? 'Your request was accepted for '
              : status === 'rejected'
                ? 'Your request was declined for '
                : status === 'canceled'
                  ? 'You canceled your request for '
                  : 'You asked to collaborate on '}
            <strong>{title}</strong>.
          </span>
        ) : status === 'accepted' ? (
          <span>
            You accepted {sender.username}&apos;s request for{' '}
            <strong>{title}</strong>.
          </span>
        ) : status === 'rejected' ? (
          <span>
            You declined {sender.username}&apos;s request for{' '}
            <strong>{title}</strong>.
          </span>
        ) : status === 'canceled' ? (
          <span>
            {sender.username} canceled the request for <strong>{title}</strong>.
          </span>
        ) : (
          <span>
            {sender.username} wants to collaborate on{' '}
            <strong>{title}</strong>.
          </span>
        )}
      </div>
      {requestMessage ? (
        <div className={requestMessageClass}>{requestMessage}</div>
      ) : null}
      {error ? <div className={errorClass}>{error}</div> : null}
      <div className={actionsClass}>
        <Button
          color="darkerGray"
          variant="outline"
          size="sm"
          onClick={handleOpenBuild}
        >
          Open Build
        </Button>
        {!sentByMe && status === 'pending' ? (
          <>
            <Button
              color="darkerGray"
              variant="outline"
              size="sm"
              loading={loading === 'reject'}
              disabled={Boolean(loading)}
              onClick={handleReject}
            >
              Decline
            </Button>
            <Button
              color="logoBlue"
              variant="soft"
              size="sm"
              loading={loading === 'accept'}
              disabled={Boolean(loading)}
              onClick={handleAccept}
            >
              Accept
            </Button>
          </>
        ) : null}
        {status === 'accepted' ? (
          <Button
            color="green"
            variant="soft"
            size="sm"
            disabled={Boolean(loading)}
            onClick={handleOpenWorkspace}
          >
            Open Workspace
          </Button>
        ) : null}
      </div>
    </div>
  );

  async function handleAccept() {
    if (loading) return;
    setLoading('accept');
    setError('');
    try {
      const result = await acceptBuildCollaborationRequest({
        buildId,
        requestId
      });
      if (result?.success) {
        setStatus(
          result?.request
            ? getBuildCollaborationRequestStatus(result.request)
            : 'accepted'
        );
      }
    } catch (error: any) {
      setError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to accept request'
      );
    } finally {
      setLoading('');
    }
  }

  async function handleReject() {
    if (loading) return;
    setLoading('reject');
    setError('');
    try {
      const result = await rejectBuildCollaborationRequest({
        buildId,
        requestId
      });
      if (result?.success) {
        setStatus(
          result?.request
            ? getBuildCollaborationRequestStatus(result.request)
            : 'rejected'
        );
      }
    } catch (error: any) {
      setError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to decline request'
      );
    } finally {
      setLoading('');
    }
  }

  function handleOpenBuild() {
    navigate(`/build/${buildId}`);
  }

  function handleOpenWorkspace() {
    navigate(`/build/${buildId}`, {
      state: {
        openVersionsPanel: true
      }
    });
  }
}

function parseBuildCollaborationRequestPayload(
  content: string
): BuildCollaborationRequestPayload | null {
  try {
    const parsed = JSON.parse(String(content || ''));
    return parsed;
  } catch {
    return null;
  }
}

function getBuildCollaborationRequestStatus(
  request?: BuildCollaborationRequestPayload | null
): BuildCollaborationRequestStatus {
  const status = String(request?.status || '').trim();
  if (
    status === 'accepted' ||
    status === 'rejected' ||
    status === 'canceled'
  ) {
    return status;
  }
  if (Number(request?.canceledAt || 0) > 0) {
    return 'canceled';
  }
  return 'pending';
}

const requestCardClass = css`
  border: 1px solid ${Color.logoBlue(0.45)};
  border-radius: ${borderRadius};
  padding: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  background: ${Color.logoBlue(0.06)};
  max-width: 30rem;
`;

const requestHeaderClass = css`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: ${Color.black()};
`;

const requestBodyClass = css`
  color: ${Color.darkGray()};
  line-height: 1.4;
`;

const requestMessageClass = css`
  border-left: 3px solid ${Color.logoBlue(0.5)};
  padding-left: 0.65rem;
  color: ${Color.black()};
  line-height: 1.4;
  white-space: pre-wrap;
`;

const actionsClass = css`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
`;

const errorClass = css`
  color: #be123c;
  font-weight: 800;
`;

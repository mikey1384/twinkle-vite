import React, { useMemo, useState } from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { Color, borderRadius } from '~/constants/css';
import { useAppContext } from '~/contexts';

interface BuildContributionInvitePayload {
  type?: string;
  buildId?: number;
  inviteId?: number;
  title?: string;
}

export default function BuildContributionInvite({
  content,
  invite,
  myId,
  sender
}: {
  content: string;
  invite?: BuildContributionInvitePayload | null;
  myId: number;
  sender: {
    id: number;
    username: string;
  };
}) {
  const navigate = useNavigate();
  const acceptBuildContributorInvite = useAppContext(
    (v) => v.requestHelpers.acceptBuildContributorInvite
  );
  const declineBuildContributorInvite = useAppContext(
    (v) => v.requestHelpers.declineBuildContributorInvite
  );
  const [status, setStatus] = useState<'pending' | 'accepted' | 'declined'>(
    'pending'
  );
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');
  const payload = useMemo(
    () => invite || parseBuildInvitePayload(content),
    [content, invite]
  );
  const buildId = Number(payload?.buildId || 0);
  const inviteId = Number(payload?.inviteId || 0);
  const title = String(payload?.title || 'Build');
  const sentByMe = Number(sender.id) === Number(myId);

  if (!buildId || !inviteId) {
    return <span>{content}</span>;
  }

  return (
    <div className={inviteCardClass}>
      <div className={inviteHeaderClass}>
        <Icon icon="code-branch" />
        <strong>Build collaboration invite</strong>
      </div>
      <div className={inviteBodyClass}>
        {sentByMe ? (
          <span>
            You invited this user to collaborate on <strong>{title}</strong>.
          </span>
        ) : status === 'accepted' ? (
          <span>
            You accepted {sender.username}&apos;s invite for{' '}
            <strong>{title}</strong>.
          </span>
        ) : status === 'declined' ? (
          <span>
            You declined {sender.username}&apos;s invite for{' '}
            <strong>{title}</strong>.
          </span>
        ) : (
          <span>
            {sender.username} invited you to collaborate on{' '}
            <strong>{title}</strong>.
          </span>
        )}
      </div>
      {error ? <div className={errorClass}>{error}</div> : null}
      <div className={actionsClass}>
        <Button
          color="darkerGray"
          variant="outline"
          size="sm"
          onClick={() =>
            navigate(`/build/${buildId}`, {
              state: {
                openVersionsPanel: true
              }
            })
          }
        >
          Open Build
        </Button>
        {!sentByMe && status === 'pending' ? (
          <>
            <Button
              color="darkerGray"
              variant="outline"
              size="sm"
              loading={loading === 'decline'}
              disabled={Boolean(loading)}
              onClick={handleDecline}
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
        {!sentByMe && status === 'accepted' ? (
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
      const result = await acceptBuildContributorInvite({
        buildId,
        inviteId
      });
      if (result?.success) {
        setStatus('accepted');
        handleOpenWorkspace();
      }
    } catch (error: any) {
      setError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to accept invite'
      );
    } finally {
      setLoading('');
    }
  }

  async function handleDecline() {
    if (loading) return;
    setLoading('decline');
    setError('');
    try {
      const result = await declineBuildContributorInvite({
        buildId,
        inviteId
      });
      if (result?.success) {
        setStatus('declined');
      }
    } catch (error: any) {
      setError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to decline invite'
      );
    } finally {
      setLoading('');
    }
  }

  function handleOpenWorkspace() {
    navigate(`/build/${buildId}`, {
      state: {
        openVersionsPanel: true
      }
    });
  }
}

function parseBuildInvitePayload(
  content: string
): BuildContributionInvitePayload | null {
  try {
    const parsed = JSON.parse(String(content || ''));
    return parsed;
  } catch {
    return null;
  }
}

const inviteCardClass = css`
  border: 1px solid ${Color.pink(0.55)};
  border-radius: ${borderRadius};
  padding: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  background: ${Color.pink(0.06)};
  max-width: 30rem;
`;

const inviteHeaderClass = css`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: ${Color.black()};
`;

const inviteBodyClass = css`
  color: ${Color.darkGray()};
  line-height: 1.4;
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
  font-size: 0.9rem;
`;

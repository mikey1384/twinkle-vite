import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { Color, borderRadius } from '~/constants/css';
import { useAppContext, useChatContext } from '~/contexts';

interface BuildContributionInvitePayload {
  type?: string;
  buildId?: number;
  inviteId?: number;
  userId?: number;
  invitedByUserId?: number;
  title?: string;
  status?: BuildContributionInviteStatus;
  acceptedAt?: number;
  declinedAt?: number;
  revokedAt?: number;
}

type BuildContributionInviteStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'revoked';

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
  const onUpdateBuildCollaborationState = useChatContext(
    (v) => v.actions.onUpdateBuildCollaborationState
  );
  const payload = useMemo(
    () => invite || parseBuildInvitePayload(content),
    [content, invite]
  );
  const buildId = Number(payload?.buildId || 0);
  const inviteId = Number(payload?.inviteId || 0);
  const title = String(payload?.title || 'Build');
  const sentByMe = Number(sender.id) === Number(myId);
  const membershipKey =
    buildId > 0 && Number(payload?.userId || 0) > 0
      ? `${buildId}:${Number(payload?.userId || 0)}`
      : '';
  const cachedInviteById = useChatContext((v) =>
    inviteId > 0 ? v.state.buildContributionInvitesById?.[inviteId] : null
  );
  const cachedInviteByMembership = useChatContext((v) =>
    membershipKey
      ? v.state.buildContributionInviteMembershipByKey?.[membershipKey]
      : null
  );
  const canonicalInvite = cachedInviteById || cachedInviteByMembership || null;
  const status = getBuildInviteStatus(canonicalInvite || payload);
  const hasCanonicalInviteState = Boolean(canonicalInvite || invite);

  if (!buildId || !inviteId) {
    return <span>{content}</span>;
  }

  return (
    <div className={inviteCardClass}>
      <div className={inviteHeaderClass}>
        <Icon icon="code-branch" />
        <strong>Build team invite</strong>
      </div>
      <div className={inviteBodyClass}>
        {sentByMe ? (
          <span>
            {status === 'accepted'
              ? 'This invite was accepted for '
              : status === 'declined'
                ? 'This invite was declined for '
                : status === 'revoked'
                  ? 'This invite was revoked for '
                  : 'You invited this user to join the team for '}
            <strong>{title}</strong>.
          </span>
        ) : status === 'accepted' ? (
          <span>
            You are on the team for{' '}
            <strong>{title}</strong>.
          </span>
        ) : status === 'declined' ? (
          <span>
            You declined {sender.username}&apos;s invite for{' '}
            <strong>{title}</strong>.
          </span>
        ) : status === 'revoked' ? (
          <span>
            {sender.username}&apos;s invite for <strong>{title}</strong> was
            revoked.
          </span>
        ) : (
          <span>
            {sender.username} invited you to join the team for{' '}
            <strong>{title}</strong>.
          </span>
        )}
      </div>
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
        {!sentByMe && hasCanonicalInviteState && status === 'pending' ? (
          <>
            <Button
              color="logoBlue"
              variant="soft"
              size="sm"
              onClick={handleAccept}
            >
              Accept
            </Button>
            <Button
              color="darkerGray"
              variant="outline"
              size="sm"
              onClick={handleDecline}
            >
              Decline
            </Button>
          </>
        ) : null}
        {!sentByMe && status === 'accepted' ? (
          <Button
            color="green"
            variant="soft"
            size="sm"
            onClick={handleOpenWorkspace}
          >
            Open Workspace
          </Button>
        ) : null}
      </div>
    </div>
  );

  async function handleAccept() {
    try {
      const result = await acceptBuildContributorInvite({
        buildId,
        inviteId
      });
      if (result?.success) {
        onUpdateBuildCollaborationState({
          invite: result.invite,
          inviteId,
          inviteStatus: 'accepted',
          request: result.request,
          requestId: Number(result.request?.id || 0),
          requestStatus: 'accepted',
          eventTimeMs: Number(result.eventTimeMs || Date.now()),
          timeStamp: Math.floor(Date.now() / 1000)
        });
        handleOpenWorkspace();
      }
    } catch (error: any) {
      if (applyBuildInviteActionState(error)) return;
      console.error('Failed to accept build invite:', error);
    }
  }

  async function handleDecline() {
    try {
      const result = await declineBuildContributorInvite({
        buildId,
        inviteId
      });
      if (result?.success) {
        onUpdateBuildCollaborationState({
          invite: result.invite,
          inviteId,
          inviteStatus: 'declined',
          eventTimeMs: Number(result.eventTimeMs || Date.now()),
          timeStamp: Math.floor(Date.now() / 1000)
        });
      }
    } catch (error: any) {
      if (applyBuildInviteActionState(error)) return;
      console.error('Failed to decline build invite:', error);
    }
  }

  function applyBuildInviteActionState(error: any) {
    const nextInvite = error?.invite || error?.responseData?.invite || null;
    const nextRequest = error?.request || error?.responseData?.request || null;
    const eventTimeMs = Number(
      error?.eventTimeMs || error?.responseData?.eventTimeMs || Date.now()
    );
    if (!nextInvite && !nextRequest) return false;
    onUpdateBuildCollaborationState({
      invite: nextInvite,
      inviteId: Number(nextInvite?.id || inviteId || 0),
      inviteStatus: nextInvite
        ? getBuildInviteStatus(nextInvite as BuildContributionInvitePayload)
        : undefined,
      request: nextRequest,
      requestId: Number(nextRequest?.id || 0),
      requestStatus: nextRequest
        ? getBuildRequestStatusFromActionState(nextRequest)
        : undefined,
      eventTimeMs,
      timeStamp: Math.floor(Date.now() / 1000)
    });
    return true;
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

function getBuildInviteStatus(
  invite?: BuildContributionInvitePayload | null
): BuildContributionInviteStatus {
  const status = invite?.status;
  if (
    status === 'accepted' ||
    status === 'declined' ||
    status === 'revoked'
  ) {
    return status;
  }
  if (Number(invite?.revokedAt || 0) > 0) {
    return 'revoked';
  }
  if (Number(invite?.declinedAt || 0) > 0) {
    return 'declined';
  }
  if (Number(invite?.acceptedAt || 0) > 0) {
    return 'accepted';
  }
  return 'pending';
}

function getBuildRequestStatusFromActionState(
  request: Record<string, any>
): 'pending' | 'invited' | 'accepted' | 'rejected' | 'canceled' {
  const status = String(request?.status || '').trim();
  if (
    status === 'invited' ||
    status === 'accepted' ||
    status === 'rejected' ||
    status === 'canceled'
  ) {
    return status;
  }
  if (Number(request?.canceledAt || 0) > 0) return 'canceled';
  return 'pending';
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

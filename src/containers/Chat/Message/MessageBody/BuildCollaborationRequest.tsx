import React, { useEffect, useMemo } from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { Color, borderRadius } from '~/constants/css';
import { useAppContext, useChatContext } from '~/contexts';

interface BuildCollaborationRequestPayload {
  type?: string;
  buildId?: number;
  requestId?: number;
  requesterUserId?: number;
  ownerUserId?: number;
  title?: string;
  message?: string;
  status?: BuildCollaborationRequestStatus;
  respondedAt?: number;
  canceledAt?: number;
  ownerHidden?: number;
}

type BuildCollaborationRequestStatus =
  | 'pending'
  | 'invited'
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
  const loadBuildContributionMembership = useAppContext(
    (v) => v.requestHelpers.loadBuildContributionMembership
  );
  const onUpdateBuildCollaborationState = useChatContext(
    (v) => v.actions.onUpdateBuildCollaborationState
  );
  const onUpdateBuildContributionMembership = useChatContext(
    (v) => v.actions.onUpdateBuildContributionMembership
  );
  const payload = useMemo(
    () => request || parseBuildCollaborationRequestPayload(content),
    [content, request]
  );
  const buildId = Number(payload?.buildId || 0);
  const requestId = Number(payload?.requestId || 0);
  const title = String(payload?.title || 'Build');
  const requestMessage = String(payload?.message || '').trim();
  const sentByMe = Number(sender.id) === Number(myId);
  const membershipUserId = Number(payload?.requesterUserId || sender.id || 0);
  const membershipKey =
    buildId > 0 && membershipUserId > 0 ? `${buildId}:${membershipUserId}` : '';
  const membershipState = useChatContext((v) =>
    membershipKey ? v.state.buildContributionMembershipByKey?.[membershipKey] : null
  );
  const cachedRequestById = useChatContext((v) =>
    requestId > 0 ? v.state.buildCollaborationRequestsById?.[requestId] : null
  );
  const cachedRequestByMembership = useChatContext((v) =>
    !requestId && membershipKey
      ? v.state.buildCollaborationRequestMembershipByKey?.[membershipKey]
      : null
  );
  const canonicalRequest = getNewestBuildRequestState(
    cachedRequestById,
    cachedRequestByMembership,
    request
  );
  const isActiveMember = Boolean(membershipState?.active);
  const membershipLoaded = !membershipKey || Boolean(membershipState);
  const rowStatus = getBuildCollaborationRequestRowStatus(
    canonicalRequest || payload
  );
  const status = isActiveMember ? 'accepted' : rowStatus;

  useEffect(() => {
    if (!buildId || !membershipUserId || membershipState) return;
    let isMounted = true;
    loadMembership();

    async function loadMembership() {
      try {
        const result = await loadBuildContributionMembership({
          buildId,
          userId: membershipUserId
        });
        if (!isMounted) return;
        onUpdateBuildContributionMembership({
          active: Boolean(result?.active),
          buildId,
          eventTimeMs: result?.eventTimeMs,
          membership: result?.membership,
          userId: membershipUserId
        });
      } catch (error) {
        console.error('Failed to load build contribution membership:', error);
      }
    }

    return () => {
      isMounted = false;
    };
    // Context request/action helpers are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildId, membershipUserId, Boolean(membershipState)]);

  if (!buildId || !requestId) {
    return <span>{content}</span>;
  }

  return (
    <div className={requestCardClass}>
      <div className={requestHeaderClass}>
        <Icon icon="users" />
        <strong>Build join request</strong>
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
                  : 'You asked to join '}
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
            {sender.username} asked to join{' '}
            <strong>{title}</strong>.
          </span>
        )}
      </div>
      {requestMessage ? (
        <div className={requestMessageClass}>{requestMessage}</div>
      ) : null}
      <div className={actionsClass}>
        <Button
          color="darkerGray"
          variant="outline"
          size="sm"
          onClick={handleOpenBuild}
        >
          Open Build
        </Button>
        {!sentByMe && membershipLoaded && status === 'pending' ? (
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
              onClick={handleReject}
            >
              Decline
            </Button>
          </>
        ) : null}
        {status === 'accepted' ? (
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
      const result = await acceptBuildCollaborationRequest({
        buildId,
        requestId
      });
      if (result?.success) {
        onUpdateBuildCollaborationState({
          invite: result.invite,
          inviteId: Number(result.invite?.id || 0),
          inviteStatus: 'accepted',
          request: result.request,
          requestId,
          requestStatus: 'accepted',
          eventTimeMs: Number(result.eventTimeMs || Date.now()),
          timeStamp: Math.floor(Date.now() / 1000)
        });
      }
    } catch (error: any) {
      if (applyBuildRequestActionState(error)) return;
      console.error('Failed to accept build join request:', error);
    }
  }

  async function handleReject() {
    try {
      const result = await rejectBuildCollaborationRequest({
        buildId,
        requestId
      });
      if (result?.success) {
        onUpdateBuildCollaborationState({
          request: result.request,
          requestId,
          requestStatus: 'rejected',
          eventTimeMs: Number(result.eventTimeMs || Date.now()),
          timeStamp: Math.floor(Date.now() / 1000)
        });
      }
    } catch (error: any) {
      if (applyBuildRequestActionState(error)) return;
      console.error('Failed to decline build join request:', error);
    }
  }

  function applyBuildRequestActionState(error: any) {
    const nextInvite = error?.invite || error?.responseData?.invite || null;
    const nextRequest = error?.request || error?.responseData?.request || null;
    const eventTimeMs = Number(
      error?.eventTimeMs || error?.responseData?.eventTimeMs || Date.now()
    );
    if (!nextInvite && !nextRequest) return false;
    onUpdateBuildCollaborationState({
      invite: nextInvite,
      inviteId: Number(nextInvite?.id || 0),
      inviteStatus: nextInvite
        ? getBuildInviteStatusFromActionState(nextInvite)
        : undefined,
      request: nextRequest,
      requestId: Number(nextRequest?.id || requestId || 0),
      requestStatus: nextRequest
        ? getBuildCollaborationRequestStatus(
            nextRequest as BuildCollaborationRequestPayload
          )
        : undefined,
      eventTimeMs,
      timeStamp: Math.floor(Date.now() / 1000)
    });
    return true;
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
    status === 'invited' ||
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

function getBuildCollaborationRequestRowStatus(
  request?: BuildCollaborationRequestPayload | null
): BuildCollaborationRequestStatus {
  const status = String(request?.status || '').trim();
  if (status === 'rejected' || status === 'canceled' || status === 'invited') {
    return status;
  }
  if (Number(request?.canceledAt || 0) > 0) {
    return 'canceled';
  }
  return 'pending';
}

function normalizeEventTimeMs(value?: number) {
  const normalizedValue = Number(value || 0);
  if (!normalizedValue) return 0;
  return normalizedValue > 1000000000000
    ? normalizedValue
    : normalizedValue * 1000;
}

function getBuildRequestEventTime(request?: Record<string, any> | null) {
  if (!request) return 0;
  return Math.max(
    normalizeEventTimeMs(Number(request.__eventTime || 0)),
    normalizeEventTimeMs(Number(request.respondedAt || 0)),
    normalizeEventTimeMs(Number(request.canceledAt || 0)),
    normalizeEventTimeMs(Number(request.hiddenAt || 0)),
    normalizeEventTimeMs(Number(request.updatedAt || 0)),
    normalizeEventTimeMs(Number(request.createdAt || 0))
  );
}

function getBuildRequestStatusRank(status: BuildCollaborationRequestStatus) {
  if (status === 'accepted') return 3;
  if (status === 'rejected' || status === 'canceled') return 2;
  if (status === 'invited') return 1;
  return 0;
}

function getNewestBuildRequestState(
  ...states: Array<Record<string, any> | null | undefined>
) {
  return states.reduce<Record<string, any> | null>((current, next) => {
    if (!next) return current;
    if (!current) return next;
    const nextTime = getBuildRequestEventTime(next);
    const currentTime = getBuildRequestEventTime(current);
    if (nextTime !== currentTime) {
      return nextTime > currentTime ? next : current;
    }
    return getBuildRequestStatusRank(getBuildCollaborationRequestStatus(next)) >=
      getBuildRequestStatusRank(getBuildCollaborationRequestStatus(current))
      ? next
      : current;
  }, null);
}

function getBuildInviteStatusFromActionState(
  invite: Record<string, any>
): 'pending' | 'accepted' | 'declined' | 'revoked' {
  const status = String(invite?.status || '').trim();
  if (status === 'accepted' || status === 'declined' || status === 'revoked') {
    return status;
  }
  if (Number(invite?.revokedAt || 0) > 0) return 'revoked';
  if (Number(invite?.declinedAt || 0) > 0) return 'declined';
  if (Number(invite?.acceptedAt || 0) > 0) return 'accepted';
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

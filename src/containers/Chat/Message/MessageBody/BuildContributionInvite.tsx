import React, { useEffect, useMemo } from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import BuildMessageCard, { BuildMessageCardChip } from './BuildMessageCard';
import { Color } from '~/constants/css';
import { useAppContext, useBuildContext, useChatContext } from '~/contexts';

interface BuildContributionInvitePayload {
  type?: string;
  buildId?: number;
  inviteId?: number;
  userId?: number;
  username?: string;
  invitedByUserId?: number;
  title?: string;
  isPublic?: boolean | number;
  publishedArtifactVersionId?: number | null;
  releaseStatus?: BuildPublishedAppReleaseStatus | null;
  status?: BuildContributionInviteStatus;
  acceptedAt?: number;
  declinedAt?: number;
  revokedAt?: number;
  leftAt?: number;
}

interface BuildPublishedAppReleaseStatus {
  state?: string;
  hasPublishedVersion?: boolean;
}

type BuildContributionInviteStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'revoked'
  | 'left';

export default function BuildContributionInvite({
  channelId,
  content,
  invite,
  myId,
  sender
}: {
  channelId: number;
  content: string;
  invite?: BuildContributionInvitePayload | null;
  myId: number;
  sender: {
    id: number;
    username: string;
    profileTheme?: string | null;
  };
}) {
  const navigate = useNavigate();
  const acceptBuildContributorInvite = useAppContext(
    (v) => v.requestHelpers.acceptBuildContributorInvite
  );
  const declineBuildContributorInvite = useAppContext(
    (v) => v.requestHelpers.declineBuildContributorInvite
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
  const onInvalidateBuildStudioBrowseTab = useBuildContext(
    (v) => v.actions.onInvalidateBuildStudioBrowseTab
  );
  const payload = useMemo(
    () => invite || parseBuildInvitePayload(content),
    [content, invite]
  );
  const buildId = Number(payload?.buildId || 0);
  const inviteId = Number(payload?.inviteId || 0);
  const title = String(payload?.title || 'Build');
  const sentByMe = Number(sender.id) === Number(myId);
  // Who the invite is about, named. The invite row is the authority, but these
  // cards only ever live in the direct message between the two people, so when
  // the row has not been read the person on the other side of this very channel
  // IS the invitee — no lookup, no "this person" in a conversation whose title
  // is their name. The two forms below differ only in where the last-resort
  // fallback lands: start of a sentence, or the middle of one.
  const partnerUsername = useChatContext((v) =>
    channelId > 0 ? v.state.channelsObj?.[channelId]?.partnerUsername : ''
  );
  const invitedName =
    String(payload?.username || '').trim() ||
    (sentByMe ? String(partnerUsername || '').trim() : '');
  const invitedLabel = invitedName || 'This person';
  const invitedObjectLabel = invitedName || 'this person';
  const membershipUserId = Number(
    payload?.userId || (!sentByMe ? myId : 0) || 0
  );
  const membershipKey =
    buildId > 0 && membershipUserId > 0
      ? `${buildId}:${membershipUserId}`
      : '';
  const membershipState = useChatContext((v) =>
    membershipKey ? v.state.buildContributionMembershipByKey?.[membershipKey] : null
  );
  const cachedInviteById = useChatContext((v) =>
    inviteId > 0 ? v.state.buildContributionInvitesById?.[inviteId] : null
  );
  const cachedInviteByMembership = useChatContext((v) =>
    membershipKey
      ? v.state.buildContributionInviteMembershipByKey?.[membershipKey]
      : null
  );
  const canonicalInvite = getNewestBuildInviteState(
    cachedInviteById,
    cachedInviteByMembership,
    invite
  );
  const isActiveMember = Boolean(membershipState?.active);
  const membershipLoaded = !membershipKey || Boolean(membershipState);
  const rowStatus = getBuildInviteRowStatus(canonicalInvite || payload);
  const rowStatusIsClosed =
    rowStatus === 'left' ||
    rowStatus === 'revoked' ||
    rowStatus === 'declined';
  const inviteEventTime = getBuildInviteEventTime(canonicalInvite || payload);
  const membershipEventTime = Number(membershipState?.__eventTime || 0);
  const membershipIsCurrent =
    isActiveMember && membershipEventTime >= inviteEventTime;
  const inviteAccepted =
    Number((canonicalInvite || payload)?.acceptedAt || 0) > 0;
  const inviteAcceptedIsCurrent =
    inviteAccepted &&
    (!membershipLoaded || inviteEventTime > membershipEventTime);
  const membershipShowsLeft =
    membershipLoaded &&
    Boolean(membershipState) &&
    !isActiveMember &&
    inviteAccepted &&
    membershipEventTime >= inviteEventTime;
  const status = membershipIsCurrent
    ? 'accepted'
    : rowStatusIsClosed
      ? rowStatus
      : membershipShowsLeft
        ? 'left'
        : inviteAcceptedIsCurrent
          ? 'accepted'
          : 'pending';
  const canOpenApp = canOpenPublishedBuildApp(payload);
  const canOpenWorkspaceFromTitle = sentByMe || status === 'accepted';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildId, membershipUserId, Boolean(membershipState)]);

  useEffect(() => {
    if (!membershipKey || !isActiveMember || membershipIsCurrent) {
      return;
    }
    if (!rowStatusIsClosed && inviteAccepted) {
      return;
    }
    onUpdateBuildContributionMembership({
      active: false,
      buildId,
      eventTimeMs: inviteEventTime,
      membership: canonicalInvite || payload,
      userId: membershipUserId
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    membershipKey,
    isActiveMember,
    membershipIsCurrent,
    rowStatusIsClosed,
    inviteAccepted,
    inviteEventTime,
    buildId,
    membershipUserId
  ]);

  if (!buildId || !inviteId) {
    return <span>{content}</span>;
  }

  return (
    <BuildMessageCard
      themeName={sender.profileTheme}
      bannerIcon="user-plus"
      bannerText={
        sentByMe
          ? invitedName
            ? <>Invited {invitedName} to your team</>
            : 'Team invitation sent'
          : 'Team invitation'
      }
      title={title}
      chips={
        <BuildMessageCardChip
          muted={status !== 'pending' && status !== 'accepted'}
          themeName={sender.profileTheme}
          icon={status === 'accepted' ? 'check' : 'code-branch'}
        >
          {getInviteChipLabel(status)}
        </BuildMessageCardChip>
      }
      actions={
        <>
          {canOpenApp ? (
            <GameCTAButton
              variant="neutral"
              size="md"
              icon="external-link-alt"
              onClick={handleOpenApp}
            >
              Open App
            </GameCTAButton>
          ) : null}
          {!sentByMe && membershipLoaded && status === 'pending' ? (
            <>
              <GameCTAButton
                variant="success"
                size="md"
                icon="check"
                shiny
                onClick={handleAccept}
              >
                Accept
              </GameCTAButton>
              <GameCTAButton variant="neutral" size="md" onClick={handleDecline}>
                Decline
              </GameCTAButton>
            </>
          ) : null}
          {canOpenWorkspaceFromTitle ? (
            <GameCTAButton
              variant="logoBlue"
              size="md"
              icon="code-branch"
              onClick={handleOpenWorkspace}
            >
              Open Workspace
            </GameCTAButton>
          ) : null}
        </>
      }
    >
      <div className={inviteBodyClass}>
        {sentByMe ? (
          status === 'accepted' ? (
            <>{invitedLabel} accepted and is on the team.</>
          ) : status === 'declined' ? (
            <>{invitedLabel} declined this invite.</>
          ) : status === 'revoked' ? (
            <>{invitedLabel}&apos;s invite was revoked.</>
          ) : status === 'left' ? (
            <>{invitedLabel} left the team.</>
          ) : (
            <>You invited {invitedObjectLabel} to join the team.</>
          )
        ) : status === 'accepted' ? (
          "You're on the team."
        ) : status === 'declined' ? (
          <>You declined {sender.username}&apos;s invite.</>
        ) : status === 'revoked' ? (
          <>{sender.username}&apos;s invite was revoked.</>
        ) : status === 'left' ? (
          'You left the team.'
        ) : (
          <>{sender.username} invited you to help build this project.</>
        )}
      </div>
    </BuildMessageCard>
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
        invalidateBuildStudioCollaboratingBuilds();
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
        invalidateBuildStudioCollaboratingBuilds();
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
    invalidateBuildStudioCollaboratingBuilds();
    return true;
  }

  function handleOpenWorkspace() {
    navigate(`/build/${buildId}`, {
      state: {
        openVersionsPanel: true
      }
    });
  }

  function invalidateBuildStudioCollaboratingBuilds() {
    onInvalidateBuildStudioBrowseTab({ tab: 'collaborating' });
  }

  function handleOpenApp() {
    navigate(`/app/${buildId}`);
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

function canOpenPublishedBuildApp(
  build?: BuildContributionInvitePayload | null
) {
  if (!build || Number(build.isPublic || 0) !== 1) return false;
  if (Number(build.publishedArtifactVersionId || 0) <= 0) return false;
  if (!build.releaseStatus) return true;
  return (
    build.releaseStatus.state !== 'missing_snapshot' &&
    Boolean(build.releaseStatus.hasPublishedVersion)
  );
}

function getBuildInviteStatus(
  invite?: BuildContributionInvitePayload | null
): BuildContributionInviteStatus {
  const status = invite?.status;
  if (
    status === 'accepted' ||
    status === 'declined' ||
    status === 'revoked' ||
    status === 'left'
  ) {
    return status;
  }
  if (Number(invite?.revokedAt || 0) > 0) {
    return 'revoked';
  }
  if (Number(invite?.declinedAt || 0) > 0) {
    return 'declined';
  }
  if (Number(invite?.leftAt || 0) > 0) {
    return 'left';
  }
  if (Number(invite?.acceptedAt || 0) > 0) {
    return 'accepted';
  }
  return 'pending';
}

function getBuildInviteRowStatus(
  invite?: BuildContributionInvitePayload | null
): BuildContributionInviteStatus {
  if (Number(invite?.revokedAt || 0) > 0 || invite?.status === 'revoked') {
    return 'revoked';
  }
  if (Number(invite?.declinedAt || 0) > 0 || invite?.status === 'declined') {
    return 'declined';
  }
  if (Number(invite?.leftAt || 0) > 0 || invite?.status === 'left') {
    return 'left';
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

function getBuildInviteEventTime(invite?: Record<string, any> | null) {
  if (!invite) return 0;
  return Math.max(
    normalizeEventTimeMs(Number(invite.__eventTime || 0)),
    normalizeEventTimeMs(Number(invite.eventTimeMs || 0)),
    normalizeEventTimeMs(Number(invite.acceptedAt || 0)),
    normalizeEventTimeMs(Number(invite.declinedAt || 0)),
    normalizeEventTimeMs(Number(invite.revokedAt || 0)),
    normalizeEventTimeMs(Number(invite.leftAt || 0)),
    normalizeEventTimeMs(Number(invite.createdAt || 0))
  );
}

function getBuildInviteStatusRank(status: BuildContributionInviteStatus) {
  if (status === 'accepted') return 3;
  if (status === 'declined' || status === 'left') return 2;
  if (status === 'revoked') return 1;
  return 0;
}

function getNewestBuildInviteState(
  ...states: Array<Record<string, any> | null | undefined>
) {
  return states.reduce<Record<string, any> | null>((current, next) => {
    if (!next) return current;
    if (!current) return next;
    const nextTime = getBuildInviteEventTime(next);
    const currentTime = getBuildInviteEventTime(current);
    if (nextTime !== currentTime) {
      return nextTime > currentTime ? next : current;
    }
    return getBuildInviteStatusRank(getBuildInviteStatus(next)) >=
      getBuildInviteStatusRank(getBuildInviteStatus(current))
      ? next
      : current;
  }, null);
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



const inviteBodyClass = css`
  color: ${Color.darkerGray()};
  line-height: 1.45;
  font-size: 1.3rem;
  font-weight: 700;
`;

function getInviteChipLabel(status: BuildContributionInviteStatus) {
  if (status === 'accepted') return 'On the team';
  if (status === 'declined') return 'Declined';
  if (status === 'revoked') return 'Revoked';
  if (status === 'left') return 'Left the team';
  return 'Invitation pending';
}


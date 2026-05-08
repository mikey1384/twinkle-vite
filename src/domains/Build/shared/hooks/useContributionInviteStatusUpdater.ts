import { useChatContext, useNotiContext } from '~/contexts';

type BuildContributionInviteStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'revoked';

export function useContributionInviteStatusUpdater() {
  const onUpdateBuildCollaborationState = useChatContext(
    (v) => v.actions.onUpdateBuildCollaborationState
  );
  const onUpdateBuildContributionInviteNotification = useNotiContext(
    (v) => v.actions.onUpdateBuildContributionInviteNotification
  );

  function updateBuildContributionInviteStatus({
    invite,
    inviteId,
    eventTimeMs,
    status
  }: {
    invite?: Record<string, any> | null;
    inviteId: number;
    eventTimeMs?: number;
    status?: BuildContributionInviteStatus;
  }) {
    onUpdateBuildContributionInviteNotification({
      invite,
      inviteId,
      status
    });
    onUpdateBuildCollaborationState({
      invite,
      inviteId,
      inviteStatus: status,
      eventTimeMs: Number(eventTimeMs || Date.now())
    });
  }

  return updateBuildContributionInviteStatus;
}

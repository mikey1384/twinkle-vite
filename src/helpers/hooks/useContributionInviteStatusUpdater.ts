import { useBuildContext, useChatContext, useNotiContext } from '~/contexts';

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
  const onInvalidateBuildStudioBrowseTab = useBuildContext(
    (v) => v.actions.onInvalidateBuildStudioBrowseTab
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
    onInvalidateBuildStudioBrowseTab({ tab: 'collaborating' });
  }

  return updateBuildContributionInviteStatus;
}

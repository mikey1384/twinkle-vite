import { useBuildContext, useChatContext, useNotiContext } from '~/contexts';

type BuildContributionInviteStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'revoked'
  | 'left';

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
    const resolvedEventTimeMs = Number(eventTimeMs || Date.now());
    onUpdateBuildContributionInviteNotification({
      invite,
      inviteId,
      status,
      eventTimeMs: resolvedEventTimeMs
    });
    onUpdateBuildCollaborationState({
      invite,
      inviteId,
      inviteStatus: status,
      eventTimeMs: resolvedEventTimeMs
    });
    onInvalidateBuildStudioBrowseTab({ tab: 'collaborating' });
  }

  return updateBuildContributionInviteStatus;
}

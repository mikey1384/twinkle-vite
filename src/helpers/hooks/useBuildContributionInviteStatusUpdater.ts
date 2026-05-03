import { useChatContext, useNotiContext } from '~/contexts';

type BuildContributionInviteStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'revoked';

export function useBuildContributionInviteStatusUpdater() {
  const onUpdateBuildContributionInviteMessages = useChatContext(
    (v) => v.actions.onUpdateBuildContributionInviteMessages
  );
  const onUpdateBuildContributionInviteNotification = useNotiContext(
    (v) => v.actions.onUpdateBuildContributionInviteNotification
  );

  function updateBuildContributionInviteStatus({
    invite,
    inviteId,
    status
  }: {
    invite?: Record<string, any> | null;
    inviteId: number;
    status?: BuildContributionInviteStatus;
  }) {
    onUpdateBuildContributionInviteNotification({
      invite,
      inviteId,
      status
    });
    onUpdateBuildContributionInviteMessages({
      invite,
      inviteId,
      status
    });
  }

  return updateBuildContributionInviteStatus;
}

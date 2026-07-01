import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '~/contexts';
import { useContributionInviteStatusUpdater } from '~/helpers/hooks/useContributionInviteStatusUpdater';
import { isBuildContributionFork } from '~/helpers/buildRelationshipHelpers';

// Single source of truth for a team member leaving a build's team. Surfaced
// only from the workspace Settings menu (intentional friction) — see Header.
export function useBuildTeamLeave({
  build,
  userId
}: {
  build: any;
  userId?: number | null;
}) {
  const navigate = useNavigate();
  const leaveBuildTeam = useAppContext((v) => v.requestHelpers.leaveBuildTeam);
  const loadBuildContributionMembership = useAppContext(
    (v) => v.requestHelpers.loadBuildContributionMembership
  );
  const applyContributionInviteStatus = useContributionInviteStatusUpdater();

  const isContributionFork = isBuildContributionFork(build);
  const rootBuildId = isContributionFork
    ? Number(build.contributionRootBuildId || 0)
    : Number(build.id || 0);
  const isRootOwner = Number(build.rootBuildUserId || 0) === Number(userId || 0);
  const isOwnTeamBranch =
    isContributionFork &&
    rootBuildId > 0 &&
    Number(build.rootBuildUserId || 0) > 0 &&
    !isRootOwner &&
    Number(build.contributionContributorId || 0) === Number(userId || 0);

  const [canLeaveTeam, setCanLeaveTeam] = useState(false);
  const [leaveConfirmShown, setLeaveConfirmShown] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState('');

  useEffect(() => {
    let canceled = false;
    if (!isOwnTeamBranch) {
      setCanLeaveTeam(false);
      return;
    }
    (async () => {
      try {
        const result = await loadBuildContributionMembership({
          buildId: rootBuildId,
          userId: Number(userId || 0)
        });
        if (!canceled) setCanLeaveTeam(Boolean(result?.active));
      } catch {
        if (!canceled) setCanLeaveTeam(false);
      }
    })();
    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwnTeamBranch, rootBuildId, userId]);

  return {
    canLeaveTeam,
    leaveConfirmShown,
    leaving,
    leaveError,
    openLeaveConfirm,
    closeLeaveConfirm,
    handleLeaveTeam
  };

  function openLeaveConfirm() {
    setLeaveError('');
    setLeaveConfirmShown(true);
  }

  function closeLeaveConfirm() {
    if (leaving) return;
    setLeaveConfirmShown(false);
  }

  async function handleLeaveTeam() {
    if (leaving) return;
    setLeaving(true);
    setLeaveError('');
    try {
      const result = await leaveBuildTeam({ buildId: rootBuildId });
      if (result?.success) {
        const count = Number(result.transferredBranchCount || 0);
        const message =
          count > 0
            ? `You left the team. ${count} ${
                count === 1 ? 'branch was' : 'branches were'
              } transferred to the owner.`
            : 'You left the team.';
        setLeaveConfirmShown(false);
        applyContributionInviteStatus({
          invite: {
            id: Number(result.inviteId || 0),
            buildId: rootBuildId,
            userId: Number(userId || 0),
            acceptedAt: 0,
            declinedAt: 0,
            revokedAt: 0,
            leftAt: Number(result.leftAt || 0)
          },
          inviteId: Number(result.inviteId || 0),
          status: 'left',
          eventTimeMs: Number(result.eventTimeMs || Date.now())
        });
        navigate('/build', { state: { buildTeamLeaveMessage: message } });
        return;
      }
      setLeaveError('Failed to leave the team. Please try again.');
      setLeaving(false);
    } catch (error: any) {
      setLeaveError(
        error?.responseData?.error ||
          error?.message ||
          'Failed to leave the team. Please try again.'
      );
      setLeaving(false);
    }
  }
}

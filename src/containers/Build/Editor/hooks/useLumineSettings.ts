import { useEffect, useState } from 'react';
import type { BuildLumineChatVisibility } from '../ChatPanel/types';
import { normalizeLumineChatVisibility } from '../helpers/branches';
import type { Build } from '../types';

interface UseBuildEditorLumineSettingsOptions {
  applyBuildUpdate: (build: Build) => void;
  build: Build;
  currentBuildIsContributionFork: boolean;
  getLatestBuild: () => Build;
  isOwner: boolean;
  loadBuildContributors: (buildId: number) => Promise<any>;
  updateBuildLumineChatVisibility: (
    options: Record<string, any>
  ) => Promise<any>;
}

export default function useLumineSettings({
  applyBuildUpdate,
  build,
  currentBuildIsContributionFork,
  getLatestBuild,
  isOwner,
  loadBuildContributors,
  updateBuildLumineChatVisibility
}: UseBuildEditorLumineSettingsOptions) {
  const [lumineChatVisibility, setLumineChatVisibility] =
    useState<BuildLumineChatVisibility>(() =>
      normalizeLumineChatVisibility(build.lumineChatVisibility)
    );
  const [savingLumineChatVisibility, setSavingLumineChatVisibility] =
    useState(false);
  const [lumineChatVisibilityError, setLumineChatVisibilityError] =
    useState('');
  const [acceptedContributorCount, setAcceptedContributorCount] = useState(0);
  const [teamNoticeDismissedBuildId, setTeamNoticeDismissedBuildId] =
    useState(() => (readTeamNoticeDismissed(build.id) ? Number(build.id) : 0));

  useEffect(() => {
    setLumineChatVisibility(
      normalizeLumineChatVisibility(build.lumineChatVisibility)
    );
    setLumineChatVisibilityError('');
  }, [build.id, build.lumineChatVisibility]);

  useEffect(() => {
    let canceled = false;

    async function reloadAcceptedContributorCount() {
      if (!isOwner || currentBuildIsContributionFork) {
        setAcceptedContributorCount(0);
        return;
      }
      try {
        const result = await loadBuildContributors(Number(build.id));
        if (canceled) return;
        const contributors = Array.isArray(result?.contributors)
          ? result.contributors
          : [];
        setAcceptedContributorCount(
          contributors.filter(
            (contributor: { acceptedAt?: number | null }) =>
              Number(contributor?.acceptedAt || 0) > 0
          ).length
        );
      } catch (error) {
        if (!canceled) {
          setAcceptedContributorCount(0);
        }
        console.error('Failed to load accepted build contributors:', error);
      }
    }

    void reloadAcceptedContributorCount();

    return () => {
      canceled = true;
    };
    // request helpers are stable context helpers; do not include them in deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build.id, currentBuildIsContributionFork, isOwner]);

  async function handleSaveLumineChatVisibility(
    nextVisibility: BuildLumineChatVisibility
  ) {
    const latestBuild = getLatestBuild();
    const normalizedNextVisibility =
      normalizeLumineChatVisibility(nextVisibility);
    const savedVisibility = normalizeLumineChatVisibility(
      latestBuild.lumineChatVisibility
    );
    if (
      !isOwner ||
      savingLumineChatVisibility ||
      (normalizedNextVisibility === savedVisibility &&
        Number(latestBuild.lumineChatVisibilitySetAt || 0) > 0)
    ) {
      return true;
    }
    setSavingLumineChatVisibility(true);
    setLumineChatVisibilityError('');
    try {
      const result = await updateBuildLumineChatVisibility({
        buildId: latestBuild.id,
        visibility: normalizedNextVisibility
      });
      if (result?.build) {
        applyBuildUpdate({
          ...latestBuild,
          ...result.build
        });
      }
      setLumineChatVisibility(normalizedNextVisibility);
      return true;
    } catch (error: any) {
      setLumineChatVisibilityError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to save Lumine history setting'
      );
      return false;
    } finally {
      setSavingLumineChatVisibility(false);
    }
  }

  const savedLumineChatVisibility = normalizeLumineChatVisibility(
    build.lumineChatVisibility
  );
  const lumineChatVisibilitySettingsShown =
    currentBuildIsContributionFork ||
    acceptedContributorCount > 0 ||
    savedLumineChatVisibility === 'collaborators' ||
    lumineChatVisibility === 'collaborators';
  const canManageLumineChatVisibility =
    isOwner && lumineChatVisibilitySettingsShown;
  // The chat (including past messages) is shared with the team by default,
  // so say so once: to the owner when the project has a team, and to a
  // contributor on their branch. A notice, not a gate; it goes away once
  // dismissed or once the owner picks a setting themselves.
  const teamNoticeShown =
    canManageLumineChatVisibility &&
    savedLumineChatVisibility === 'collaborators' &&
    !Number(build.lumineChatVisibilitySetAt || 0) &&
    (currentBuildIsContributionFork || acceptedContributorCount > 0) &&
    teamNoticeDismissedBuildId !== Number(build.id) &&
    !readTeamNoticeDismissed(build.id);
  const lumineChatTeamNotice = teamNoticeShown
    ? currentBuildIsContributionFork
      ? 'Your Lumine chat on this branch is visible to the project’s team, including past messages. Change it with “Share Lumine chat with” above.'
      : 'Your Lumine chat is now visible to your team, including past messages. Change it with “Share Lumine chat with” above.'
    : null;

  function handleDismissLumineChatTeamNotice() {
    writeTeamNoticeDismissed(build.id);
    setTeamNoticeDismissedBuildId(Number(build.id));
  }

  const lumineChatVisibilityChoiceRecorded =
    Number(build.lumineChatVisibilitySetAt || 0) > 0;

  return {
    canManageLumineChatVisibility,
    lumineChatVisibilityChoiceRecorded,
    handleDismissLumineChatTeamNotice,
    handleSaveLumineChatVisibility,
    lumineChatTeamNotice,
    lumineChatVisibility,
    lumineChatVisibilityError,
    lumineChatVisibilitySettingsShown,
    savedLumineChatVisibility,
    savingLumineChatVisibility,
    setAcceptedContributorCount
  };
}

const TEAM_NOTICE_STORAGE_PREFIX = 'lumine-chat-team-notice-dismissed:';

function readTeamNoticeDismissed(buildId: unknown) {
  try {
    return (
      window.localStorage.getItem(
        `${TEAM_NOTICE_STORAGE_PREFIX}${Number(buildId) || 0}`
      ) === '1'
    );
  } catch {
    return false;
  }
}

function writeTeamNoticeDismissed(buildId: unknown) {
  try {
    window.localStorage.setItem(
      `${TEAM_NOTICE_STORAGE_PREFIX}${Number(buildId) || 0}`,
      '1'
    );
  } catch {
    // Storage unavailable: the notice stays dismissed for this session.
  }
}

import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { Color } from '~/constants/css';
import { useRoleColor } from '~/theme/useRoleColor';
import BuildContributorInvitePicker from './BuildContributorInvitePicker';

type BuildCollaborationMode = 'private' | 'open_source';
type BuildContributionAccess = 'anyone' | 'invite_only';
type BuildLumineChatVisibility = 'private' | 'collaborators';

interface BuildLike {
  id: number;
  isPublic?: boolean;
  collaborationMode?: BuildCollaborationMode | 'contribution';
  contributionAccess?: BuildContributionAccess;
  lumineChatVisibility?: BuildLumineChatVisibility | 'public';
}

interface BuildContributorInvite {
  userId: number;
  username?: string | null;
  profilePicUrl?: string | null;
  acceptedAt?: number | null;
}

interface BuildCollaborationSettingsModalProps {
  build: BuildLike;
  canShowLumineChatVisibilitySetting: boolean;
  onBuildPatch: (patch: Record<string, any>) => void;
  onHide: () => void;
}

const bodyClass = css`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const introClass = css`
  font-size: 1.15rem;
  line-height: 1.5;
  color: ${Color.darkGray()};
`;

const sectionClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
`;

const sectionTitleClass = css`
  font-size: 0.9rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${Color.darkGray()};
`;

const optionGridClass = css`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.7rem;
`;

const optionButtonClass = css`
  width: 100%;
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  background: #fff;
  color: var(--chat-text);
  padding: 0.8rem 0.9rem;
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    transform 0.15s ease;
  &:hover:not(:disabled) {
    border-color: var(--collaboration-accent-border);
    background: var(--collaboration-accent-hover-bg);
    transform: translateY(-1px);
  }
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  &.selected {
    border-color: var(--collaboration-accent);
    background: var(--collaboration-accent-bg);
  }
`;

const optionIconClass = css`
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--collaboration-accent-bg);
  color: var(--collaboration-accent);
  flex: 0 0 auto;
`;

const optionContentClass = css`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const optionTitleClass = css`
  font-weight: 900;
  font-size: 1rem;
`;

const optionDescriptionClass = css`
  color: var(--chat-text);
  opacity: 0.68;
  font-size: 0.9rem;
  line-height: 1.35;
`;

const inviteCardClass = css`
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  background: #fff;
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const rowClass = css`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex-wrap: wrap;
`;

const mutedTextClass = css`
  color: var(--chat-text);
  opacity: 0.68;
  font-size: 0.9rem;
  font-weight: 700;
`;

const errorClass = css`
  color: #be123c;
  font-weight: 800;
  font-size: 0.9rem;
`;

const modeOptions: Array<{
  value: BuildCollaborationMode;
  icon: string;
  title: string;
  description: string;
}> = [
  {
    value: 'private',
    icon: 'lock',
    title: 'Private Project',
    description:
      'Only you and invited collaborators can access the team workspace.'
  },
  {
    value: 'open_source',
    icon: 'globe',
    title: 'Open source',
    description:
      'People can fork a published copy, while collaborators can still contribute here.'
  }
];

const lumineChatVisibilityOptions: Array<{
  value: BuildLumineChatVisibility;
  icon: string;
  title: string;
  description: string;
}> = [
  {
    value: 'private',
    icon: 'lock',
    title: 'Nobody',
    description: 'Only you can see your Lumine chat history.'
  },
  {
    value: 'collaborators',
    icon: 'users',
    title: 'Collaborators',
    description: 'Project collaborators can review the transcript.'
  }
];

export default function BuildCollaborationSettingsModal({
  build,
  canShowLumineChatVisibilitySetting,
  onBuildPatch,
  onHide
}: BuildCollaborationSettingsModalProps) {
  const updateBuildCollaboration = useAppContext(
    (v) => v.requestHelpers.updateBuildCollaboration
  );
  const updateBuildLumineChatVisibility = useAppContext(
    (v) => v.requestHelpers.updateBuildLumineChatVisibility
  );
  const loadBuildContributors = useAppContext(
    (v) => v.requestHelpers.loadBuildContributors
  );
  const revokeBuildContributor = useAppContext(
    (v) => v.requestHelpers.revokeBuildContributor
  );
  const accentRole = useRoleColor('itemSelected', {
    fallback: 'logoBlue'
  });

  const [collaborationMode, setCollaborationMode] =
    useState<BuildCollaborationMode>(
      normalizeCollaborationMode(build.collaborationMode)
    );
  const [lumineChatVisibility, setLumineChatVisibility] =
    useState<BuildLumineChatVisibility>(
      normalizeLumineChatVisibility(build.lumineChatVisibility)
    );
  const [contributors, setContributors] = useState<BuildContributorInvite[]>(
    []
  );
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [loadingContributors, setLoadingContributors] = useState(false);
  const persistedCollaborationMode = normalizeCollaborationMode(
    build.collaborationMode
  );
  const canInviteContributors = true;
  const contributorsCardShown = true;
  const openSourceNotPublished =
    collaborationMode === 'open_source' && !build.isPublic;
  const persistedLumineChatVisibility = normalizeLumineChatVisibility(
    build.lumineChatVisibility
  );
  const lumineChatVisibilityChanged =
    canShowLumineChatVisibilitySetting &&
    lumineChatVisibility !== persistedLumineChatVisibility;
  const settingsChanged =
    collaborationMode !== persistedCollaborationMode ||
    lumineChatVisibilityChanged;
  const collaborationThemeStyle = {
    '--collaboration-accent': accentRole.getColor(1),
    '--collaboration-accent-border': accentRole.getColor(0.5),
    '--collaboration-accent-bg': accentRole.getColor(0.12),
    '--collaboration-accent-hover-bg': accentRole.getColor(0.06)
  } as React.CSSProperties;

  useEffect(() => {
    setCollaborationMode(normalizeCollaborationMode(build.collaborationMode));
    setLumineChatVisibility(
      normalizeLumineChatVisibility(build.lumineChatVisibility)
    );
  }, [build.collaborationMode, build.lumineChatVisibility]);

  useEffect(() => {
    void reloadContributors();
    // request helpers are stable context helpers; do not include them in deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build.id]);

  return (
    <Modal
      modalKey="BuildCollaborationSettingsModal"
      isOpen
      onClose={savingSettings ? () => {} : onHide}
      closeOnBackdropClick={!savingSettings}
      title="Collaboration Settings"
      size="md"
      footer={
        <div>
          <Button
            variant="ghost"
            disabled={savingSettings}
            onClick={onHide}
            style={{ marginRight: '0.7rem' }}
          >
            Cancel
          </Button>
          <Button
            color="logoBlue"
            loading={savingSettings}
            disabled={savingSettings || !settingsChanged}
            onClick={handleSaveSettings}
          >
            Save
          </Button>
        </div>
      }
    >
      <div className={bodyClass} style={collaborationThemeStyle}>
        <div className={introClass}>
          Choose whether people can fork a published copy. Project
          collaborators are managed by invite or accepted requests.
        </div>
        <div className={sectionClass}>
          <div className={sectionTitleClass}>Project mode</div>
          <div className={optionGridClass}>
            {modeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`${optionButtonClass}${
                  collaborationMode === option.value ? ' selected' : ''
                }`}
                onClick={() => handleModeChange(option.value)}
              >
                <span className={optionIconClass}>
                  <Icon icon={option.icon} />
                </span>
                <span className={optionContentClass}>
                  <span className={optionTitleClass}>{option.title}</span>
                  <span className={optionDescriptionClass}>
                    {option.description}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
        {openSourceNotPublished ? (
          <div className={mutedTextClass}>
            Publish this build when you are ready for people to see and fork it.
          </div>
        ) : null}
        {canShowLumineChatVisibilitySetting ? (
          <div className={sectionClass}>
            <div className={sectionTitleClass}>Share Lumine chat with</div>
            <div className={optionGridClass}>
              {lumineChatVisibilityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`${optionButtonClass}${
                    lumineChatVisibility === option.value ? ' selected' : ''
                  }`}
                  onClick={() => setLumineChatVisibility(option.value)}
                >
                  <span className={optionIconClass}>
                    <Icon icon={option.icon} />
                  </span>
                  <span className={optionContentClass}>
                    <span className={optionTitleClass}>{option.title}</span>
                    <span className={optionDescriptionClass}>
                      {option.description}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {contributorsCardShown ? (
          <div className={inviteCardClass}>
            <div className={rowClass}>
              <strong>Collaborators</strong>
              {loadingContributors ? (
                <span className={mutedTextClass}>Loading...</span>
              ) : null}
            </div>
            <BuildContributorInvitePicker
              buildId={build.id}
              canInvite={canInviteContributors}
              confirmModalOverModal
              contributors={contributors}
              onInvited={reloadContributors}
              onRemoveContributor={handleRevokeContributor}
            />
          </div>
        ) : null}
        {settingsError ? (
          <span className={errorClass}>{settingsError}</span>
        ) : null}
      </div>
    </Modal>
  );

  async function handleSaveSettings() {
    if (savingSettings) return;
    if (!settingsChanged) return;
    setSavingSettings(true);
    setSettingsError('');
    let shouldClose = false;
    try {
      const result = await updateBuildCollaboration({
        buildId: build.id,
        collaborationMode,
        contributionAccess: getContributionAccessForCollaborationMode(
          collaborationMode
        )
      });
      if (result?.build) {
        onBuildPatch(result.build);
      }
      if (lumineChatVisibilityChanged) {
        const visibilityResult = await updateBuildLumineChatVisibility({
          buildId: build.id,
          visibility: lumineChatVisibility
        });
        if (visibilityResult?.build) {
          onBuildPatch(visibilityResult.build);
        }
      }
      shouldClose = true;
    } catch (error: any) {
      setSettingsError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to save collaboration settings'
      );
    } finally {
      setSavingSettings(false);
    }
    if (shouldClose) {
      onHide();
    }
  }

  function handleModeChange(nextMode: BuildCollaborationMode) {
    setCollaborationMode(nextMode);
  }

  async function reloadContributors() {
    if (!build.id) return;
    setLoadingContributors(true);
    try {
      const result = await loadBuildContributors(build.id);
      setContributors(
        Array.isArray(result?.contributors) ? result.contributors : []
      );
    } catch (error) {
      console.error('Failed to load build contributors:', error);
    } finally {
      setLoadingContributors(false);
    }
  }

  async function handleRevokeContributor(contributorUserId: number) {
    if (!build.id || contributorUserId <= 0) return;
    try {
      const result = await revokeBuildContributor({
        buildId: build.id,
        userId: contributorUserId
      });
      if (result?.success) {
        setContributors((current) =>
          current.filter(
            (contributor) =>
              Number(contributor.userId) !== Number(contributorUserId)
          )
        );
      }
    } catch (error) {
      console.error('Failed to revoke build contributor:', error);
    }
  }
}

function normalizeCollaborationMode(value: unknown): BuildCollaborationMode {
  return value === 'open_source' ? value : 'private';
}

function normalizeLumineChatVisibility(
  value: unknown
): BuildLumineChatVisibility {
  return value === 'collaborators' ? value : 'private';
}

function getContributionAccessForCollaborationMode(
  _mode: BuildCollaborationMode
): BuildContributionAccess {
  return 'invite_only';
}

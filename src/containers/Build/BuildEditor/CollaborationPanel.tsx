import React, { useEffect, useMemo, useState } from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import { useAppContext, useKeyContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import BuildContributorInvitePicker from './BuildContributorInvitePicker';

type BuildCollaborationMode = 'private' | 'open_source';
type BuildContributionAccess = 'anyone' | 'invite_only';
type BuildLumineChatVisibility = 'private' | 'collaborators';
type BuildContributionStatus =
  | 'none'
  | 'draft'
  | 'submitted'
  | 'merging'
  | 'merged'
  | 'rejected'
  | 'withdrawn';

interface BuildContributionFileDiff {
  path: string;
  status: 'added' | 'updated' | 'deleted';
  baseContent?: string;
  currentContent?: string;
  contributionContent?: string;
  mergeStatus?: 'clean' | 'conflict' | 'unchanged';
  conflictType?: string;
  autoMergedContent?: string;
}

interface BuildLike {
  id: number;
  userId: number;
  title: string;
  collaborationMode?: BuildCollaborationMode | 'contribution';
  contributionAccess?: BuildContributionAccess;
  contributionRootBuildId?: number | null;
  contributionStatus?: BuildContributionStatus;
  contributionSubmittedAt?: number | null;
  contributionContributorId?: number | null;
  username?: string;
  profilePicUrl?: string | null;
  code?: string | null;
  lumineChatVisibility?: BuildLumineChatVisibility | 'public';
}

interface ContributionComment {
  id: number;
  userId: number;
  body: string;
  username?: string | null;
  profilePicUrl?: string | null;
  createdAt?: number | null;
}

interface BuildContributorInvite {
  userId: number;
  username?: string | null;
  profilePicUrl?: string | null;
  acceptedAt?: number | null;
  declinedAt?: number | null;
}

interface BuildCollaborationRequest {
  id: number;
  inviteId?: number;
  buildId: number;
  requesterUserId: number;
  ownerUserId: number;
  message: string;
  status: 'pending' | 'invited' | 'accepted' | 'rejected' | 'canceled';
  ownerHidden?: number;
  username?: string | null;
  profilePicUrl?: string | null;
  createdAt?: number | null;
  updatedAt?: number | null;
}

interface SharedLumineChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: number | null;
}

interface CollaborationPanelProps {
  build: BuildLike;
  embedded?: boolean;
  isOwner: boolean;
  onBuildPatch: (patch: Record<string, any>) => void;
  onCanonicalMerge: (payload: {
    build?: Record<string, any> | null;
    projectFiles?: Array<{ path: string; content?: string }> | null;
  }) => void;
  onAcceptedContributorCountChange?: (count: number) => void;
  onBeforeContributionAction?: (action: 'submit' | 'merge') => Promise<boolean>;
  onOpenCollaborationSettings?: () => void;
}

const panelClass = css`
  border-bottom: 1px solid var(--ui-border);
  background: #fff;
  padding: 0.65rem 1.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.8rem 1rem;
  }
`;

const embeddedPanelClass = css`
  height: 100%;
  min-height: 0;
  overflow: hidden;
  border-bottom: 0;
  padding: 0.85rem;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
`;

const toolbarClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const toolbarPrimaryClass = css`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
  min-width: 0;
`;

const toolbarActionsClass = css`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: wrap;
  margin-left: auto;
`;

const rowClass = css`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex-wrap: wrap;
`;

const labelClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
  font-weight: 900;
  color: var(--chat-text);
  font-size: 0.88rem;
`;

const selectClass = css`
  height: 2.25rem;
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  background: #fff;
  color: var(--chat-text);
  padding: 0 0.65rem;
  font-weight: 800;
  max-width: 100%;
`;

const statusPillClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: 1px solid rgba(65, 140, 235, 0.28);
  border-radius: 999px;
  background: rgba(65, 140, 235, 0.1);
  color: #1d4ed8;
  padding: 0.35rem 0.7rem;
  font-weight: 900;
  font-size: 0.82rem;
`;

const summaryPillClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: 1px solid rgba(148, 163, 184, 0.34);
  border-radius: 999px;
  background: rgba(248, 250, 252, 0.9);
  color: var(--chat-text);
  padding: 0.35rem 0.7rem;
  font-weight: 900;
  font-size: 0.82rem;
  white-space: nowrap;
`;

const mutedTextClass = css`
  color: var(--chat-text);
  opacity: 0.68;
  font-size: 0.88rem;
  font-weight: 700;
`;

const expandedBodyClass = css`
  border-top: 1px solid rgba(148, 163, 184, 0.28);
  padding-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 0;
  overflow: auto;
`;

const embeddedBodyStackClass = css`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const splitClass = css`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
`;

const listClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`;

const contributionButtonClass = css`
  border: 1px solid var(--ui-border);
  background: #fff;
  color: var(--chat-text);
  border-radius: 8px;
  padding: 0.7rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  cursor: pointer;
  text-align: left;
  &:hover,
  &.selected {
    border-color: rgba(65, 140, 235, 0.42);
    background: rgba(65, 140, 235, 0.08);
  }
`;

const contributionTitleClass = css`
  font-weight: 900;
  font-size: 0.95rem;
`;

const detailClass = css`
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  background: #fff;
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const collaborationPromptClass = css`
  border: 1px solid rgba(65, 140, 235, 0.3);
  border-radius: 8px;
  background: #fff;
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const collaborationPromptTitleClass = css`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  color: var(--chat-text);
  font-size: 1rem;
  font-weight: 900;
  line-height: 1.25;
`;

const collaborationPromptTextClass = css`
  color: var(--chat-text);
  opacity: 0.72;
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.35;
`;

const collaborationPromptActionClass = css`
  display: flex;
  justify-content: center;
`;

const fileListClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-height: 16rem;
  overflow: auto;
`;

const fileRowClass = css`
  display: grid;
  grid-template-columns: auto 5rem minmax(0, 1fr);
  align-items: center;
  gap: 0.55rem;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 8px;
  padding: 0.45rem 0.55rem;
  font-size: 0.85rem;
`;

const filePathClass = css`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
`;

const diffPreviewClass = css`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.6rem;
`;

const codePreviewClass = css`
  min-height: 6rem;
  max-height: 14rem;
  overflow: auto;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 8px;
  background: #0f172a;
  color: #e2e8f0;
  padding: 0.7rem;
  font-size: 0.78rem;
  white-space: pre-wrap;
  word-break: break-word;
`;

const conflictBadgeClass = css`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.18rem 0.48rem;
  background: rgba(244, 63, 94, 0.12);
  color: #be123c;
  font-size: 0.72rem;
  font-weight: 900;
`;

const commentListClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const commentActionsClass = css`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.7rem;
  flex-wrap: wrap;
`;

const commentClass = css`
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 8px;
  padding: 0.65rem 0.75rem;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`;

const commentHeaderClass = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.7rem;
  font-weight: 900;
  font-size: 0.82rem;
`;

const commentBodyClass = css`
  color: #111827;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
`;

const textareaClass = css`
  width: 100%;
  min-height: 3.8rem;
  resize: vertical;
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  padding: 0.65rem;
  font: inherit;
  &:focus {
    outline: 2px solid rgba(65, 140, 235, 0.24);
    border-color: rgba(65, 140, 235, 0.55);
  }
`;

const errorClass = css`
  color: #be123c;
  font-weight: 800;
  font-size: 0.86rem;
`;

const requestCardClass = css`
  border: 1px solid rgba(236, 72, 153, 0.28);
  border-radius: 8px;
  background: rgba(253, 242, 248, 0.52);
  padding: 0.7rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
`;

const requestMessageClass = css`
  color: var(--chat-text);
  font-size: 0.9rem;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
`;

const lumineHistoryListClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  max-height: 20rem;
  overflow: auto;
`;

const lumineHistoryMessageClass = css`
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  padding: 0.65rem;
  background: #fff;
  display: grid;
  gap: 0.35rem;
`;

const lumineHistoryMessageHeaderClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.82rem;
  font-weight: 900;
  color: var(--chat-text);
  opacity: 0.72;
`;

const lumineHistoryMessageBodyClass = css`
  color: var(--chat-text);
  font-size: 0.92rem;
  line-height: 1.42;
  white-space: pre-wrap;
  word-break: break-word;
`;

export default function CollaborationPanel({
  build,
  embedded = false,
  isOwner,
  onBuildPatch,
  onCanonicalMerge,
  onAcceptedContributorCountChange,
  onBeforeContributionAction,
  onOpenCollaborationSettings
}: CollaborationPanelProps) {
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);
  const updateBuildCollaboration = useAppContext(
    (v) => v.requestHelpers.updateBuildCollaboration
  );
  const loadBuildLumineChatHistory = useAppContext(
    (v) => v.requestHelpers.loadBuildLumineChatHistory
  );
  const loadBuildContributions = useAppContext(
    (v) => v.requestHelpers.loadBuildContributions
  );
  const loadBuildContributors = useAppContext(
    (v) => v.requestHelpers.loadBuildContributors
  );
  const loadBuildCollaborationRequests = useAppContext(
    (v) => v.requestHelpers.loadBuildCollaborationRequests
  );
  const acceptBuildCollaborationRequest = useAppContext(
    (v) => v.requestHelpers.acceptBuildCollaborationRequest
  );
  const rejectBuildCollaborationRequest = useAppContext(
    (v) => v.requestHelpers.rejectBuildCollaborationRequest
  );
  const hideBuildCollaborationRequest = useAppContext(
    (v) => v.requestHelpers.hideBuildCollaborationRequest
  );
  const revokeBuildContributor = useAppContext(
    (v) => v.requestHelpers.revokeBuildContributor
  );
  const loadMyBuildCollaborationRequest = useAppContext(
    (v) => v.requestHelpers.loadMyBuildCollaborationRequest
  );
  const acceptBuildContributorInvite = useAppContext(
    (v) => v.requestHelpers.acceptBuildContributorInvite
  );
  const declineBuildContributorInvite = useAppContext(
    (v) => v.requestHelpers.declineBuildContributorInvite
  );
  const createBuildContributionFork = useAppContext(
    (v) => v.requestHelpers.createBuildContributionFork
  );
  const loadBuildContribution = useAppContext(
    (v) => v.requestHelpers.loadBuildContribution
  );
  const rejectBuildContribution = useAppContext(
    (v) => v.requestHelpers.rejectBuildContribution
  );
  const mergeBuildContribution = useAppContext(
    (v) => v.requestHelpers.mergeBuildContribution
  );
  const completeBuildContributionMerge = useAppContext(
    (v) => v.requestHelpers.completeBuildContributionMerge
  );
  const loadBuildContributionComments = useAppContext(
    (v) => v.requestHelpers.loadBuildContributionComments
  );
  const createBuildContributionComment = useAppContext(
    (v) => v.requestHelpers.createBuildContributionComment
  );
  const deleteBuildContributionComment = useAppContext(
    (v) => v.requestHelpers.deleteBuildContributionComment
  );

  const isContributionFork =
    normalizeContributionStatus(build.contributionStatus) !== 'none';
  const canModerateContributionComments = isOwner && !isContributionFork;
  const rootBuildId = isContributionFork
    ? Number(build.contributionRootBuildId || 0)
    : Number(build.id || 0);
  const contributionBuildId = isContributionFork ? Number(build.id || 0) : 0;
  const canShowPanel = isOwner || isContributionFork || embedded;
  const [collaborationMode, setCollaborationMode] =
    useState<BuildCollaborationMode>(
      normalizeCollaborationMode(build.collaborationMode)
    );
  const [sharedLumineChatMessages, setSharedLumineChatMessages] = useState<
    SharedLumineChatMessage[]
  >([]);
  const [sharedLumineChatLoading, setSharedLumineChatLoading] =
    useState(false);
  const [sharedLumineChatError, setSharedLumineChatError] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [contributors, setContributors] = useState<BuildContributorInvite[]>(
    []
  );
  const [collaborationRequests, setCollaborationRequests] = useState<
    BuildCollaborationRequest[]
  >([]);
  const [myCollaborationRequest, setMyCollaborationRequest] =
    useState<BuildCollaborationRequest | null>(null);
  const [myCollaborationRequestLoading, setMyCollaborationRequestLoading] =
    useState(false);
  const [showHiddenCollaborationRequests, setShowHiddenCollaborationRequests] =
    useState(false);
  const [loadingCollaborationRequests, setLoadingCollaborationRequests] =
    useState(false);
  const [contributions, setContributions] = useState<BuildLike[]>([]);
  const [loadingContributions, setLoadingContributions] = useState(false);
  const [selectedContributionId, setSelectedContributionId] = useState(0);
  const [selectedContribution, setSelectedContribution] =
    useState<BuildLike | null>(null);
  const [changedFiles, setChangedFiles] = useState<BuildContributionFileDiff[]>(
    []
  );
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [previewPath, setPreviewPath] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [actionError, setActionError] = useState('');
  const [requestActionError, setRequestActionError] = useState('');
  const [comments, setComments] = useState<ContributionComment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [panelExpanded, setPanelExpanded] = useState(false);
  const contentExpanded = embedded || panelExpanded;
  const selectedPreviewFile = useMemo(
    () => changedFiles.find((file) => file.path === previewPath) || null,
    [changedFiles, previewPath]
  );
  const reviewContributions = useMemo(
    () =>
      contributions.filter((contribution) => {
        const status = normalizeContributionStatus(
          contribution.contributionStatus
        );
        return status !== 'none' && status !== 'draft';
      }),
    [contributions]
  );
  const sharedLumineChatTarget = useMemo(() => {
    if (isOwner && !isContributionFork && selectedContribution) {
      return selectedContribution;
    }
    if (!isOwner) {
      return build;
    }
    return null;
  }, [build, isContributionFork, isOwner, selectedContribution]);
  const sharedLumineChatTargetVisibility = normalizeLumineChatVisibility(
    sharedLumineChatTarget?.lumineChatVisibility
  );
  const acceptedContributorCount = useMemo(
    () =>
      contributors.filter(
        (contributor) => Number(contributor.acceptedAt || 0) > 0
      ).length,
    [contributors]
  );
  const canInviteContributors = true;
  const contributorsCardShown = true;

  useEffect(() => {
    setCollaborationMode(normalizeCollaborationMode(build.collaborationMode));
  }, [build.collaborationMode]);

  useEffect(() => {
    if (
      !sharedLumineChatTarget?.id ||
      sharedLumineChatTargetVisibility === 'private'
    ) {
      setSharedLumineChatMessages([]);
      setSharedLumineChatError('');
      return;
    }
    void reloadSharedLumineChatHistory(Number(sharedLumineChatTarget.id));
    // request helpers are stable context helpers; do not include them in deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedLumineChatTarget?.id, sharedLumineChatTargetVisibility]);

  useEffect(() => {
    if (!canShowPanel) return;
    if (isOwner && !isContributionFork) {
      void reloadContributions();
      void reloadCollaborationRequests(showHiddenCollaborationRequests);
      void reloadContributors();
    }
    if (!isOwner && !isContributionFork) {
      void reloadMyCollaborationRequest();
    }
    if (isContributionFork && rootBuildId && contributionBuildId) {
      setSelectedContributionId(contributionBuildId);
      void reloadContributionDetail(contributionBuildId);
      void reloadComments(contributionBuildId);
    } else if (!isContributionFork) {
      void reloadComments(0);
    }
    // request helpers are stable context helpers; do not include them in deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    build.id,
    canShowPanel,
    contributionBuildId,
    embedded,
    isContributionFork,
    isOwner,
    rootBuildId,
    showHiddenCollaborationRequests,
    userId
  ]);

  if (!canShowPanel) return null;

  return (
    <section
      className={
        embedded ? `${panelClass} ${embeddedPanelClass}` : panelClass
      }
    >
      <div className={toolbarClass}>
        <div className={toolbarPrimaryClass}>
          {embedded ? (
            <>
              <span className={statusPillClass}>
                <Icon icon="comments" />
                Team
              </span>
            </>
          ) : isOwner && !isContributionFork ? (
            <>
              <span className={statusPillClass}>
                <Icon icon="code-branch" />
                Collaboration
              </span>
              <label className={labelClass}>
                Mode
                <select
                  className={selectClass}
                  value={collaborationMode}
                  onChange={(event) =>
                    setCollaborationMode(
                      normalizeCollaborationMode(event.target.value)
                    )
                  }
                >
                  <option value="private">Private Project</option>
                  <option value="open_source">Open source</option>
                </select>
              </label>
              <GameCTAButton
                variant="logoBlue"
                size="sm"
                icon="save"
                loading={savingSettings}
                disabled={savingSettings}
                onClick={handleSaveSettings}
              >
                Save
              </GameCTAButton>
              {settingsError ? (
                <span className={errorClass}>{settingsError}</span>
              ) : null}
            </>
          ) : (
            <>
              <span className={statusPillClass}>
                <Icon icon="code-branch" />
                Contribution{' '}
                {normalizeContributionStatus(build.contributionStatus)}
              </span>
              {normalizeContributionStatus(build.contributionStatus) ===
              'submitted' ? (
                <span className={mutedTextClass}>
                  Submitted forks are locked.
                </span>
              ) : null}
            </>
          )}
          <span className={summaryPillClass}>
            <Icon icon="comment" />
            {comments.length}
          </span>
          {isOwner && !isContributionFork ? (
            <span className={summaryPillClass}>
              <Icon icon="code-branch" />
              {reviewContributions.length}
            </span>
          ) : null}
        </div>
        {!embedded ? (
          <div className={toolbarActionsClass}>
            <GameCTAButton
              variant="neutral"
              size="sm"
              icon={panelExpanded ? 'chevron-up' : 'comment'}
              onClick={() => setPanelExpanded((current) => !current)}
            >
              {panelExpanded ? 'Hide' : 'Discuss'}
            </GameCTAButton>
          </div>
        ) : null}
      </div>

      {contentExpanded ? (
        <div className={expandedBodyClass}>
          {embedded ? (
            renderEmbeddedBody()
          ) : (
            <>
              {isOwner && !isContributionFork ? (
                <>
                  {renderCollaborationRequests()}
                  {contributorsCardShown ? renderInviteCard() : null}
                  {renderOwnerContributions(true)}
                </>
              ) : (
                <div className={splitClass}>
                  {renderSharedLumineChatHistoryCard()}
                  {renderComments()}
                </div>
              )}
            </>
          )}
        </div>
      ) : null}
    </section>
  );

  function renderEmbeddedBody() {
    if (isOwner && !isContributionFork) {
      const ownerContributionsShown =
        loadingContributions ||
        reviewContributions.length > 0 ||
        Boolean(selectedContribution);
      return (
        <div className={embeddedBodyStackClass}>
          {renderComments()}
          {renderCollaborationRequests()}
          {renderCollaborationPromptCard()}
          {contributorsCardShown ? renderInviteCard() : null}
          {ownerContributionsShown ? renderOwnerContributions() : null}
        </div>
      );
    }
    if (!isContributionFork) {
      return (
        <div className={embeddedBodyStackClass}>
          {renderViewerInviteCard()}
          {renderSharedLumineChatHistoryCard()}
          {renderComments()}
        </div>
      );
    }
    return (
      <div className={embeddedBodyStackClass}>
        {renderSharedLumineChatHistoryCard()}
        {renderComments()}
      </div>
    );
  }

  function renderSharedLumineChatHistoryCard() {
    if (!sharedLumineChatTarget) return null;
    const targetTitle =
      isOwner && !isContributionFork
        ? `${sharedLumineChatTarget.username || 'Contributor'}'s Lumine history`
        : 'Shared Lumine history';
    if (sharedLumineChatTargetVisibility === 'private') {
      return (
        <div className={detailClass}>
          <div className={rowClass}>
            <strong>{targetTitle}</strong>
          </div>
          <span className={mutedTextClass}>No shared transcript.</span>
        </div>
      );
    }
    return (
      <div className={detailClass}>
        <div className={rowClass}>
          <strong>{targetTitle}</strong>
          <span className={statusPillClass}>
            {sharedLumineChatTargetVisibility}
          </span>
          {sharedLumineChatLoading ? (
            <span className={mutedTextClass}>Loading...</span>
          ) : null}
        </div>
        {sharedLumineChatError ? (
          <span className={errorClass}>{sharedLumineChatError}</span>
        ) : sharedLumineChatMessages.length === 0 ? (
          <span className={mutedTextClass}>No visible messages yet.</span>
        ) : (
          <div className={lumineHistoryListClass}>
            {sharedLumineChatMessages.map((message) => (
              <div key={message.id} className={lumineHistoryMessageClass}>
                <div className={lumineHistoryMessageHeaderClass}>
                  <span>{message.role === 'user' ? 'Builder' : 'Lumine'}</span>
                  {message.createdAt ? (
                    <span>{formatShortTimestamp(message.createdAt)}</span>
                  ) : null}
                </div>
                <div className={lumineHistoryMessageBodyClass}>
                  {message.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderCollaborationPromptCard() {
    if (acceptedContributorCount > 0) {
      return null;
    }
    const mode = normalizeCollaborationMode(build.collaborationMode);
    const isPrivate = mode === 'private';
    const isOpenSource = mode === 'open_source';
    const title = isPrivate
      ? 'This project is private.'
      : isOpenSource
        ? 'This project is open source.'
        : 'This project uses invite-only collaboration.';
    const description = isPrivate
      ? 'Invite collaborators to discuss and contribute in the team workspace.'
      : isOpenSource
        ? 'People can fork published copies, and invited collaborators can still contribute to this original project.'
        : 'Invited collaborators can create project-scoped forks, discuss changes, and send them back for review.';
    return (
      <div className={collaborationPromptClass}>
        <div className={collaborationPromptTitleClass}>
          <Icon icon={isPrivate ? 'users' : 'code-branch'} />
          <span>{title}</span>
        </div>
        {description ? (
          <div className={collaborationPromptTextClass}>{description}</div>
        ) : null}
        {onOpenCollaborationSettings ? (
          <div className={collaborationPromptActionClass}>
            <GameCTAButton
              variant={isPrivate ? 'pink' : 'logoBlue'}
              size="sm"
              icon={isPrivate ? 'users' : 'gear'}
              shiny={isPrivate}
              onClick={onOpenCollaborationSettings}
            >
              {isPrivate ? 'Set Up Collaboration' : 'Manage Settings'}
            </GameCTAButton>
          </div>
        ) : null}
      </div>
    );
  }

  function renderInviteCard() {
    return (
      <div className={detailClass}>
        <div className={rowClass}>
          <strong>Collaborators</strong>
        </div>
        <BuildContributorInvitePicker
          buildId={rootBuildId}
          canInvite={canInviteContributors}
          contributors={contributors}
          onInvited={reloadContributors}
          onRemoveContributor={handleRevokeContributor}
        />
      </div>
    );
  }

  function renderViewerInviteCard() {
    if (!myCollaborationRequest && !myCollaborationRequestLoading) {
      return null;
    }
    const inviteId = Number(myCollaborationRequest?.inviteId || 0);
    const status = myCollaborationRequest?.status || '';
    const isInvited = status === 'invited';
    const isAccepted = status === 'accepted';
    return (
      <div className={detailClass}>
        <div className={rowClass}>
          <strong>Contributor invite</strong>
          {myCollaborationRequestLoading ? (
            <span className={mutedTextClass}>Loading...</span>
          ) : (
            <span className={statusPillClass}>{status}</span>
          )}
        </div>
        {isInvited ? (
          <>
            <span className={mutedTextClass}>
              The owner invited you to collaborate on this Build.
            </span>
            <div className={rowClass}>
              <GameCTAButton
                variant="logoBlue"
                size="sm"
                icon="check"
                loading={actionLoading === 'accept-invite'}
                disabled={Boolean(actionLoading) || !inviteId}
                onClick={handleAcceptContributorInvite}
              >
                Accept Invite
              </GameCTAButton>
              <GameCTAButton
                variant="neutral"
                size="sm"
                icon="ban"
                loading={actionLoading === 'decline-invite'}
                disabled={Boolean(actionLoading) || !inviteId}
                onClick={handleDeclineContributorInvite}
              >
                Decline
              </GameCTAButton>
            </div>
          </>
        ) : isAccepted ? (
          <>
            <span className={mutedTextClass}>
              You can start a project-scoped contribution fork.
            </span>
            <div className={rowClass}>
              <GameCTAButton
                variant="success"
                size="sm"
                icon="code-branch"
                loading={actionLoading === 'start-contribution'}
                disabled={Boolean(actionLoading)}
                onClick={handleStartContribution}
              >
                Start Contributing
              </GameCTAButton>
            </div>
          </>
        ) : null}
        {requestActionError ? (
          <span className={errorClass}>{requestActionError}</span>
        ) : null}
      </div>
    );
  }

  function renderCollaborationRequests() {
    if (!isOwner || isContributionFork) return null;
    return (
      <div className={detailClass}>
        <div className={rowClass}>
          <strong>
            {showHiddenCollaborationRequests
              ? 'Hidden collaboration requests'
              : 'Collaboration requests'}
          </strong>
          <span className={mutedTextClass}>{collaborationRequests.length}</span>
          {loadingCollaborationRequests ? (
            <span className={mutedTextClass}>Loading...</span>
          ) : null}
          <GameCTAButton
            variant="neutral"
            size="sm"
            icon={showHiddenCollaborationRequests ? 'inbox' : 'eye-slash'}
            disabled={loadingCollaborationRequests}
            onClick={() =>
              setShowHiddenCollaborationRequests((current) => !current)
            }
          >
            {showHiddenCollaborationRequests ? 'Visible' : 'Hidden'}
          </GameCTAButton>
        </div>
        {collaborationRequests.length === 0 ? (
          <span className={mutedTextClass}>
            {showHiddenCollaborationRequests
              ? 'No hidden requests.'
              : 'No pending requests.'}
          </span>
        ) : (
          <div className={commentListClass}>
            {collaborationRequests.map((request) => (
              <div key={request.id} className={requestCardClass}>
                <div className={rowClass}>
                  <strong>{request.username || 'User'}</strong>
                  <span className={statusPillClass}>{request.status}</span>
                  {request.ownerHidden ? (
                    <span className={mutedTextClass}>Hidden</span>
                  ) : null}
                </div>
                {request.message ? (
                  <div className={requestMessageClass}>{request.message}</div>
                ) : (
                  <span className={mutedTextClass}>No message.</span>
                )}
                {request.status === 'pending' ? (
                  <div className={rowClass}>
                    <GameCTAButton
                      variant="success"
                      size="sm"
                      icon="check"
                      loading={actionLoading === `accept-request-${request.id}`}
                      disabled={Boolean(actionLoading)}
                      onClick={() => handleAcceptCollaborationRequest(request.id)}
                    >
                      Accept
                    </GameCTAButton>
                    <GameCTAButton
                      variant="neutral"
                      size="sm"
                      icon="ban"
                      loading={actionLoading === `reject-request-${request.id}`}
                      disabled={Boolean(actionLoading)}
                      onClick={() => handleRejectCollaborationRequest(request.id)}
                    >
                      Reject
                    </GameCTAButton>
                    {!request.ownerHidden ? (
                      <GameCTAButton
                        variant="neutral"
                        size="sm"
                        icon="eye-slash"
                        loading={actionLoading === `hide-request-${request.id}`}
                        disabled={Boolean(actionLoading)}
                        onClick={() => handleHideCollaborationRequest(request.id)}
                      >
                        Hide
                      </GameCTAButton>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
        {requestActionError ? (
          <span className={errorClass}>{requestActionError}</span>
        ) : null}
      </div>
    );
  }

  function renderOwnerContributions(showCommentsFallback = false) {
    if (
      !loadingContributions &&
      reviewContributions.length === 0 &&
      !selectedContribution
    ) {
      return showCommentsFallback ? renderComments() : null;
    }
    return (
      <div className={splitClass}>
        <div className={listClass}>
          <div className={rowClass}>
            <strong>Contributions</strong>
            {loadingContributions ? (
              <span className={mutedTextClass}>Loading...</span>
            ) : null}
          </div>
          {reviewContributions.length === 0 ? (
            <span className={mutedTextClass}>No contributions yet.</span>
          ) : (
            reviewContributions.map((contribution) => (
              <button
                key={contribution.id}
                type="button"
                className={`${contributionButtonClass}${
                  selectedContributionId === contribution.id ? ' selected' : ''
                }`}
                onClick={() => handleSelectContribution(contribution.id)}
              >
                <span className={contributionTitleClass}>
                  {contribution.username || 'Contributor'}
                </span>
                <span className={mutedTextClass}>
                  {normalizeContributionStatus(
                    contribution.contributionStatus
                  )}
                </span>
              </button>
            ))
          )}
        </div>
        {selectedContribution ? (
          <>
            {renderContributionDetail(true)}
            {renderSharedLumineChatHistoryCard()}
          </>
        ) : showCommentsFallback ? (
          renderComments()
        ) : null}
      </div>
    );
  }

  async function handleSaveSettings() {
    if (savingSettings) return;
    setSavingSettings(true);
    setSettingsError('');
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
    } catch (error: any) {
      setSettingsError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to save collaboration settings'
      );
    } finally {
      setSavingSettings(false);
    }
  }

  async function reloadSharedLumineChatHistory(targetBuildId: number) {
    if (!targetBuildId) return;
    setSharedLumineChatLoading(true);
    setSharedLumineChatError('');
    try {
      const result = await loadBuildLumineChatHistory(targetBuildId);
      setSharedLumineChatMessages(
        Array.isArray(result?.messages) ? result.messages : []
      );
    } catch (error: any) {
      setSharedLumineChatMessages([]);
      setSharedLumineChatError(
        error?.response?.data?.error ||
          error?.message ||
          'Lumine chat history is not shared'
      );
    } finally {
      setSharedLumineChatLoading(false);
    }
  }

  async function reloadContributions() {
    if (!rootBuildId) return;
    setLoadingContributions(true);
    try {
      const result = await loadBuildContributions(rootBuildId);
      setContributions(
        Array.isArray(result?.contributions) ? result.contributions : []
      );
    } catch (error) {
      console.error('Failed to load build contributions:', error);
    } finally {
      setLoadingContributions(false);
    }
  }

  async function reloadContributors() {
    if (!rootBuildId) return;
    try {
      const result = await loadBuildContributors(rootBuildId);
      const nextContributors = Array.isArray(result?.contributors)
        ? result.contributors
        : [];
      setContributors(nextContributors);
      onAcceptedContributorCountChange?.(
        nextContributors.filter(
          (contributor: BuildContributorInvite) =>
            Number(contributor.acceptedAt || 0) > 0
        ).length
      );
    } catch (error) {
      console.error('Failed to load build contributors:', error);
    }
  }

  async function reloadMyCollaborationRequest() {
    if (!rootBuildId || !userId) return;
    setMyCollaborationRequestLoading(true);
    try {
      const result = await loadMyBuildCollaborationRequest(rootBuildId);
      setMyCollaborationRequest(result?.request || null);
    } catch (error) {
      console.error('Failed to load my build collaboration request:', error);
      setMyCollaborationRequest(null);
    } finally {
      setMyCollaborationRequestLoading(false);
    }
  }

  async function reloadCollaborationRequests(hidden: boolean) {
    if (!rootBuildId || !isOwner || isContributionFork) return;
    setLoadingCollaborationRequests(true);
    try {
      const result = await loadBuildCollaborationRequests({
        buildId: rootBuildId,
        hidden
      });
      setCollaborationRequests(
        Array.isArray(result?.requests) ? result.requests : []
      );
    } catch (error) {
      console.error('Failed to load build collaboration requests:', error);
    } finally {
      setLoadingCollaborationRequests(false);
    }
  }

  async function handleAcceptCollaborationRequest(requestId: number) {
    if (!rootBuildId || !requestId || actionLoading) return;
    setActionLoading(`accept-request-${requestId}`);
    setRequestActionError('');
    try {
      const result = await acceptBuildCollaborationRequest({
        buildId: rootBuildId,
        requestId
      });
      if (result?.build) {
        onBuildPatch(result.build);
      }
      setCollaborationRequests((current) =>
        current.filter((request) => Number(request.id) !== Number(requestId))
      );
      void reloadContributors();
    } catch (error: any) {
      setRequestActionError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to accept collaboration request'
      );
    } finally {
      setActionLoading('');
    }
  }

  async function handleRejectCollaborationRequest(requestId: number) {
    if (!rootBuildId || !requestId || actionLoading) return;
    setActionLoading(`reject-request-${requestId}`);
    setRequestActionError('');
    try {
      const result = await rejectBuildCollaborationRequest({
        buildId: rootBuildId,
        requestId
      });
      if (result?.request && showHiddenCollaborationRequests) {
        setCollaborationRequests((current) =>
          current.map((request) =>
            Number(request.id) === Number(requestId)
              ? result.request
              : request
          )
        );
      } else if (result?.success) {
        setCollaborationRequests((current) =>
          current.filter((request) => Number(request.id) !== Number(requestId))
        );
      }
    } catch (error: any) {
      setRequestActionError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to reject collaboration request'
      );
    } finally {
      setActionLoading('');
    }
  }

  async function handleHideCollaborationRequest(requestId: number) {
    if (!rootBuildId || !requestId || actionLoading) return;
    setActionLoading(`hide-request-${requestId}`);
    setRequestActionError('');
    try {
      const result = await hideBuildCollaborationRequest({
        buildId: rootBuildId,
        requestId
      });
      if (result?.success) {
        setCollaborationRequests((current) =>
          current.filter((request) => Number(request.id) !== Number(requestId))
        );
      }
    } catch (error: any) {
      setRequestActionError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to hide collaboration request'
      );
    } finally {
      setActionLoading('');
    }
  }

  async function handleRevokeContributor(contributorUserId: number) {
    if (!rootBuildId || contributorUserId <= 0) return;
    try {
      const result = await revokeBuildContributor({
        buildId: rootBuildId,
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

  async function handleAcceptContributorInvite() {
    const inviteId = Number(myCollaborationRequest?.inviteId || 0);
    if (!rootBuildId || !inviteId || actionLoading) return;
    setActionLoading('accept-invite');
    setRequestActionError('');
    try {
      const result = await acceptBuildContributorInvite({
        buildId: rootBuildId,
        inviteId
      });
      if (result?.build) {
        onBuildPatch(result.build);
      }
      await startContributionFromAcceptedInvite();
    } catch (error: any) {
      setRequestActionError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to accept contributor invite'
      );
    } finally {
      setActionLoading('');
    }
  }

  async function handleDeclineContributorInvite() {
    const inviteId = Number(myCollaborationRequest?.inviteId || 0);
    if (!rootBuildId || !inviteId || actionLoading) return;
    setActionLoading('decline-invite');
    setRequestActionError('');
    try {
      const result = await declineBuildContributorInvite({
        buildId: rootBuildId,
        inviteId
      });
      if (result?.success) {
        setMyCollaborationRequest(null);
      }
    } catch (error: any) {
      setRequestActionError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to decline contributor invite'
      );
    } finally {
      setActionLoading('');
    }
  }

  async function handleStartContribution() {
    if (!rootBuildId || actionLoading) return;
    setActionLoading('start-contribution');
    setRequestActionError('');
    await startContributionFromAcceptedInvite();
    setActionLoading('');
  }

  async function startContributionFromAcceptedInvite() {
    try {
      const result = await createBuildContributionFork(rootBuildId);
      if (result?.success && result?.build?.id) {
        navigate(`/build/${result.build.id}`, {
          state: {
            openPeoplePanel: true
          }
        });
        return;
      }
      setMyCollaborationRequest((current) =>
        current ? { ...current, status: 'accepted' } : current
      );
    } catch (error: any) {
      setMyCollaborationRequest((current) =>
        current ? { ...current, status: 'accepted' } : current
      );
      setRequestActionError(
        error?.response?.data?.error ||
          error?.message ||
          'Invite accepted, but failed to start contribution'
      );
    }
  }

  async function handleSelectContribution(nextContributionBuildId: number) {
    setSelectedContributionId(nextContributionBuildId);
    await reloadContributionDetail(nextContributionBuildId);
    await reloadComments(nextContributionBuildId);
  }

  async function reloadContributionDetail(nextContributionBuildId: number) {
    if (!rootBuildId || !nextContributionBuildId) return;
    setActionError('');
    try {
      const result = await loadBuildContribution({
        buildId: rootBuildId,
        contributionBuildId: nextContributionBuildId
      });
      const nextFiles = Array.isArray(result?.diff?.changedFiles)
        ? result.diff.changedFiles
        : [];
      setSelectedContribution(result?.contribution || null);
      setChangedFiles(nextFiles);
      setSelectedPaths(
        nextFiles.map((file: BuildContributionFileDiff) => file.path)
      );
      setPreviewPath(nextFiles[0]?.path || '');
    } catch (error: any) {
      setActionError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to load contribution'
      );
    }
  }

  async function handleRejectContribution() {
    if (!rootBuildId || !selectedContributionId || actionLoading) return;
    setActionLoading('reject');
    setActionError('');
    try {
      const result = await rejectBuildContribution({
        buildId: rootBuildId,
        contributionBuildId: selectedContributionId
      });
      if (result?.contribution) {
        setSelectedContribution(result.contribution);
        setContributions((current) =>
          current.map((entry) =>
            entry.id === selectedContributionId
              ? { ...entry, ...result.contribution }
              : entry
          )
        );
      }
    } catch (error: any) {
      setActionError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to reject contribution'
      );
    } finally {
      setActionLoading('');
    }
  }

  async function handleMergeContribution() {
    if (!rootBuildId || !selectedContributionId || actionLoading) return;
    setActionLoading('merge');
    setActionError('');
    try {
      const filesReady = onBeforeContributionAction
        ? await onBeforeContributionAction('merge')
        : true;
      if (!filesReady) return;
      const result = await mergeBuildContribution({
        buildId: rootBuildId,
        contributionBuildId: selectedContributionId,
        filePaths: selectedPaths
      });
      if (result?.success) {
        onCanonicalMerge({
          build: result.build || null,
          projectFiles: Array.isArray(result.projectFiles)
            ? result.projectFiles
            : null
        });
        if (result.contribution) {
          setSelectedContribution(result.contribution);
          setContributions((current) =>
            current.map((entry) =>
              entry.id === selectedContributionId
                ? { ...entry, ...result.contribution }
                : entry
            )
          );
        }
        if (result.mergeInProgress) {
          setActionError(
            'Conflict markers were written into the project files. Resolve them with Lumine or edit the files, then complete the merge.'
          );
        }
      }
    } catch (error: any) {
      setActionError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to merge contribution'
      );
    } finally {
      setActionLoading('');
    }
  }

  async function handleCompleteContributionMerge() {
    if (!rootBuildId || !selectedContributionId || actionLoading) return;
    setActionLoading('complete-merge');
    setActionError('');
    try {
      const filesReady = onBeforeContributionAction
        ? await onBeforeContributionAction('merge')
        : true;
      if (!filesReady) return;
      const result = await completeBuildContributionMerge({
        buildId: rootBuildId,
        contributionBuildId: selectedContributionId
      });
      if (result?.code === 'build_contribution_conflict_markers_remaining') {
        const markerPaths = Array.isArray(result.conflictMarkerPaths)
          ? result.conflictMarkerPaths
          : [];
        setActionError(
          markerPaths.length > 0
            ? `Resolve conflict markers in ${markerPaths.join(', ')} first.`
            : 'Resolve all conflict markers before completing this merge.'
        );
        return;
      }
      if (result?.success) {
        onCanonicalMerge({
          build: result.build || null,
          projectFiles: Array.isArray(result.projectFiles)
            ? result.projectFiles
            : null
        });
        if (result.contribution) {
          setSelectedContribution(result.contribution);
          setContributions((current) =>
            current.map((entry) =>
              entry.id === selectedContributionId
                ? { ...entry, ...result.contribution }
                : entry
            )
          );
        }
      }
    } catch (error: any) {
      const markerPaths = error?.response?.data?.conflictMarkerPaths;
      setActionError(
        Array.isArray(markerPaths) && markerPaths.length > 0
          ? `Resolve conflict markers in ${markerPaths.join(', ')} first.`
          : error?.response?.data?.error ||
              error?.message ||
              'Failed to complete contribution merge'
      );
    } finally {
      setActionLoading('');
    }
  }

  async function reloadComments(nextContributionBuildId: number) {
    if (!rootBuildId) return;
    try {
      const result = await loadBuildContributionComments({
        buildId: rootBuildId,
        contributionBuildId: nextContributionBuildId || null
      });
      setComments(Array.isArray(result?.comments) ? result.comments : []);
    } catch (error) {
      console.error('Failed to load build contribution comments:', error);
    }
  }

  async function handlePostComment() {
    if (!rootBuildId || !commentInput.trim() || commentLoading) return;
    setCommentLoading(true);
    setCommentError('');
    try {
      const result = await createBuildContributionComment({
        buildId: rootBuildId,
        contributionBuildId:
          selectedContributionId || contributionBuildId || null,
        body: commentInput.trim()
      });
      if (result?.comment) {
        setComments((current) => [...current, result.comment]);
        setCommentInput('');
      }
    } catch (error: any) {
      setCommentError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to post comment'
      );
    } finally {
      setCommentLoading(false);
    }
  }

  async function handleDeleteComment(commentId: number) {
    if (!rootBuildId) return;
    try {
      const result = await deleteBuildContributionComment({
        buildId: rootBuildId,
        commentId
      });
      if (result?.success) {
        setComments((current) =>
          current.filter((comment) => comment.id !== commentId)
        );
      }
    } catch (error) {
      console.error('Failed to delete contribution comment:', error);
    }
  }

  function toggleSelectedPath(path: string) {
    setSelectedPaths((current) =>
      current.includes(path)
        ? current.filter((entry) => entry !== path)
        : [...current, path]
    );
  }

  function renderContributionDetail(ownerReview: boolean) {
    const activeContribution = selectedContribution || build;
    const contributionStatus = normalizeContributionStatus(
      activeContribution.contributionStatus
    );
    return (
      <div className={detailClass}>
        <div className={rowClass}>
          <strong>
            {ownerReview ? 'Review contribution' : 'Changed files'}
          </strong>
          <span className={mutedTextClass}>{changedFiles.length} changed</span>
          <span className={statusPillClass}>{contributionStatus}</span>
        </div>
        {changedFiles.length === 0 ? (
          <span className={mutedTextClass}>No file changes loaded.</span>
        ) : (
          <>
            <div className={fileListClass}>
              {changedFiles.map((file) => (
                <label key={file.path} className={fileRowClass}>
                  <input
                    type="checkbox"
                    checked={selectedPaths.includes(file.path)}
                    disabled={
                      !ownerReview || contributionStatus !== 'submitted'
                    }
                    onChange={() => toggleSelectedPath(file.path)}
                  />
                  <strong>{file.status}</strong>
                  <button
                    type="button"
                    className={css`
                      border: 0;
                      background: transparent;
                      color: inherit;
                      padding: 0;
                      text-align: left;
                      min-width: 0;
                      cursor: pointer;
                    `}
                    onClick={() => setPreviewPath(file.path)}
                  >
                    <span className={filePathClass}>{file.path}</span>
                  </button>
                  {file.mergeStatus === 'conflict' ? (
                    <span className={conflictBadgeClass}>conflict</span>
                  ) : null}
                </label>
              ))}
            </div>
            {selectedPreviewFile ? (
              <div className={diffPreviewClass}>
                <pre className={codePreviewClass}>
                  {selectedPreviewFile.currentContent ?? ''}
                </pre>
                <pre className={codePreviewClass}>
                  {selectedPreviewFile.contributionContent ?? ''}
                </pre>
              </div>
            ) : null}
          </>
        )}
        {ownerReview && contributionStatus === 'submitted' ? (
          <div className={rowClass}>
            <GameCTAButton
              variant="success"
              size="sm"
              icon="check"
              loading={actionLoading === 'merge'}
              disabled={Boolean(actionLoading) || selectedPaths.length === 0}
              onClick={handleMergeContribution}
            >
              Merge Selected
            </GameCTAButton>
            <GameCTAButton
              variant="neutral"
              size="sm"
              icon="ban"
              loading={actionLoading === 'reject'}
              disabled={Boolean(actionLoading)}
              onClick={handleRejectContribution}
            >
              Reject
            </GameCTAButton>
          </div>
        ) : null}
        {ownerReview && contributionStatus === 'merging' ? (
          <div className={rowClass}>
            <span className={mutedTextClass}>
              Conflict markers are in the project files. Resolve them with
              Lumine or edit the files, then complete the merge.
            </span>
            <GameCTAButton
              variant="success"
              size="sm"
              icon="check"
              loading={actionLoading === 'complete-merge'}
              disabled={Boolean(actionLoading)}
              onClick={handleCompleteContributionMerge}
            >
              Complete Merge
            </GameCTAButton>
          </div>
        ) : null}
        {actionError ? <span className={errorClass}>{actionError}</span> : null}
      </div>
    );
  }

  function renderComments() {
    return (
      <div className={detailClass}>
        <div className={rowClass}>
          <strong>Comments</strong>
          <span className={mutedTextClass}>{comments.length}</span>
        </div>
        <div className={commentListClass}>
          {comments.length === 0 ? (
            <span className={mutedTextClass}>No comments yet.</span>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className={commentClass}>
                <div className={commentHeaderClass}>
                  <span>{comment.username || 'User'}</span>
                  {Number(comment.userId) === Number(userId) ||
                  canModerateContributionComments ? (
                    <GameCTAButton
                      variant="neutral"
                      size="sm"
                      icon="trash-alt"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      Delete
                    </GameCTAButton>
                  ) : null}
                </div>
                <div className={commentBodyClass}>{comment.body}</div>
              </div>
            ))
          )}
        </div>
        <textarea
          className={textareaClass}
          value={commentInput}
          onChange={(event) => setCommentInput(event.target.value)}
          placeholder="Add a comment"
        />
        <div className={commentActionsClass}>
          {commentError ? (
            <span className={errorClass}>{commentError}</span>
          ) : null}
          <GameCTAButton
            variant="logoBlue"
            size="sm"
            icon="comment"
            loading={commentLoading}
            disabled={!commentInput.trim() || commentLoading}
            onClick={handlePostComment}
          >
            Post
          </GameCTAButton>
        </div>
      </div>
    );
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

function normalizeContributionStatus(value: unknown): BuildContributionStatus {
  const normalized = String(value || '').trim();
  if (
    normalized === 'draft' ||
    normalized === 'submitted' ||
    normalized === 'merging' ||
    normalized === 'merged' ||
    normalized === 'rejected' ||
    normalized === 'withdrawn'
  ) {
    return normalized;
  }
  return 'none';
}

function formatShortTimestamp(value: unknown) {
  const timestamp = Number(value || 0);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return '';
  return new Date(timestamp * 1000).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

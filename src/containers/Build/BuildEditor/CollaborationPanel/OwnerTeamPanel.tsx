import React from 'react';
import { css } from '@emotion/css';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import ContributorInvitePicker from '../ContributorInvitePicker';
import type {
  BuildCollaborationMode,
  BuildCollaborationRequest,
  BuildContributorInvite,
  BuildLike
} from './types';

const detailClass = css`
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  background: #fff;
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
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
  font-size: 1.1rem;
  font-weight: 700;
`;

const listClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
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
  font-size: 1.1rem;
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
  font-size: 1.1rem;
  font-weight: 900;
  line-height: 1.25;
`;

const collaborationPromptTextClass = css`
  color: var(--chat-text);
  opacity: 0.72;
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.35;
`;

const collaborationPromptActionClass = css`
  display: flex;
  justify-content: center;
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
  font-size: 1.1rem;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
`;

const errorClass = css`
  color: #be123c;
  font-weight: 800;
  font-size: 1.1rem;
`;

function normalizeCollaborationMode(value: unknown): BuildCollaborationMode {
  return value === 'open_source' ? value : 'private';
}

function CollaborationPromptCard({
  build,
  onOpenCollaborationSettings
}: {
  build: BuildLike;
  onOpenCollaborationSettings?: () => void;
}) {
  const mode = normalizeCollaborationMode(build.collaborationMode);
  const isPrivate = mode === 'private';
  const isOpenSource = mode === 'open_source';
  const title = isPrivate
    ? 'This project is private.'
    : isOpenSource
      ? 'This project is open source.'
      : 'This project uses invite-only teams.';
  const description = isPrivate
    ? 'Invite team members to discuss and help in the team workspace.'
    : isOpenSource
      ? 'People can fork published copies, and invited team members can still help with this original project.'
      : 'Invited team members can create project branches, discuss changes, and send them back for review.';
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
            {isPrivate ? 'Set Up Team' : 'Manage Settings'}
          </GameCTAButton>
        </div>
      ) : null}
    </div>
  );
}

export default function OwnerTeamPanel({
  acceptedContributorCount,
  actionLoading,
  build,
  canInviteContributors,
  collaborationRequests,
  contributors,
  contributorsCardShown,
  loadingCollaborationRequests,
  requestActionError,
  rootBuildId,
  showHiddenCollaborationRequests,
  showPrompt = true,
  onAcceptRequest,
  onHideRequest,
  onInvited,
  onOpenCollaborationSettings,
  onRejectRequest,
  onRemoveContributor,
  onToggleHiddenRequests
}: {
  acceptedContributorCount: number;
  actionLoading: string;
  build: BuildLike;
  canInviteContributors: boolean;
  collaborationRequests: BuildCollaborationRequest[];
  contributors: BuildContributorInvite[];
  contributorsCardShown: boolean;
  loadingCollaborationRequests: boolean;
  requestActionError: string;
  rootBuildId: number;
  showHiddenCollaborationRequests: boolean;
  showPrompt?: boolean;
  onAcceptRequest: (requestId: number) => void;
  onHideRequest: (requestId: number) => void;
  onInvited: () => void;
  onOpenCollaborationSettings?: () => void;
  onRejectRequest: (requestId: number) => void;
  onRemoveContributor: (userId: number) => void;
  onToggleHiddenRequests: () => void;
}) {
  return (
    <>
      <div className={detailClass}>
        <div className={rowClass}>
          <strong>
            {showHiddenCollaborationRequests
              ? 'Hidden join requests'
              : 'Join requests'}
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
            onClick={onToggleHiddenRequests}
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
          <div className={listClass}>
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
                      onClick={() => onAcceptRequest(request.id)}
                    >
                      Accept
                    </GameCTAButton>
                    <GameCTAButton
                      variant="neutral"
                      size="sm"
                      icon="ban"
                      loading={actionLoading === `reject-request-${request.id}`}
                      disabled={Boolean(actionLoading)}
                      onClick={() => onRejectRequest(request.id)}
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
                        onClick={() => onHideRequest(request.id)}
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
      {showPrompt && acceptedContributorCount === 0 ? (
        <CollaborationPromptCard
          build={build}
          onOpenCollaborationSettings={onOpenCollaborationSettings}
        />
      ) : null}
      {contributorsCardShown ? (
        <div className={detailClass}>
          <div className={rowClass}>
            <strong>Team members</strong>
          </div>
          <ContributorInvitePicker
            buildId={rootBuildId}
            canInvite={canInviteContributors}
            contributors={contributors}
            onInvited={onInvited}
            onRemoveContributor={onRemoveContributor}
          />
        </div>
      ) : null}
    </>
  );
}

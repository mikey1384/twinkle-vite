import React, { useState } from 'react';
import { css } from '@emotion/css';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import TagForm from '~/components/Forms/TagForm';
import Icon from '~/components/Icon';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import ProfilePic from '~/components/ProfilePic';
import { Color } from '~/constants/css';
import { useAppContext, useKeyContext } from '~/contexts';

interface BuildContributorInvite {
  userId: number;
  username?: string | null;
  profilePicUrl?: string | null;
  acceptedAt?: number | null;
}

interface UserSearchResult {
  id: number;
  username: string;
  realName?: string | null;
  title: string;
}

interface BuildContributorInvitePickerProps {
  buildId: number;
  canInvite?: boolean;
  contributors: BuildContributorInvite[];
  confirmModalOverModal?: boolean;
  confirmModalLevel?: number;
  onInvited: () => Promise<void> | void;
  onRemoveContributor?: (userId: number) => Promise<void> | void;
}

const invitePickerClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const inviteFormClass = css`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  @media (max-width: 520px) {
    flex-direction: column;
    align-items: stretch;
    button {
      align-self: flex-end;
    }
  }
`;

const inviteTagFormClass = css`
  flex: 1;
  min-width: 0;
`;

const inviteButtonWrapClass = css`
  flex: 0 0 auto;
  @media (max-width: 520px) {
    align-self: flex-end;
    margin-top: 0;
  }
`;

const errorClass = css`
  color: #be123c;
  font-weight: 800;
  font-size: 0.9rem;
`;

const collaboratorListClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`;

const collaboratorSectionTitleClass = css`
  color: ${Color.darkGray()};
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0.03em;
  text-transform: uppercase;
`;

const collaboratorRowClass = css`
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 8px;
  background: #fff;
  min-height: 3.6rem;
  padding: 0.55rem 0.65rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
`;

const collaboratorIdentityClass = css`
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.7rem;
`;

const collaboratorNameClass = css`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${Color.darkerGray()};
  font-size: 1rem;
  font-weight: 900;
`;

const pendingLabelClass = css`
  color: ${Color.gray()};
  font-size: 0.82rem;
  font-weight: 800;
`;

const emptyClass = css`
  color: ${Color.darkGray()};
  font-size: 0.9rem;
  font-weight: 700;
`;

const removeButtonClass = css`
  flex: 0 0 auto;
  width: 2.4rem;
  height: 2.4rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: ${Color.red()};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.1rem;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
  &:hover:not(:disabled) {
    background: ${Color.red(0.1)};
  }
  &:disabled {
    cursor: default;
    opacity: 0.45;
  }
`;

export default function BuildContributorInvitePicker({
  buildId,
  canInvite = true,
  confirmModalLevel,
  confirmModalOverModal = false,
  contributors,
  onInvited,
  onRemoveContributor
}: BuildContributorInvitePickerProps) {
  const searchUsers = useAppContext((v) => v.requestHelpers.searchUsers);
  const inviteBuildContributor = useAppContext(
    (v) => v.requestHelpers.inviteBuildContributor
  );
  const myId = useKeyContext((v) => v.myState.userId);
  const [searchedUsers, setSearchedUsers] = useState<UserSearchResult[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserSearchResult[]>([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [contributorToRemove, setContributorToRemove] =
    useState<BuildContributorInvite | null>(null);
  const [removingContributorUserId, setRemovingContributorUserId] = useState(0);
  const acceptedContributors = contributors.filter(
    (contributor) => Number(contributor.acceptedAt || 0) > 0
  );
  const pendingContributors = contributors.filter(
    (contributor) => Number(contributor.acceptedAt || 0) <= 0
  );
  const contributorToRemoveName = contributorToRemove
    ? contributorToRemove.username || `User ${contributorToRemove.userId}`
    : '';
  const contributorToRemoveAccepted =
    Number(contributorToRemove?.acceptedAt || 0) > 0;

  return (
    <>
      <div className={invitePickerClass}>
        {canInvite ? (
          <div className={inviteFormClass}>
            <TagForm
              className={inviteTagFormClass}
              itemLabel="username"
              searchResults={searchedUsers}
              filter={(result) =>
                Number(result.id) !== Number(myId) &&
                !contributors.some(
                  (contributor) =>
                    Number(contributor.userId) === Number(result.id)
                )
              }
              onSearch={handleUserSearch}
              onClear={() => setSearchedUsers([])}
              onAddItem={handleAddUser}
              onRemoveItem={handleRemoveUser}
              onSubmit={
                selectedUsers.length > 0 ? handleInviteContributors : undefined
              }
              renderDropdownLabel={(item) => (
                <span>
                  {item.username}{' '}
                  {item.realName ? (
                    <small>{`(${item.realName})`}</small>
                  ) : null}
                </span>
              )}
              searchInputFontSize="1.35rem"
              searchInputHeight="3.4rem"
              searchInputTopMargin="0"
              searchPlaceholder="Search by username"
              selectedItems={selectedUsers}
            />
            <div className={inviteButtonWrapClass}>
              <GameCTAButton
                variant="success"
                size="sm"
                icon="user-plus"
                loading={inviteLoading}
                disabled={selectedUsers.length === 0 || inviteLoading}
                onClick={handleInviteContributors}
              >
                Invite
              </GameCTAButton>
            </div>
          </div>
        ) : null}
        {inviteError ? <span className={errorClass}>{inviteError}</span> : null}
        {contributors.length === 0 ? (
          <span className={emptyClass}>No collaborators yet.</span>
        ) : (
          <>
            {acceptedContributors.length > 0 ? (
              <div className={collaboratorListClass}>
                <div className={collaboratorSectionTitleClass}>
                  Collaborators
                </div>
                {acceptedContributors.map((contributor) =>
                  renderContributorRow(contributor)
                )}
              </div>
            ) : null}
            {pendingContributors.length > 0 ? (
              <div className={collaboratorListClass}>
                <div className={collaboratorSectionTitleClass}>
                  Pending invitations
                </div>
                {pendingContributors.map((contributor) =>
                  renderContributorRow(contributor, 'Invited')
                )}
              </div>
            ) : null}
          </>
        )}
      </div>
      {contributorToRemove ? (
        <ConfirmModal
          modalOverModal={confirmModalOverModal}
          modalLevel={confirmModalLevel}
          title={
            contributorToRemoveAccepted
              ? 'Remove Collaborator'
              : 'Cancel Invitation'
          }
          description={
            <div style={{ textAlign: 'center', lineHeight: 1.45 }}>
              {contributorToRemoveAccepted ? (
                <>
                  Remove <b>{contributorToRemoveName}</b> from this Build's
                  collaborators?
                </>
              ) : (
                <>
                  Cancel the invitation for <b>{contributorToRemoveName}</b>?
                </>
              )}
            </div>
          }
          descriptionFontSize="1.65rem"
          confirmButtonColor="red"
          confirmButtonLabel={
            contributorToRemoveAccepted ? 'Remove' : 'Cancel Invite'
          }
          onHide={() => setContributorToRemove(null)}
          onConfirm={() =>
            handleRemoveContributor(Number(contributorToRemove.userId))
          }
        />
      ) : null}
    </>
  );

  function handleAddUser(user: UserSearchResult) {
    if (Number(user.id) === Number(myId)) {
      setInviteError('Owner is already a contributor');
      return;
    }
    setSelectedUsers((current) => [...current, user]);
  }

  function handleRemoveUser(userId: number) {
    setSelectedUsers((current) =>
      current.filter((user) => Number(user.id) !== Number(userId))
    );
  }

  async function handleUserSearch(text: string) {
    const users = await searchUsers(text);
    setSearchedUsers(
      Array.isArray(users)
        ? users
            .filter((user) => Number(user.id) !== Number(myId))
            .map((user) => ({
              ...user,
              title: user.username
            }))
        : []
    );
  }

  async function handleInviteContributors() {
    if (!buildId || selectedUsers.length === 0 || inviteLoading) return;
    const usersToInvite = selectedUsers.filter(
      (user) => Number(user.id) !== Number(myId)
    );
    if (usersToInvite.length === 0) {
      setSelectedUsers([]);
      setInviteError('Owner is already a contributor');
      return;
    }
    setInviteLoading(true);
    setInviteError('');
    try {
      for (const user of usersToInvite) {
        await inviteBuildContributor({
          buildId,
          userId: Number(user.id)
        });
      }
      setSelectedUsers([]);
      setSearchedUsers([]);
      await onInvited();
    } catch (error: any) {
      setInviteError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to invite contributor'
      );
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleRemoveContributor(userId: number) {
    if (!onRemoveContributor || removingContributorUserId) return;
    setRemovingContributorUserId(userId);
    try {
      await onRemoveContributor(userId);
      setContributorToRemove(null);
    } finally {
      setRemovingContributorUserId(0);
    }
  }

  function renderContributorRow(
    contributor: BuildContributorInvite,
    status?: string
  ) {
    const userId = Number(contributor.userId);
    return (
      <div key={userId} className={collaboratorRowClass}>
        <div className={collaboratorIdentityClass}>
          <ProfilePic
            userId={userId}
            profilePicUrl={contributor.profilePicUrl || undefined}
            size="2.5rem"
          />
          <span className={collaboratorNameClass}>
            {contributor.username || `User ${userId}`}
          </span>
          {status ? <span className={pendingLabelClass}>{status}</span> : null}
        </div>
        {onRemoveContributor ? (
          <button
            type="button"
            className={removeButtonClass}
            aria-label={`Remove ${contributor.username || `User ${userId}`}`}
            disabled={Boolean(removingContributorUserId)}
            onClick={() => setContributorToRemove(contributor)}
          >
            <Icon
              icon={removingContributorUserId === userId ? 'spinner' : 'times'}
              pulse={removingContributorUserId === userId}
            />
          </button>
        ) : null}
      </div>
    );
  }
}

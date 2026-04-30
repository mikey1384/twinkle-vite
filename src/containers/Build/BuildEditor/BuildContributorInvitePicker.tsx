import React, { useState } from 'react';
import { css } from '@emotion/css';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import TagForm from '~/components/Forms/TagForm';
import { useAppContext, useKeyContext } from '~/contexts';

interface BuildContributorInvite {
  userId: number;
  username?: string | null;
  profilePicUrl?: string | null;
}

interface UserSearchResult {
  id: number;
  username: string;
  realName?: string | null;
  title: string;
}

interface BuildContributorInvitePickerProps {
  buildId: number;
  contributors: BuildContributorInvite[];
  onInvited: () => Promise<void> | void;
}

const invitePickerClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`;

const inviteFormClass = css`
  width: 100%;
  display: flex;
  align-items: flex-start;
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
  margin-top: 1rem;
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

export default function BuildContributorInvitePicker({
  buildId,
  contributors,
  onInvited
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

  return (
    <div className={invitePickerClass}>
      <div className={inviteFormClass}>
        <TagForm
          className={inviteTagFormClass}
          itemLabel="username"
          searchResults={searchedUsers}
          filter={(result) =>
            Number(result.id) !== Number(myId) &&
            !contributors.some(
              (contributor) => Number(contributor.userId) === Number(result.id)
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
              {item.realName ? <small>{`(${item.realName})`}</small> : null}
            </span>
          )}
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
      {inviteError ? <span className={errorClass}>{inviteError}</span> : null}
    </div>
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
}

import React, { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import TagForm from '~/components/Forms/TagForm';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';

export default function InviteUsersModal({
  isOwner,
  selectedChannelId,
  onDone,
  onHide,
  currentChannel
}: {
  isOwner: boolean;
  currentChannel: any;
  onDone: (data: any) => void;
  onHide: () => void;
  selectedChannelId: number;
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const inviteUsersToChannel = useAppContext(
    (v) => v.requestHelpers.inviteUsersToChannel
  );
  const searchUserToInvite = useAppContext(
    (v) => v.requestHelpers.searchUserToInvite
  );
  const userSearchResults = useChatContext((v) => v.state.userSearchResults);
  const onClearUserSearchResults = useChatContext(
    (v) => v.actions.onClearUserSearchResults
  );
  const onInviteUsersToChannel = useChatContext(
    (v) => v.actions.onInviteUsersToChannel
  );
  const onSearchUserToInvite = useChatContext(
    (v) => v.actions.onSearchUserToInvite
  );
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [inviting, setInviting] = useState(false);

  return (
    <Modal wrapped onHide={onHide}>
      <header>Invite people to this channel</header>
      <main>
        <TagForm
          autoFocus
          title="Invite People"
          itemLabel="username"
          searchResults={userSearchResults}
          filter={(result) => !currentChannel.allMemberIds.includes(result.id)}
          onSearch={(text) =>
            handleSearchUserToInvite({
              channelId: selectedChannelId,
              searchText: text
            })
          }
          onClear={onClearUserSearchResults}
          onAddItem={onAddUser}
          onRemoveItem={onRemoveUser}
          onSubmit={selectedUsers.length > 0 ? handleDone : undefined}
          renderDropdownLabel={(item) => (
            <span>
              {item.username}{' '}
              {item.realName && <small>{`(${item.realName})`}</small>}
            </span>
          )}
          searchPlaceholder="Search for people you want to chat with"
          selectedItems={selectedUsers}
          style={{ width: '80%' }}
        />
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          Cancel
        </Button>
        <Button
          color={doneColor}
          onClick={handleDone}
          disabled={selectedUsers.length === 0 || inviting}
        >
          Invite
        </Button>
      </footer>
    </Modal>
  );

  function onAddUser(user: any) {
    setSelectedUsers(selectedUsers.concat(user));
  }

  function onRemoveUser(userId: number) {
    setSelectedUsers(
      selectedUsers.filter((user: { id: number }) => user.id !== userId)
    );
  }

  async function handleDone() {
    if (!inviting) {
      setInviting(true);
      if (currentChannel.isClass && isOwner) {
        const data = await inviteUsersToChannel({
          selectedUsers,
          channelId: selectedChannelId
        });
        onInviteUsersToChannel(data);
        onDone({
          users: selectedUsers,
          message: data.message,
          isClass: true
        });
      } else {
        onDone({
          users: selectedUsers
        });
      }
    }
  }

  async function handleSearchUserToInvite({
    channelId,
    searchText
  }: {
    channelId: number;
    searchText: string;
  }) {
    const data = await searchUserToInvite({ channelId, searchText });
    onSearchUserToInvite(data);
  }
}

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import TagForm from '~/components/Forms/TagForm';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';

InviteUsersModal.propTypes = {
  currentChannel: PropTypes.object.isRequired,
  onDone: PropTypes.func.isRequired,
  onHide: PropTypes.func.isRequired,
  selectedChannelId: PropTypes.number.isRequired
};

export default function InviteUsersModal({
  selectedChannelId,
  onDone,
  onHide,
  currentChannel
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
  const currentMembersUID = currentChannel.members.map((member) => member.id);

  return (
    <Modal onHide={onHide}>
      <header>Invite people to this channel</header>
      <main>
        <TagForm
          autoFocus
          title="Invite People"
          itemLabel="username"
          searchResults={userSearchResults}
          filter={(result) => !currentMembersUID.includes(result.id)}
          onSearch={handleSearchUserToInvite}
          onClear={onClearUserSearchResults}
          onAddItem={onAddUser}
          onRemoveItem={onRemoveUser}
          onSubmit={selectedUsers.length > 0 && handleDone}
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

  function onAddUser(user) {
    setSelectedUsers(selectedUsers.concat([user]));
  }

  function onRemoveUser(userId) {
    setSelectedUsers(selectedUsers.filter((user) => user.id !== userId));
  }

  async function handleDone() {
    if (!inviting) {
      setInviting(true);
      if (currentChannel.isClass) {
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

  async function handleSearchUserToInvite(text) {
    const data = await searchUserToInvite(text);
    onSearchUserToInvite(data);
  }
}

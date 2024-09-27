import React, { useMemo, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import TagForm from '~/components/Forms/TagForm';
import Input from '~/components/Texts/Input';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { socket } from '~/constants/sockets/api';
import { mobileMaxWidth } from '~/constants/css';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { useNavigate } from 'react-router-dom';
import localize from '~/constants/localize';

const addMembersOfClassLabel = localize('addMembersOfClass');
const enterClassNameLabel = localize('enterClassName');
const membersLabel = localize('members');
const nameLabel = localize('name');
const newClassroomLabel = localize('newClassroomChat');

export default function ClassroomChatForm({
  channelId,
  onBackClick,
  onHide
}: {
  channelId?: number;
  onBackClick?: () => void;
  onHide: () => void;
}) {
  const navigate = useNavigate();
  const createNewChat = useAppContext((v) => v.requestHelpers.createNewChat);
  const searchUserToInvite = useAppContext(
    (v) => v.requestHelpers.searchUserToInvite
  );
  const userSearchResults = useChatContext((v) => v.state.userSearchResults);
  const onClearUserSearchResults = useChatContext(
    (v) => v.actions.onClearUserSearchResults
  );
  const onCreateNewChannel = useChatContext(
    (v) => v.actions.onCreateNewChannel
  );
  const onSearchUserToInvite = useChatContext(
    (v) => v.actions.onSearchUserToInvite
  );
  const { userId } = useKeyContext((v) => v.myState);
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const [creatingChat, setCreatingChat] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<{ id: number }[]>([]);
  const disabled = useMemo(
    () =>
      creatingChat || stringIsEmpty(channelName) || selectedUsers.length === 0,
    [channelName, creatingChat, selectedUsers.length]
  );

  return (
    <ErrorBoundary componentPath="CreateNewChat/TeacherMenu/ClassroomChatForm">
      <header>{newClassroomLabel}</header>
      <main>
        <div
          className={css`
            width: 80%;
            @media (max-width: ${mobileMaxWidth}) {
              width: 100%;
            }
          `}
        >
          <h3>{nameLabel}</h3>
          <Input
            autoFocus
            style={{ marginTop: '1rem' }}
            placeholder={enterClassNameLabel}
            maxLength="150"
            value={channelName}
            onChange={setChannelName}
          />
        </div>
        <TagForm
          title={membersLabel}
          itemLabel="username"
          searchResults={userSearchResults}
          filter={(result) => result.id !== userId}
          onSearch={(text) =>
            handleSearchUserToInvite({ channelId, searchText: text })
          }
          onClear={onClearUserSearchResults}
          onAddItem={onAddUser}
          onRemoveItem={onRemoveUser}
          renderDropdownLabel={(item) => (
            <span>
              {item.username}{' '}
              {item.realName && <small>{`(${item.realName})`}</small>}
            </span>
          )}
          searchPlaceholder={addMembersOfClassLabel}
          selectedItems={selectedUsers}
          style={{ marginTop: '1.5rem' }}
          className={css`
            width: 80%;
            @media (max-width: ${mobileMaxWidth}) {
              width: 100%;
            }
          `}
        />
      </main>
      <footer>
        <Button
          style={{ marginRight: '0.7rem' }}
          transparent
          onClick={onBackClick || onHide}
        >
          {onBackClick ? 'Back' : 'Cancel'}
        </Button>
        <Button color={doneColor} onClick={handleDone} disabled={disabled}>
          Create
        </Button>
      </footer>
    </ErrorBoundary>
  );

  async function handleSearchUserToInvite({
    channelId,
    searchText
  }: {
    channelId?: number;
    searchText: string;
  }) {
    const data = await searchUserToInvite({ channelId, searchText });
    onSearchUserToInvite(data);
  }

  function onAddUser(user: { id: number }) {
    setSelectedUsers((prevSelectedUsers) => prevSelectedUsers.concat([user]));
  }

  function onRemoveUser(userId: number) {
    setSelectedUsers((prevSelectedUsers) =>
      prevSelectedUsers.filter((user) => user.id !== userId)
    );
  }

  async function handleDone() {
    setCreatingChat(true);
    const { message, members, pathId } = await createNewChat({
      userId,
      channelName,
      isClass: true,
      isClosed: true,
      selectedUsers
    });
    onCreateNewChannel({
      message,
      isClass: true,
      isClosed: true,
      members,
      pathId
    });
    const users = selectedUsers.map((user) => user.id);
    socket.emit('join_chat_group', message.channelId);
    socket.emit('send_group_chat_invitation', users, {
      message,
      isClass: true,
      isClosed: true,
      members,
      pathId
    });
    navigate(`/chat/${pathId}`);
    onHide();
  }
}

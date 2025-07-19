import React, { useMemo } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import RoundList from '~/components/RoundList';
import Icon from '~/components/Icon';
import ProfilePic from '~/components/ProfilePic';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { Color } from '~/constants/css';
import { useNavigate } from 'react-router-dom';
import { User } from '~/types';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';

export default function UserListModal({
  description = '',
  descriptionColor = Color.green(),
  descriptionShown,
  loadMoreButtonShown,
  loading,
  loadingMore,
  modalOverModal,
  onHide,
  onLoadMore = () => null,
  title,
  users
}: {
  description?: string;
  descriptionColor?: string;
  descriptionShown?: ((v: User) => boolean) | boolean;
  loadMoreButtonShown?: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  modalOverModal?: boolean;
  onHide: () => void;
  onLoadMore?: () => void;
  title?: any;
  users: Array<{
    id: number;
    username: string;
    profilePicUrl: string;
  }>;
}) {
  const chatStatus = useChatContext((v) => v.state.chatStatus);
  const reportError = useAppContext((v) => v.requestHelpers.reportError);
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);
  const username = useKeyContext((v) => v.myState.username);
  const profilePicUrl = useKeyContext((v) => v.myState.profilePicUrl);
  const loadDMChannel = useAppContext((v) => v.requestHelpers.loadDMChannel);
  const onUpdateSelectedChannelId = useChatContext(
    (v) => v.actions.onUpdateSelectedChannelId
  );
  const onOpenNewChatTab = useChatContext((v) => v.actions.onOpenNewChatTab);
  const allUsers = useMemo(() => {
    const otherUsers = users.filter((user) => user.id !== userId);
    const userArray = [];
    for (let i = 0; i < users.length; i++) {
      if (users[i].id === userId) userArray.push(users[i]);
    }
    return userArray.concat(otherUsers);
  }, [userId, users]);

  return (
    <Modal modalOverModal={modalOverModal} small onHide={onHide}>
      <header>{title}</header>
      <main style={{ paddingTop: 0 }}>
        <RoundList>
          {loading ? (
            <Loading />
          ) : (
            allUsers.map((user) => {
              const userStatusDisplayed =
                typeof descriptionShown === 'function'
                  ? descriptionShown(user)
                  : user.id === userId;
              return (
                <nav
                  key={user.id}
                  style={{
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div>
                      <ProfilePic
                        style={{
                          width: '3rem',
                          cursor: 'pointer'
                        }}
                        userId={user.id}
                        profilePicUrl={user.profilePicUrl}
                        online={
                          chatStatus[user.id]?.isAway ||
                          chatStatus[user.id]?.isOnline ||
                          chatStatus[user.id]?.isBusy
                        }
                        onClick={() => navigate(`/users/${user.username}`)}
                        statusShown
                      />
                    </div>
                    <div style={{ marginLeft: '1rem' }}>
                      <b>{user.username}</b>{' '}
                      <span
                        style={{
                          color: descriptionColor,
                          fontWeight: 'bold'
                        }}
                      >
                        {userStatusDisplayed ? description : null}
                      </span>
                    </div>
                  </div>
                  {userId && user.id !== userId && (
                    <div style={{ display: 'flex' }}>
                      <Button
                        color="logoBlue"
                        filled
                        style={{ fontSize: '1.5rem', marginRight: '1rem' }}
                        onClick={() => navigate(`/users/${user.username}`)}
                      >
                        <Icon icon="user" />
                      </Button>
                      <Button
                        color="green"
                        filled
                        style={{ fontSize: '1.5rem' }}
                        onClick={() => handleTalkClick(user)}
                      >
                        <Icon icon="comments" />
                      </Button>
                    </div>
                  )}
                </nav>
              );
            })
          )}
          {loadMoreButtonShown && (
            <LoadMoreButton
              style={{ marginTop: '1.5rem' }}
              filled
              loading={loadingMore}
              onClick={onLoadMore}
            />
          )}
        </RoundList>
      </main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );

  async function handleTalkClick(user: {
    id: number;
    username: string;
    profilePicUrl: string;
  }) {
    if (user.id !== userId) {
      const { channelId, pathId } = await loadDMChannel({ recipient: user });
      if (!pathId) {
        if (!user?.id) {
          return reportError({
            componentPath: 'Modals/UserListModal',
            message: `handleTalkClick: recipient userId is null. recipient: ${JSON.stringify(
              user
            )}`
          });
        }
        onOpenNewChatTab({
          user: { username, id: userId, profilePicUrl },
          recipient: {
            username: user.username,
            id: user.id,
            profilePicUrl: user.profilePicUrl
          }
        });
        onUpdateSelectedChannelId(channelId);
      }
      setTimeout(() => navigate(pathId ? `/chat/${pathId}` : `/chat/new`), 0);
    }
  }
}

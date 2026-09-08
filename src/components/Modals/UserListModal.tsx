import React, { useEffect, useMemo, useRef, useState } from 'react';
import readWithTimeout from '~/helpers/readWithTimeout';
import Modal from '~/components/Modal';
import LegacyModalLayout from '~/components/Modal/LegacyModalLayout';
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
  emptyMessage = 'No users found.',
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
  emptyMessage?: string;
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
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);
  const username = useKeyContext((v) => v.myState.username);
  const profilePicUrl = useKeyContext((v) => v.myState.profilePicUrl);
  const [pendingUser, setPendingUser] = useState<number | null>(null);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const version = useRef(0);
  const currentUser = useRef(userId);
  currentUser.current = userId;
  useEffect(() => {
    pending.current = false;
    setPendingUser(null);
    setError('');
    return () => {
      version.current++;
    };
  }, [userId]);
  function close() {
    version.current++;
    onHide();
  }
  const loadDMChannel = useAppContext((v) => v.requestHelpers.loadDMChannel);
  const onUpdateSelectedChannelId = useChatContext(
    (v) => v.actions.onUpdateSelectedChannelId
  );
  const onOpenNewChatTab = useChatContext((v) => v.actions.onOpenNewChatTab);
  const allUsers = useMemo(() => {
    if (!users) return [];
    const otherUsers = users.filter((user) => user.id !== userId);
    const userArray = [];
    for (let i = 0; i < users.length; i++) {
      if (users[i].id === userId) userArray.push(users[i]);
    }
    return userArray.concat(otherUsers);
  }, [userId, users]);

  return (
    <Modal
      modalKey="UserListModal"
      isOpen
      size="sm"
      onClose={close}
      aria-label={typeof title === 'string' ? title : 'People'}
      modalLevel={modalOverModal ? 2 : undefined}
      hasHeader={false}
      bodyPadding={0}
    >
      <LegacyModalLayout>
        <header>{title}</header>
        <main style={{ paddingTop: 0 }}>
          {error && (
            <p role="alert" style={{ fontSize: 16, lineHeight: 1.5 }}>
              {error}
            </p>
          )}
          <RoundList>
            {loading ? (
              <Loading />
            ) : allUsers.length === 0 ? (
              <nav
                style={{
                  background: '#fff',
                  color: '#555',
                  display: 'flex',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  justifyContent: 'center',
                  padding: '1.2rem'
                }}
              >
                {emptyMessage}
              </nav>
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
                      justifyContent: 'space-between',
                      gap: 8,
                      flexWrap: 'wrap'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        minWidth: 0,
                        flex: '1 1 140px'
                      }}
                    >
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
                      <div
                        style={{
                          marginLeft: '1rem',
                          overflowWrap: 'anywhere',
                          minWidth: 0
                        }}
                      >
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
                          aria-label={`View ${user.username}'s profile`}
                          color="logoBlue"
                          variant="solid"
                          style={{
                            fontSize: 14,
                            minHeight: 44,
                            minWidth: 44,
                            marginRight: 8
                          }}
                          onClick={() => navigate(`/users/${user.username}`)}
                        >
                          <Icon icon="user" />
                        </Button>
                        <Button
                          aria-label={`Chat with ${user.username}`}
                          disabled={pendingUser !== null}
                          loading={pendingUser === user.id}
                          color="green"
                          variant="solid"
                          style={{ fontSize: 14, minHeight: 44, minWidth: 44 }}
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
          <Button variant="ghost" onClick={close}>
            Close
          </Button>
        </footer>
      </LegacyModalLayout>
    </Modal>
  );

  async function handleTalkClick(user: {
    id: number;
    username: string;
    profilePicUrl: string;
  }) {
    if (
      !userId ||
      user.id === userId ||
      pending.current ||
      !Number.isSafeInteger(user.id) ||
      user.id <= 0
    )
      return;
    pending.current = true;
    setPendingUser(user.id);
    setError('');
    const requestVersion = ++version.current;
    const isCurrent = () =>
      version.current === requestVersion && currentUser.current === userId;
    try {
      const response: any = await readWithTimeout(() =>
        loadDMChannel({ recipient: user })
      );
      if (!isCurrent()) return;
      if (
        !response ||
        !Number.isSafeInteger(Number(response.channelId)) ||
        Number(response.channelId) < 0 ||
        (response.pathId != null && !/^\d+$/.test(String(response.pathId)))
      )
        throw new Error('Invalid channel');
      const { channelId, pathId } = response;
      if (!pathId) {
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
      navigate(pathId ? `/chat/${pathId}` : `/chat/new`);
      close();
    } catch {
      if (isCurrent())
        setError('Could not open this chat. Please try the chat button again.');
    } finally {
      if (isCurrent()) {
        pending.current = false;
        setPendingUser(null);
      }
    }
  }
}

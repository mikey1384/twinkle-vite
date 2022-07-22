import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import RoundList from '~/components/RoundList';
import Icon from '~/components/Icon';
import ProfilePic from '~/components/ProfilePic';
import Loading from '~/components/Loading';
import { Color } from '~/constants/css';
import { useNavigate } from 'react-router-dom';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';

UserListModal.propTypes = {
  description: PropTypes.string,
  descriptionShown: PropTypes.func,
  descriptionColor: PropTypes.string,
  loading: PropTypes.bool,
  onHide: PropTypes.func.isRequired,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  users: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.number.isRequired }))
    .isRequired
};

export default function UserListModal({
  description = '',
  descriptionColor = Color.green(),
  descriptionShown,
  loading,
  onHide,
  title,
  users
}) {
  const reportError = useAppContext((v) => v.requestHelpers.reportError);
  const navigate = useNavigate();
  const { userId, username, profilePicUrl, authLevel } = useKeyContext(
    (v) => v.myState
  );
  const loadDMChannel = useAppContext((v) => v.requestHelpers.loadDMChannel);
  const onUpdateSelectedChannelId = useChatContext(
    (v) => v.actions.onUpdateSelectedChannelId
  );
  const onOpenNewChatTab = useChatContext((v) => v.actions.onOpenNewChatTab);
  const allUsers = useMemo(() => {
    const otherUsers = users.filter((user) => user.id !== userId);
    let userArray = [];
    for (let i = 0; i < users.length; i++) {
      if (users[i].id === userId) userArray.push(users[i]);
    }
    return userArray.concat(otherUsers);
  }, [userId, users]);

  return (
    <Modal small onHide={onHide}>
      <header>{title}</header>
      <main style={{ paddingTop: 0 }}>
        <RoundList>
          {loading ? (
            <Loading />
          ) : (
            allUsers.map((user) => {
              let userStatusDisplayed =
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
                        online={!!user.online}
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
                        {userStatusDisplayed && description}
                      </span>
                    </div>
                  </div>
                  {userId && user.id !== userId && (
                    <div>
                      <Button
                        color="logoBlue"
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
        </RoundList>
      </main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );

  async function handleTalkClick(user) {
    if (user.id !== userId) {
      const { channelId, pathId } = await loadDMChannel({ recepient: user });
      if (!pathId) {
        if (!user?.id) {
          return reportError({
            componentPath: 'Modals/UserListModal',
            message: `handleTalkClick: recepient userId is null. recepient: ${JSON.stringify(
              user
            )}`
          });
        }
        onOpenNewChatTab({
          user: { username, id: userId, profilePicUrl, authLevel },
          recepient: {
            username: user.username,
            id: user.id,
            profilePicUrl: user.profilePicUrl,
            authLevel: user.authLevel
          }
        });
        onUpdateSelectedChannelId(channelId);
      }
      navigate(pathId ? `/chat/${pathId}` : `/chat/new`);
    }
  }
}

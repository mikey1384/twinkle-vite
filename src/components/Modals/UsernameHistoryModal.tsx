import React, { useEffect, useState } from 'react';
import { useAppContext, useKeyContext } from '~/contexts';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import RoundList from '~/components/RoundList';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';

export default function UsernameHistoryModal({
  userId,
  onHide
}: {
  userId: number;
  onHide: () => void;
}) {
  const myId = useKeyContext((v) => v.myState.userId);
  const deletePreviousUsername = useAppContext(
    (v) => v.requestHelpers.deletePreviousUsername
  );
  const loadUsernameHistory = useAppContext(
    (v) => v.requestHelpers.loadUsernameHistory
  );
  const [usernameToDelete, setUsernameToDelete] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernames, setUsernames] = useState<
    { id: number; username: string; timeStamp: number }[]
  >([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreButtonShown, setLoadMoreButtonShown] = useState(false);

  useEffect(() => {
    init();
    async function init() {
      setLoading(true);
      try {
        const { usernames, loadMoreShown } = await loadUsernameHistory({
          userId
        });
        setUsernames(usernames);
        setLoadMoreButtonShown(loadMoreShown);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal hasPriority small onHide={onHide}>
      <header>Previous Usernames</header>
      <main style={{ paddingTop: 0 }}>
        <RoundList>
          {loading ? (
            <Loading />
          ) : (
            usernames.map(({ id, username, timeStamp }) => {
              return (
                <nav
                  key={id}
                  style={{
                    background: '#fff',
                    display: myId === userId ? 'flex' : 'block',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%'
                  }}
                >
                  <div
                    style={{
                      width: myId === userId ? 'auto' : '100%',
                      flexGrow: 1,
                      marginRight: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', color: Color.black() }}>
                      {username}
                    </div>
                    <small style={{ color: Color.darkerGray() }}>
                      until {new Date(timeStamp * 1000).toLocaleDateString()}
                    </small>
                  </div>
                  {myId === userId && (
                    <Button
                      color="red"
                      transparent
                      style={{ padding: 0, marginLeft: '1rem' }}
                      onClick={() => setUsernameToDelete(username)}
                    >
                      <Icon icon="times" />
                    </Button>
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
              onClick={handleLoadMoreUsernames}
            />
          )}
        </RoundList>
        {usernameToDelete && (
          <ConfirmModal
            modalOverModal
            onHide={() => setUsernameToDelete('')}
            title="Delete previous username from history"
            onConfirm={handleDeletePreviousUsername}
          />
        )}
      </main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );

  async function handleDeletePreviousUsername() {
    try {
      await deletePreviousUsername(usernameToDelete);
      setUsernames((usernames) =>
        usernames.filter((u) => u.username !== usernameToDelete)
      );
    } catch (error) {
      console.error(error);
    } finally {
      setUsernameToDelete('');
    }
  }

  async function handleLoadMoreUsernames() {
    const lastId = usernames[usernames.length - 1]?.id;
    if (loadingMore || !lastId) return;
    setLoadingMore(true);
    try {
      const { usernames: newUsernames, loadMoreShown } =
        await loadUsernameHistory({
          userId,
          lastId
        });
      setUsernames((prevUsernames) => [...prevUsernames, ...newUsernames]);
      setLoadMoreButtonShown(loadMoreShown);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  }
}

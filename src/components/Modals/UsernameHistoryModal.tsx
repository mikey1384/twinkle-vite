import React, { useEffect, useState } from 'react';
import { useAppContext } from '~/contexts';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import RoundList from '~/components/RoundList';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { Color } from '~/constants/css';

export default function UsernameHistoryModal({
  userId,
  onHide
}: {
  userId: number;
  onHide: () => void;
}) {
  const loadUsernameHistory = useAppContext(
    (v) => v.requestHelpers.loadUsernameHistory
  );
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
      </main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );

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

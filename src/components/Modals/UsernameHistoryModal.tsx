import React, { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import RoundList from '~/components/RoundList';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';

export default function UsernameHistoryModal({
  onHide
}: {
  onHide: () => void;
}) {
  const [loading] = useState(false);
  const [usernames] = useState([]);
  const [loadingMore] = useState(false);
  const [loadMoreButtonShown] = useState(false);

  return (
    <Modal modalOverModal small onHide={onHide}>
      <header>Previous Usernames</header>
      <main style={{ paddingTop: 0 }}>
        <RoundList>
          {loading ? (
            <Loading />
          ) : (
            usernames.map((username) => {
              return (
                <nav
                  key={username}
                  style={{
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  username
                </nav>
              );
            })
          )}
          {loadMoreButtonShown && (
            <LoadMoreButton
              style={{ marginTop: '1.5rem' }}
              filled
              loading={loadingMore}
              onClick={() => console.log('loading more')}
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
}

import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import ChangeListItem from './ChangeListItem';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { useAppContext, useKeyContext } from '~/contexts';

BalanceModal.propTypes = {
  onHide: PropTypes.func.isRequired
};

export default function BalanceModal({ onHide }) {
  const {
    loadMoreButton: { color: loadMoreButtonColor }
  } = useKeyContext((v) => v.theme);
  const loadCoinHistory = useAppContext(
    (v) => v.requestHelpers.loadCoinHistory
  );
  const [changes, setChanges] = useState([]);
  const [loadMoreShown, setLoadMoreShown] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    init();
    async function init() {
      const { changes, loadMoreShown } = await loadCoinHistory();
      setChanges(changes);
      setLoadMoreShown(loadMoreShown);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal onHide={onHide}>
      <header>Your Twinkle Coins</header>
      <main>
        {changes.map((change) => (
          <ChangeListItem key={change.id} change={change} />
        ))}
        {loadMoreShown && (
          <LoadMoreButton
            style={{ marginTop: '1.5em' }}
            loading={loadingMore}
            filled
            color={loadMoreButtonColor}
            onClick={() => setLoadingMore(true)}
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
}

import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import ChangeListItem from './ChangeListItem';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { addEvent, removeEvent } from '~/helpers/listenerHelpers';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useAppContext, useKeyContext } from '~/contexts';

BalanceModal.propTypes = {
  onHide: PropTypes.func.isRequired
};

export default function BalanceModal({ onHide }) {
  const {
    loadMoreButton: { color: loadMoreButtonColor }
  } = useKeyContext((v) => v.theme);
  const { twinkleCoins } = useKeyContext((v) => v.myState);
  const loadCoinHistory = useAppContext(
    (v) => v.requestHelpers.loadCoinHistory
  );
  const [changes, setChanges] = useState([]);
  const [loadMoreShown, setLoadMoreShown] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const ListRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    init();
    async function init() {
      const { changes, loadMoreShown } = await loadCoinHistory();
      setChanges(changes);
      setLoadMoreShown(loadMoreShown);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const CardItems = ListRef.current;
    addEvent(CardItems, 'scroll', onListScroll);

    function onListScroll() {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (
          loadMoreShown &&
          ListRef.current.scrollTop >=
            (ListRef.current.scrollHeight - ListRef.current.offsetHeight) * 0.7
        ) {
          handleLoadMore();
        }
      }, 250);
    }

    return function cleanUp() {
      removeEvent(CardItems, 'scroll', onListScroll);
    };
  });

  return (
    <Modal onHide={onHide}>
      <header>Transaction History</header>
      <main>
        <div
          className={css`
            text-align: center;
            font-weight: bold;
            font-size: 2rem;
            margin-bottom: 2rem;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.5rem;
            }
          `}
        >
          <p style={{ color: Color.black() }}>Current Balance</p>
          <p style={{ color: Color.darkerGray() }}>
            {addCommasToNumber(twinkleCoins)}
          </p>
        </div>
        <div
          ref={ListRef}
          className={css`
            height: 50vh;
            overflow: scroll;
            border: 1px solid ${Color.borderGray()};
            nav {
              padding: 1.5rem;
              border-bottom: 1px solid ${Color.borderGray()};
              border-left: none;
              border-right: none;
              &:last-of-type {
                border-bottom: none;
              }
            }
          `}
        >
          {changes.map((change) => (
            <ChangeListItem key={change.id} change={change} />
          ))}
          {loadMoreShown && (
            <LoadMoreButton
              filled
              style={{
                width: '100%',
                borderRadius: 0,
                border: 0
              }}
              loading={loadingMore}
              color={loadMoreButtonColor}
              onClick={handleLoadMore}
            />
          )}
        </div>
      </main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );

  async function handleLoadMore() {
    setLoadingMore(true);
    const lastId = changes[changes.length - 1].id;
    console.log(changes);
    const { changes: loadedChanges, loadMoreShown } = await loadCoinHistory(
      lastId
    );
    setChanges((v) => [...v, ...loadedChanges]);
    setLoadMoreShown(loadMoreShown);
    setLoadingMore(false);
  }
}

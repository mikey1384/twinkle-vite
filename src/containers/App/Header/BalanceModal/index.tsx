import React, { useEffect, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import ChangeListItem from './ChangeListItem';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Loading from '~/components/Loading';
import { ADMIN_USER_ID } from '~/constants/defaultValues';
import { addEvent, removeEvent } from '~/helpers/listenerHelpers';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useAppContext, useKeyContext } from '~/contexts';

const errorCheckMode = false;

export default function BalanceModal({ onHide }: { onHide: () => void }) {
  const myState = useKeyContext((v) => v.myState);
  const { twinkleCoins, userId } = myState;
  const reportError = useAppContext((v) => v.requestHelpers.reportError);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const loadCoinHistory = useAppContext(
    (v) => v.requestHelpers.loadCoinHistory
  );
  const [changes, setChanges] = useState<any[]>([]);
  const [loadMoreShown, setLoadMoreShown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);
  useEffect(() => {
    loadingMoreRef.current = loadingMore;
  }, [loadingMore]);
  const ListRef: React.RefObject<any> = useRef(null);
  const timeoutRef: React.MutableRefObject<any> = useRef(null);

  if (errorCheckMode && userId === ADMIN_USER_ID && !twinkleCoins) {
    reportError({
      componentPath: 'Header/BalanceModal',
      message: `Twinkle Coins not loaded: ${JSON.stringify(myState)}`
    });
  }

  useEffect(() => {
    const maxRetries = 3;
    const retryDelay = 1000;

    init();
    async function init(numAttempts = 0) {
      setLoading(true);
      try {
        const { totalCoins, changes, loadMoreShown } = await loadCoinHistory();
        onSetUserState({ userId, newState: { twinkleCoins: totalCoins } });
        setChanges(changes);
        setLoadMoreShown(loadMoreShown);
      } catch (error: any) {
        console.error(error);
        if (numAttempts < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          return init(numAttempts + 1);
        }
      } finally {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

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
        {loading ? (
          <Loading />
        ) : (
          <div
            ref={ListRef}
            className={css`
              width: 80%;
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
              @media (max-width: ${mobileMaxWidth}) {
                width: 100%;
              }
            `}
          >
            {changes.map((change: any) => {
              const accumulatedChanges = changes
                .filter((v: { id: number }) => v.id > change.id)
                .reduce((acc, v: { amount: number; type: string }) => {
                  if (v.type === 'increase') {
                    return acc - v.amount;
                  } else {
                    return acc + v.amount;
                  }
                }, 0);
              return (
                <ChangeListItem
                  key={change.id}
                  change={change}
                  balance={twinkleCoins + accumulatedChanges}
                />
              );
            })}
            {loadMoreShown && (
              <LoadMoreButton
                filled
                style={{
                  width: '100%',
                  borderRadius: 0,
                  border: 0
                }}
                loading={loadingMore}
                onClick={handleLoadMore}
              />
            )}
          </div>
        )}
      </main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );

  async function handleLoadMore() {
    if (loadingMoreRef.current) return;
    setLoadingMore(true);
    try {
      const lastId = changes[changes.length - 1].id;
      const { changes: loadedChanges, loadMoreShown } = await loadCoinHistory(
        lastId
      );
      setChanges((v) => [...v, ...loadedChanges]);
      setLoadMoreShown(loadMoreShown);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  }
}

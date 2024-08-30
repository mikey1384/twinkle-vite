import React, { useEffect, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import GroupItem from './GroupItem';
import { css } from '@emotion/css';
import { useAppContext, useKeyContext } from '~/contexts';

export default function SelectGroupsModal({
  onHide,
  onSelectDone,
  type,
  partnerId,
  currentlySelectedGroupIds
}: {
  onHide: () => void;
  onSelectDone: (groupIds: number[]) => void;
  type: 'offer' | 'want';
  partnerId: number;
  currentlySelectedGroupIds: number[];
}) {
  const [groups, setGroups] = useState<any[]>([]);
  const [loadMoreShown, setLoadMoreShown] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>(
    currentlySelectedGroupIds
  );
  const [loading, setLoading] = useState(true);
  const loadGroupsForTrade = useAppContext(
    (v) => v.requestHelpers.loadGroupsForTrade
  );
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);

  useEffect(() => {
    init();
    async function init() {
      setLoading(true);
      try {
        const { results, loadMoreShown } = await loadGroupsForTrade({
          partnerId,
          type
        });
        setGroups(results);
        setLoadMoreShown(loadMoreShown);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal modalOverModal onHide={onHide}>
      <header>Select Groups</header>
      <main>
        {loading ? (
          <Loading />
        ) : (
          <div
            className={css`
              display: flex;
              width: 100%;
              flex-direction: column;
              gap: 1rem;
            `}
          >
            {groups.map((group) => (
              <GroupItem
                key={group.id}
                group={group}
                isSelected={selectedGroupIds.includes(group.id)}
                onSelect={handleGroupSelect}
              />
            ))}
          </div>
        )}
        {loadMoreShown && (
          <LoadMoreButton
            style={{ marginTop: '1.5em' }}
            loading={loadingMore}
            filled
            onClick={handleLoadMore}
          />
        )}
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          Cancel
        </Button>
        <Button
          disabled={selectedGroupIds.length === 0}
          color={doneColor}
          onClick={() => onSelectDone(selectedGroupIds)}
        >
          Done
        </Button>
      </footer>
    </Modal>
  );

  function handleGroupSelect(groupId: number) {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  }

  async function handleLoadMore() {
    try {
      setLoadingMore(true);
      const { results, loadMoreShown } = await loadGroupsForTrade({
        partnerId,
        type,
        lastId: groups[groups.length - 1].id
      });
      setGroups((prev) => [...prev, ...results]);
      setLoadMoreShown(loadMoreShown);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  }
}

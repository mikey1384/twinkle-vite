import React, { useState } from 'react';
import GroupItem from './GroupItem';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { css } from '@emotion/css';

export default function Main({
  groups,
  loading,
  loadMoreShown,
  loadGroupsForTrade,
  onSetGroups,
  onSetLoadMoreShown,
  selectedGroupIds,
  onSetSelectedGroupIds,
  type,
  partnerId
}: {
  groups: any[];
  loading: boolean;
  loadMoreShown: boolean;
  loadGroupsForTrade: (v: any) => any;
  onSetGroups: (v: any) => void;
  onSetLoadMoreShown: (v: boolean) => void;
  selectedGroupIds: number[];
  onSetSelectedGroupIds: (v: any) => void;
  successColor: string;
  type: string;
  partnerId: number;
}) {
  const [loadingMore, setLoadingMore] = useState(false);
  if (loading) return <Loading />;

  return (
    <div>
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
            onSelect={() =>
              onSetSelectedGroupIds((prev: number[]) => [...prev, group.id])
            }
            onDeselect={() =>
              onSetSelectedGroupIds((prev: number[]) =>
                prev.filter((id) => id !== group.id)
              )
            }
          />
        ))}
      </div>
      {loadMoreShown && (
        <LoadMoreButton
          style={{ marginTop: '1.5em' }}
          loading={loadingMore}
          filled
          onClick={handleLoadMore}
        />
      )}
    </div>
  );

  async function handleLoadMore() {
    try {
      setLoadingMore(true);
      const lastGroupId = groups[groups.length - 1].id;
      const { results, loadMoreShown } = await loadGroupsForTrade({
        partnerId,
        type,
        lastGroupId
      });
      onSetGroups((prevGroups: any[]) => [...prevGroups, ...results]);
      onSetLoadMoreShown(loadMoreShown);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  }
}

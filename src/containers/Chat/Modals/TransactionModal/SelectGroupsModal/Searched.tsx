import React, { useState } from 'react';
import { css } from '@emotion/css';
import GroupItem from './GroupItem';
import { objectify } from '~/helpers';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Loading from '~/components/Loading';

export default function Searched({
  searchQuery,
  loadGroupsForTrade,
  loadMoreShown,
  onSetLoadMoreShown,
  selectedGroupIds,
  onSetSelectedGroupIds,
  type,
  partnerId,
  groupObjs,
  searchedGroups,
  setSearchedGroups,
  searching
}: {
  searchQuery: string;
  loadGroupsForTrade: (v: any) => any;
  loadMoreShown: boolean;
  onSetLoadMoreShown: (v: boolean) => void;
  selectedGroupIds: number[];
  onSetSelectedGroupIds: (v: any) => void;
  type: string;
  partnerId: number;
  groupObjs: Record<number, any>;
  searchedGroups: number[];
  setSearchedGroups: React.Dispatch<React.SetStateAction<number[]>>;
  searching: boolean;
}) {
  const [loadingMore, setLoadingMore] = useState(false);

  async function handleLoadMore() {
    setLoadingMore(true);
    try {
      const lastGroupId = searchedGroups[searchedGroups.length - 1];
      const { results, loadMoreShown } = await loadGroupsForTrade({
        partnerId,
        type,
        searchQuery,
        lastGroupId
      });
      const newGroupIds = results.map((group: { id: number }) => group.id);
      setSearchedGroups((prev) => [...prev, ...newGroupIds]);
      Object.assign(groupObjs, objectify(results));
      onSetLoadMoreShown(loadMoreShown);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  }

  if (searching) {
    return <Loading />;
  }

  return (
    <div
      className={css`
        width: 100%;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        @media (max-width: 768px) {
          grid-template-columns: 1fr;
        }
      `}
    >
      {searchedGroups.map((groupId) => (
        <GroupItem
          key={groupId}
          group={groupObjs[groupId]}
          isSelected={selectedGroupIds.includes(groupId)}
          onSelect={() =>
            onSetSelectedGroupIds((prev: number[]) => [...prev, groupId])
          }
          onDeselect={() =>
            onSetSelectedGroupIds((prev: number[]) =>
              prev.filter((id) => id !== groupId)
            )
          }
        />
      ))}
      {loadMoreShown && (
        <div
          className={css`
            margin-top: 0.5rem;
            grid-column: 1 / -1;
            display: flex;
            justify-content: center;
            width: 100%;
          `}
        >
          <LoadMoreButton
            loading={loadingMore}
            filled
            onClick={handleLoadMore}
            style={{ marginTop: '1rem' }}
          />
        </div>
      )}
    </div>
  );
}

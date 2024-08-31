import React, { useState, useEffect } from 'react';
import GroupItem from './GroupItem';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';

export default function Searched({
  searchQuery,
  loadGroupsForTrade,
  loadMoreShown,
  onSetLoadMoreShown,
  selectedGroupIds,
  onSetSelectedGroupIds,
  type,
  partnerId
}: {
  searchQuery: string;
  loadGroupsForTrade: (v: any) => any;
  loadMoreShown: boolean;
  onSetLoadMoreShown: (v: boolean) => void;
  selectedGroupIds: number[];
  onSetSelectedGroupIds: (v: any) => void;
  type: string;
  partnerId: number;
}) {
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchedGroups, setSearchedGroups] = useState<any[]>([]);

  useEffect(() => {
    searchGroups();
    async function searchGroups() {
      setLoading(true);
      try {
        const { results, loadMoreShown } = await loadGroupsForTrade({
          partnerId,
          type,
          searchQuery
        });
        setSearchedGroups(results);
        onSetLoadMoreShown(loadMoreShown);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  async function handleLoadMore() {
    setLoadingMore(true);
    try {
      const lastGroupId = searchedGroups[searchedGroups.length - 1].id;
      const { results, loadMoreShown } = await loadGroupsForTrade({
        partnerId,
        type,
        searchQuery,
        lastGroupId
      });
      setSearchedGroups((prev) => [...prev, ...results]);
      onSetLoadMoreShown(loadMoreShown);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <div>
      {searchedGroups.map((group) => (
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
      {loadMoreShown && (
        <LoadMoreButton
          loading={loadingMore}
          onClick={handleLoadMore}
          style={{ marginTop: '1rem' }}
        />
      )}
    </div>
  );
}

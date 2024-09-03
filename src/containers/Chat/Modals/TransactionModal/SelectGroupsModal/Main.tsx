import React, { useState } from 'react';
import GroupItem from './GroupItem';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

export default function Main({
  groups,
  loading,
  loadMoreShown,
  loadGroupsForTrade,
  onSetGroups,
  onSetLoadMoreShown,
  selectedGroupIds,
  onSetSelectedGroupIds,
  partnerName,
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
  partnerName: string;
  partnerId: number;
}) {
  const [loadingMore, setLoadingMore] = useState(false);
  if (loading) return <Loading />;

  if (groups.length === 0) {
    return (
      <div
        className={css`
          font-weight: bold;
          font-size: 1.7rem;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.5rem;
          }
          text-align: center;
          padding: 5rem 0;
        `}
      >
        {type === 'offer'
          ? "You don't own any groups to offer"
          : `${partnerName} doesn't own any groups to offer`}
      </div>
    );
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
      {groups.map((group) => (
        <GroupItem
          key={`main-${group.id}`}
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
          />
        </div>
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
        lastId: lastGroupId
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

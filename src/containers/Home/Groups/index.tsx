import React, { useEffect, useState } from 'react';
import GroupItem from './GroupItem';
import ErrorBoundary from '~/components/ErrorBoundary';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { css } from '@emotion/css';
import { useAppContext, useKeyContext } from '~/contexts/';

export default function Groups() {
  const { userId } = useKeyContext((v) => v.myState);
  const loadPublicGroups = useAppContext(
    (v) => v.requestHelpers.loadPublicGroups
  );
  const [groups, setGroups] = useState<
    {
      id: number;
      creatorId: number;
      description: string;
      channelName: string;
      lastUpdated: string;
      thumbPath: string;
      allMemberIds: number[];
      pathId: number;
    }[]
  >([]);
  const [loadMoreShown, setLoadMoreShown] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  useEffect(() => {
    init();
    async function init() {
      const { results, loadMoreShown } = await loadPublicGroups();
      setGroups(results);
      setLoadMoreShown(loadMoreShown);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ErrorBoundary componentPath="Home/Groups">
      <div
        className={css`
          display: flex;
          flex-direction: column;
          padding: 16px;
        `}
      >
        {groups.map((group) => (
          <GroupItem
            key={group.id}
            groupId={group.id}
            allMemberIds={group.allMemberIds}
            groupName={group.channelName}
            description={group.description || 'No description'}
            thumbPath={group.thumbPath}
            isOwner={group.creatorId === userId}
            isMember={group.allMemberIds.includes(userId)}
            pathId={group.pathId}
          />
        ))}
        {loadMoreShown && (
          <LoadMoreButton
            style={{ marginTop: '1rem' }}
            loading={loadingMore}
            filled
            onClick={handleLoadMore}
          />
        )}
      </div>
    </ErrorBoundary>
  );

  async function handleLoadMore() {
    setLoadingMore(true);
    const lastUpdated = groups[groups.length - 1].lastUpdated;
    const { results, loadMoreShown } = await loadPublicGroups(lastUpdated);
    setGroups([...groups, ...results]);
    setLoadMoreShown(loadMoreShown);
  }
}

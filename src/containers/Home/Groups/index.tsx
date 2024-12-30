import React, { useEffect, useState } from 'react';
import GroupItem from './GroupItem';
import ErrorBoundary from '~/components/ErrorBoundary';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Loading from '~/components/Loading';
import { mobileMaxWidth } from '~/constants/css';
import { useInfiniteScroll } from '~/helpers/hooks';
import { css } from '@emotion/css';
import { useAppContext, useKeyContext } from '~/contexts/';
import SearchInput from '~/components/Texts/SearchInput';

export default function Groups() {
  const { userId } = useKeyContext((v) => v.myState);
  const loadPublicGroups = useAppContext(
    (v) => v.requestHelpers.loadPublicGroups
  );
  const {
    search: { color: searchColor }
  } = useKeyContext((v) => v.theme);
  const [groups, setGroups] = useState<
    {
      id: number;
      creatorId: number;
      description: string;
      channelName: string;
      lastUpdated: string;
      members: { id: number; username: string; profilePicUrl: string }[];
      thumbPath: string;
      allMemberIds: number[];
      pathId: number;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadMoreShown, setLoadMoreShown] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useInfiniteScroll({
    scrollable: groups.length > 0,
    feedsLength: groups.length,
    onScrollToBottom: handleLoadMore
  });

  useEffect(() => {
    init();
    async function init() {
      setLoading(true);
      try {
        const { results, loadMoreShown } = await loadPublicGroups();
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
    <ErrorBoundary componentPath="Home/Groups">
      <SearchInput
        className={css`
          @media (max-width: ${mobileMaxWidth}) {
            margin-top: 1rem;
          }
        `}
        style={{ zIndex: 0 }}
        addonColor={searchColor}
        borderColor={searchColor}
        placeholder={`Search Groups...`}
        onChange={() => {}}
        value={''}
      />
      <div
        className={css`
          display: flex;
          flex-direction: column;
          width: 100%;
          padding: 16px;
        `}
      >
        {loading ? (
          <Loading text="Loading Groups..." />
        ) : (
          <>
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
                members={group.members}
                pathId={group.pathId}
                ownerId={group.creatorId}
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
          </>
        )}
        <div
          className={css`
            display: ${loadMoreShown ? 'none' : 'block'};
            height: 7rem;
            @media (max-width: ${mobileMaxWidth}) {
              display: block;
            }
          `}
        />
      </div>
    </ErrorBoundary>
  );

  async function handleLoadMore() {
    setLoadingMore(true);
    try {
      const lastUpdated = groups[groups.length - 1].lastUpdated;
      const { results, loadMoreShown } = await loadPublicGroups({
        lastUpdated
      });
      setGroups([...groups, ...results]);
      setLoadMoreShown(loadMoreShown);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  }
}

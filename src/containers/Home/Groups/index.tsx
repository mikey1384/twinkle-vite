import React, { useEffect, useMemo, useRef, useState } from 'react';
import GroupItem from './GroupItem';
import ErrorBoundary from '~/components/ErrorBoundary';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Loading from '~/components/Loading';
import { mobileMaxWidth } from '~/constants/css';
import { useInfiniteScroll, useSearch } from '~/helpers/hooks';
import { css } from '@emotion/css';
import { useAppContext, useHomeContext, useKeyContext } from '~/contexts/';
import SearchInput from '~/components/Texts/SearchInput';
import { stringIsEmpty } from '~/helpers/stringHelpers';

interface GroupsProps {
  id: number;
  creatorId: number;
  description: string;
  channelName: string;
  lastUpdated: string;
  members: { id: number; username: string; profilePicUrl: string }[];
  thumbPath: string;
  allMemberIds: number[];
  pathId: number;
}

export default function Groups() {
  const { userId } = useKeyContext((v) => v.myState);
  const loadPublicGroups = useAppContext(
    (v) => v.requestHelpers.loadPublicGroups
  );
  const {
    search: { color: searchColor }
  } = useKeyContext((v) => v.theme);
  const searchGroups = useAppContext((v) => v.requestHelpers.searchGroups);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const groupIds = useHomeContext((v) => v.state.groupIds);
  const searchedGroupIds = useHomeContext((v) => v.state.searchedGroupIds);
  const groupsObj = useHomeContext((v) => v.state.groupsObj);
  const loadMoreGroupsShown = useHomeContext(
    (v) => v.state.loadMoreGroupsShown
  );
  const isGroupsLoaded = useHomeContext((v) => v.state.isGroupsLoaded);
  const onLoadGroups = useHomeContext((v) => v.actions.onLoadGroups);
  const onLoadMoreGroups = useHomeContext((v) => v.actions.onLoadMoreGroups);
  const onSearchGroups = useHomeContext((v) => v.actions.onSearchGroups);
  const onClearSearchedGroups = useHomeContext(
    (v) => v.actions.onClearSearchedGroups
  );
  const loadingMoreRef = useRef(false);
  const groups = useMemo(() => {
    return groupIds.map((id: number) => groupsObj[id]);
  }, [groupIds, groupsObj]);

  const searchedGroups = useMemo(() => {
    return searchedGroupIds.map((id: number) => groupsObj[id]);
  }, [searchedGroupIds, groupsObj]);

  const [searchText, setSearchText] = useState('');
  const searchTextRef = useRef(searchText);

  const { handleSearch, searching } = useSearch({
    onSearch: handleSearchGroups,
    onSetSearchText: (text) => {
      setSearchText(text);
      searchTextRef.current = text;
    },
    onClear: onClearSearchedGroups
  });

  useInfiniteScroll({
    scrollable: groups.length > 0 && stringIsEmpty(searchText),
    feedsLength: groups.length,
    onScrollToBottom: handleLoadMore
  });

  useEffect(() => {
    if (!isGroupsLoaded) {
      init();
    }
    async function init() {
      setLoading(true);
      try {
        const { results, loadMoreShown } = await loadPublicGroups();
        onLoadGroups({ groups: results, loadMoreShown });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGroupsLoaded]);

  const loadMoreButtonShown = useMemo(
    () => stringIsEmpty(searchText) && isGroupsLoaded && loadMoreGroupsShown,
    [loadMoreGroupsShown, isGroupsLoaded, searchText]
  );

  const isLoading = useMemo(
    () => loading || (!stringIsEmpty(searchText) && searching),
    [loading, searching, searchText]
  );

  const filteredGroups = useMemo(
    () =>
      groups
        .filter((group: GroupsProps | null): group is GroupsProps =>
          Boolean(group)
        )
        .map((group: GroupsProps) => (
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
        )),
    [groups, userId]
  );

  const filteredSearchedGroups = useMemo(
    () =>
      searchedGroups
        .filter((group: GroupsProps | null): group is GroupsProps =>
          Boolean(group)
        )
        .map((group: GroupsProps) => (
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
        )),
    [searchedGroups, userId]
  );

  const showNoResultsMessage = useMemo(
    () =>
      !stringIsEmpty(searchText) && !searching && searchedGroups?.length === 0,
    [searchText, searching, searchedGroups?.length]
  );

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
        placeholder="Search Groups..."
        onChange={handleSearch}
        value={searchText}
      />
      <div
        className={css`
          display: flex;
          flex-direction: column;
          width: 100%;
          padding: 16px;
        `}
      >
        {isLoading ? (
          <Loading text={`${searching ? 'Searching' : 'Loading'} Groups...`} />
        ) : (
          <>
            {stringIsEmpty(searchText) && filteredGroups}
            {!stringIsEmpty(searchText) && filteredSearchedGroups}
            {showNoResultsMessage && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '15rem',
                  fontSize: '2.8rem'
                }}
              >
                No Groups Found
              </div>
            )}
            {loadMoreButtonShown && (
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
            display: ${loadMoreButtonShown ? 'none' : 'block'};
            height: 7rem;
            @media (max-width: ${mobileMaxWidth}) {
              display: block;
            }
          `}
        />
      </div>
    </ErrorBoundary>
  );

  async function handleSearchGroups(text: string) {
    try {
      const results = await searchGroups({
        searchQuery: text
      });
      onSearchGroups(results);
    } catch (error) {
      console.error(error);
      onSearchGroups([]);
    }
  }

  async function handleLoadMore() {
    if (loadingMoreRef.current) return;
    setLoadingMore(true);
    loadingMoreRef.current = true;
    try {
      const lastUpdated = groups[groups.length - 1].lastUpdated;
      const { results, loadMoreShown } = await loadPublicGroups({
        lastUpdated
      });
      onLoadMoreGroups({ groups: results, loadMoreShown });
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }
}

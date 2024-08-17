import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import SearchInput from '~/components/Texts/SearchInput';
import ProfilePanel from '~/components/ProfilePanel';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Loading from '~/components/Loading';
import PeopleFilterBar from './PeopleFilterBar';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { useAppContext, useInputContext, useKeyContext } from '~/contexts';
import { useInfiniteScroll, useSearch } from '~/helpers/hooks';
import request from 'axios';
import URL from '~/constants/URL';
import {
  LAST_ONLINE_FILTER_LABEL,
  RANKING_FILTER_LABEL
} from '~/constants/defaultValues';
import localize from '~/constants/localize';

const searchUsersLabel = localize('searchUsers');

function People() {
  const lastUserIdRef = useRef(null);
  const { loadUsers } = useAppContext((v) => v.requestHelpers);
  const onClearUserSearch = useAppContext(
    (v) => v.user.actions.onClearUserSearch
  );
  const onLoadUsers = useAppContext((v) => v.user.actions.onLoadUsers);
  const onLoadMoreUsers = useAppContext((v) => v.user.actions.onLoadMoreUsers);
  const onSearchUsers = useAppContext((v) => v.user.actions.onSearchUsers);
  const onSetOrderUsersBy = useAppContext(
    (v) => v.user.actions.onSetOrderUsersBy
  );
  const loadMoreButton = useAppContext((v) => v.user.state.loadMoreButton);
  const profilesLoaded = useAppContext((v) => v.user.state.profilesLoaded);
  const orderUsersBy = useAppContext((v) => v.user.state.orderUsersBy);
  const profiles = useAppContext((v) => v.user.state.profiles);
  const searchedProfiles = useAppContext((v) => v.user.state.searchedProfiles);
  const userSearchText = useInputContext((v) => v.state.userSearchText);
  const onSetSearchText = useInputContext((v) => v.actions.onSetSearchText);
  const {
    search: { color: searchColor }
  } = useKeyContext((v) => v.theme);
  const [loading, setLoading] = useState(false);
  const searchTextRef = useRef(userSearchText);
  const [searchText, setSearchText] = useState(userSearchText);
  const { handleSearch, searching } = useSearch({
    onSearch: handleSearchUsers,
    onSetSearchText: (text) => {
      setSearchText(text);
      searchTextRef.current = text;
    },
    onClear: onClearUserSearch
  });
  const prevOrderUsersBy = useRef(orderUsersBy);
  const dropdownLabel =
    orderUsersBy === LAST_ONLINE_FILTER_LABEL
      ? RANKING_FILTER_LABEL
      : LAST_ONLINE_FILTER_LABEL;

  useInfiniteScroll({
    scrollable: profiles.length > 0 && stringIsEmpty(searchText),
    feedsLength: profiles.length,
    onScrollToBottom: handleLoadMoreProfiles
  });

  useEffect(() => {
    init();
    async function init() {
      if (!profilesLoaded || orderUsersBy !== prevOrderUsersBy.current) {
        const data = await loadUsers({
          orderBy: orderUsersBy === RANKING_FILTER_LABEL ? 'twinkleXP' : ''
        });
        onLoadUsers(data);
        prevOrderUsersBy.current = orderUsersBy;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderUsersBy, profilesLoaded]);

  useEffect(() => {
    return function cleanUp() {
      onSetSearchText({ category: 'user', searchText: searchTextRef.current });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMoreButtonShown = useMemo(
    () => stringIsEmpty(searchText) && profilesLoaded && loadMoreButton,
    [loadMoreButton, profilesLoaded, searchText]
  );

  return (
    <div style={{ height: '100%' }}>
      <SearchInput
        className={css`
          @media (max-width: ${mobileMaxWidth}) {
            margin-top: 1rem;
          }
        `}
        style={{ zIndex: 0 }}
        addonColor={searchColor}
        borderColor={searchColor}
        placeholder={`${searchUsersLabel}...`}
        onChange={handleSearch}
        value={searchText}
      />
      <div
        style={{
          marginTop: '1rem',
          position: 'relative',
          minHeight: '30%',
          width: '100%',
          paddingBottom: loadMoreButtonShown ? 0 : '1rem'
        }}
      >
        <PeopleFilterBar
          style={{
            marginBottom: '1rem'
          }}
          onSetOrderByText={onSetOrderUsersBy}
          orderByText={orderUsersBy}
          dropdownLabel={dropdownLabel}
        />
        {(!profilesLoaded || (!stringIsEmpty(searchText) && searching)) && (
          <Loading text={`${searching ? 'Searching' : 'Loading'} Users...`} />
        )}
        {profilesLoaded &&
          stringIsEmpty(searchText) &&
          profiles.map((profile: { id: number }, index: number) => (
            <ProfilePanel
              style={{ marginTop: index === 0 ? 0 : '1rem' }}
              expandable
              key={profile.id}
              profileId={profile.id}
            />
          ))}
        {profilesLoaded &&
          !stringIsEmpty(searchText) &&
          !searching &&
          searchedProfiles.map((profile: { id: number }, index: number) => (
            <ProfilePanel
              style={{
                marginTop: index === 0 ? 0 : '1rem'
              }}
              expandable
              key={profile.id}
              profileId={profile.id}
            />
          ))}
        {!stringIsEmpty(searchText) &&
          !searching &&
          searchedProfiles.length === 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '15rem',
                fontSize: '2.8rem'
              }}
            >
              No Users Found
            </div>
          )}
        {loadMoreButtonShown && (
          <LoadMoreButton
            filled
            style={{ marginTop: '1rem', marginBottom: '1rem' }}
            onClick={() => setLoading(true)}
            loading={loading}
          />
        )}
        <div
          className={css`
            display: ${loadMoreButton ? 'none' : 'block'};
            height: 7rem;
            @media (max-width: ${mobileMaxWidth}) {
              display: block;
            }
          `}
        />
      </div>
    </div>
  );

  async function handleSearchUsers(text: string) {
    const { data: users } = await request.get(
      `${URL}/user/users/search?queryString=${text}`
    );
    onSearchUsers(users);
  }

  async function handleLoadMoreProfiles() {
    const lastUserId =
      profiles.length > 0 ? profiles[profiles.length - 1].id : null;
    if (lastUserIdRef.current === lastUserId) return;
    lastUserIdRef.current = lastUserId;
    setLoading(true);
    try {
      const data = await loadUsers({
        lastActive:
          profiles.length > 0 ? profiles[profiles.length - 1].lastActive : null,
        lastUserId,
        lastTwinkleXP:
          profiles.length > 0 ? profiles[profiles.length - 1].twinkleXP : null,
        orderBy: orderUsersBy === RANKING_FILTER_LABEL ? 'twinkleXP' : ''
      });
      onLoadMoreUsers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }
}

export default memo(People);

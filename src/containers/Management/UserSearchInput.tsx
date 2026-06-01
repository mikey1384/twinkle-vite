import React, { useState } from 'react';
import Loading from '~/components/Loading';
import SearchInput from '~/components/Texts/SearchInput';
import { useAppContext } from '~/contexts';
import { useSearch } from '~/helpers/hooks';

export interface ManagementUserSearchResult {
  id: number;
  username: string;
  realName?: string;
  level?: number;
  unlockedAchievementIds?: number[];
  [key: string]: any;
}

export default function ManagementUserSearchInput({
  autoFocus,
  excludeUserIds = [],
  filterUser,
  onSelect,
  placeholder = 'Search Users...'
}: {
  autoFocus?: boolean;
  excludeUserIds?: number[];
  filterUser?: (user: ManagementUserSearchResult) => boolean;
  onSelect: (user: ManagementUserSearchResult) => void;
  placeholder?: string;
}) {
  const searchUsers = useAppContext((v) => v.requestHelpers.searchUsers);
  const [searchText, setSearchText] = useState('');
  const [searchedUsers, setSearchedUsers] = useState<
    ManagementUserSearchResult[]
  >([]);
  const { handleSearch, searching } = useSearch({
    onSearch: handleUserSearch,
    onClear: () => setSearchedUsers([]),
    onSetSearchText: setSearchText
  });
  const visibleUsers = searchedUsers.filter((user) => {
    if (excludeUserIds.includes(user.id)) return false;
    return filterUser ? filterUser(user) : true;
  });

  return (
    <>
      <SearchInput
        autoFocus={autoFocus}
        onChange={handleSearch}
        onSelect={handleSelectUser}
        placeholder={placeholder}
        onClickOutSide={clearSearch}
        renderItemLabel={(item) => (
          <span>
            {item.username} <small>{`(${item.realName || ''})`}</small>
          </span>
        )}
        searchResults={visibleUsers}
        value={searchText}
      />
      {searching && (
        <Loading style={{ position: 'absolute', marginTop: '1rem' }} />
      )}
    </>
  );

  function clearSearch() {
    setSearchText('');
    setSearchedUsers([]);
  }

  function handleSelectUser(user: ManagementUserSearchResult) {
    onSelect(user);
    clearSearch();
  }

  async function handleUserSearch(text: string) {
    const users = await searchUsers(text);
    setSearchedUsers(users);
  }
}

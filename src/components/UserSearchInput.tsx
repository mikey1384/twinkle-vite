import React, { useRef, useState } from 'react';
import Loading from '~/components/Loading';
import SearchInput from '~/components/Texts/SearchInput';
import UserSearchResultRow from '~/components/UserSearchResultRow';
import { useAppContext } from '~/contexts';
import { useSearch } from '~/helpers/hooks';

export interface UserSearchResult {
  id: number;
  username: string;
  realName?: string | null;
  profilePicUrl?: string | null;
  level?: number;
  unlockedAchievementIds?: number[];
  [key: string]: any;
}

export default function UserSearchInput<
  T extends UserSearchResult = UserSearchResult
>({
  autoFocus,
  excludeUserIds = [],
  filterUser,
  inputFontSize,
  inputHeight,
  onSearch,
  onSelect,
  placeholder = 'Search users...'
}: {
  autoFocus?: boolean;
  excludeUserIds?: number[];
  filterUser?: (user: T) => boolean;
  inputFontSize?: string;
  inputHeight?: string;
  onSearch?: (text: string) => Promise<T[]>;
  onSelect: (user: T) => void;
  placeholder?: string;
}) {
  const searchUsers = useAppContext((v) => v.requestHelpers.searchUsers);
  const [searchText, setSearchText] = useState('');
  const [searchedUsers, setSearchedUsers] = useState<T[]>([]);
  const searchSequenceRef = useRef(0);
  const { handleSearch, searching } = useSearch({
    onSearch: handleUserSearch,
    onClear: clearSearchResults,
    onSetSearchText: setSearchText
  });
  const visibleUsers = searchedUsers.filter((user) => {
    if (excludeUserIds.includes(user.id)) return false;
    return filterUser ? filterUser(user) : true;
  });

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <SearchInput
        autoFocus={autoFocus}
        inputFontSize={inputFontSize}
        inputHeight={inputHeight}
        onChange={handleSearch}
        onClickOutSide={clearSearch}
        onSelect={handleSelectUser}
        placeholder={placeholder}
        renderItemLabel={(user) => (
          <UserSearchResultRow
            userId={user.id}
            username={user.username}
            realName={user.realName}
            profilePicUrl={user.profilePicUrl}
          />
        )}
        searchResults={visibleUsers}
        value={searchText}
      />
      {searching ? (
        <Loading style={{ position: 'absolute', top: 0, right: 0 }} />
      ) : null}
    </div>
  );

  function clearSearchResults() {
    searchSequenceRef.current += 1;
    setSearchedUsers([]);
  }

  function clearSearch() {
    setSearchText('');
    clearSearchResults();
  }

  function handleSelectUser(user: T) {
    onSelect(user);
    clearSearch();
  }

  async function handleUserSearch(text: string) {
    const sequence = ++searchSequenceRef.current;
    const users = await (onSearch || searchUsers)(text);
    if (sequence !== searchSequenceRef.current) return;
    setSearchedUsers(Array.isArray(users) ? users : []);
  }
}

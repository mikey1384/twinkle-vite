import React, { useEffect, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import AccountConfirm from './AccountConfirm';
import SearchInput from '~/components/Texts/SearchInput';
import { Color } from '~/constants/css';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { useSearch } from '~/helpers/hooks';
import { useAppContext } from '~/contexts';

export default function UsernameSection({
  matchingAccount,
  onSetSearchText,
  onNextClick,
  searchText
}: {
  matchingAccount: any;
  onSetSearchText: (text: string) => void;
  onNextClick: () => void;
  searchText: string;
}) {
  const searchUsers = useAppContext((v) => v.requestHelpers.searchUsers);
  const onClearUserSearch = useAppContext(
    (v) => v.user.actions.onClearUserSearch
  );
  const onSearchUsers = useAppContext((v) => v.user.actions.onSearchUsers);
  const [isBanned, setIsBanned] = useState(false);

  const { handleSearch, searching } = useSearch({
    onSearch: handleSearchUsers,
    onSetSearchText: (text) => onSetSearchText(text.trim()),
    onClear: onClearUserSearch
  });

  useEffect(() => {
    if (!stringIsEmpty(searchText)) {
      handleSearch(searchText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ErrorBoundary componentPath="Signin/RestoreAccount/UsernameSection/index">
      <p
        style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: Color.black()
        }}
      >
        What is your username?
      </p>
      <p
        style={{
          fontSize: '2.7rem',
          fontWeight: 'bold',
          marginTop: '2rem'
        }}
      >
        {stringIsEmpty(searchText) ? 'My username is...' : ` "${searchText}"`}
      </p>
      <SearchInput
        autoFocus
        style={{ marginTop: '1rem', width: '70%' }}
        placeholder="Type your username"
        onChange={(text) => {
          setIsBanned(false);
          handleSearch(text);
        }}
        value={searchText}
      />
      <AccountConfirm
        searching={searching}
        matchingAccount={matchingAccount}
        onNextClick={onNextClick}
        style={{ marginTop: '1rem' }}
        notExist={!stringIsEmpty(searchText) && !searching && !matchingAccount}
        isBanned={isBanned}
      />
    </ErrorBoundary>
  );

  async function handleSearchUsers(text: string) {
    const users = await searchUsers(text);
    for (const user of users) {
      if (user.username === text && user.banned?.all) {
        return setIsBanned(true);
      }
    }
    onSearchUsers(users);
  }
}

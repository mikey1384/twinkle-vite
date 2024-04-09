import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import AccountConfirm from './AccountConfirm';
import SearchInput from '~/components/Texts/SearchInput';
import { Color } from '~/constants/css';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { useSearch } from '~/helpers/hooks';
import { useAppContext } from '~/contexts';
import request from 'axios';
import URL from '~/constants/URL';

UsernameSection.propTypes = {
  matchingAccount: PropTypes.object,
  onSetSearchText: PropTypes.func.isRequired,
  onNextClick: PropTypes.func.isRequired,
  searchText: PropTypes.string.isRequired
};

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
      {isBanned ? (
        <div style={{ padding: '2rem', fontWeight: 'bold' }}>
          That user is banned
        </div>
      ) : (
        <AccountConfirm
          searching={searching}
          matchingAccount={matchingAccount}
          onNextClick={onNextClick}
          style={{ marginTop: '1rem' }}
          notExist={
            !stringIsEmpty(searchText) && !searching && !matchingAccount
          }
        />
      )}
    </ErrorBoundary>
  );

  async function handleSearchUsers(text: string) {
    const { data: users } = await request.get(
      `${URL}/user/users/search?queryString=${text}`
    );
    for (const user of users) {
      if (user.username === text && Object.keys(user.banned).length > 0) {
        return setIsBanned(true);
      }
    }
    onSearchUsers(users);
  }
}

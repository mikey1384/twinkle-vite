import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Table from '../Table';
import RedTimes from '../RedTimes';
import SearchInput from '~/components/Texts/SearchInput';
import Loading from '~/components/Loading';
import { useSearch } from '~/helpers/hooks';
import { useAppContext, useManagementContext, useKeyContext } from '~/contexts';
import { isEqual } from 'lodash';
import { css } from '@emotion/css';
import localize from '~/constants/localize';

const searchUsersLabel = localize('searchUsers');

AddBanModal.propTypes = {
  onHide: PropTypes.func.isRequired
};

export default function AddBanModal({ onHide }) {
  const { authLevel } = useKeyContext((v) => v.myState);
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const [searchText, setSearchText] = useState('');
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const searchUsers = useAppContext((v) => v.requestHelpers.searchUsers);
  const updateBanStatus = useAppContext(
    (v) => v.requestHelpers.updateBanStatus
  );
  const onUpdateBanStatus = useManagementContext(
    (v) => v.actions.onUpdateBanStatus
  );
  const { handleSearch, searching } = useSearch({
    onSearch: handleUserSearch,
    onClear: () => setSearchedUsers([]),
    onSetSearchText: setSearchText
  });
  const [banStatus, setBanStatus] = useState(null);
  useEffect(() => {
    setBanStatus(
      selectedUser?.banned || {
        all: false,
        chat: false,
        chess: false,
        posting: false
      }
    );
  }, [selectedUser]);
  const submitDisabled = useMemo(() => {
    if (!selectedUser) return true;
    const bannedFeatures = {};
    for (let key in banStatus) {
      if (banStatus[key]) {
        bannedFeatures[key] = true;
      }
    }
    const prevBannedFeatures = {};
    for (let key in selectedUser.banned) {
      if (selectedUser.banned[key]) {
        prevBannedFeatures[key] = true;
      }
    }
    return isEqual(bannedFeatures, prevBannedFeatures);
  }, [banStatus, selectedUser]);

  return (
    <ErrorBoundary componentPath="Management/Modals/AddBanModal">
      <Modal onHide={onHide}>
        <header style={{ display: 'block' }}>Restrict Account</header>
        <main>
          <div style={{ position: 'relative', width: '100%' }}>
            <SearchInput
              autoFocus
              onChange={handleSearch}
              onSelect={handleSelectUser}
              placeholder={`${searchUsersLabel}...`}
              renderItemLabel={(item) => (
                <span>
                  {item.username} <small>{`(${item.realName})`}</small>
                </span>
              )}
              searchResults={searchedUsers}
              value={searchText}
            />
            {selectedUser && (
              <div>
                <p
                  style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    marginTop: '2rem',
                    textAlign: 'center'
                  }}
                >
                  {selectedUser.username}
                </p>
                <Table style={{ marginTop: '1.5rem' }} columns="2fr 1fr">
                  <thead>
                    <tr>
                      <th>Features</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody
                    className={`${css`
                      tr {
                        cursor: pointer;
                      }
                    `} unselectable`}
                  >
                    <tr onClick={() => handleBanStatusClick('all')}>
                      <td style={{ fontWeight: 'bold' }}>Log In</td>
                      <td style={{ textAlign: 'center' }}>
                        {banStatus.all && <RedTimes />}
                      </td>
                    </tr>
                    <tr onClick={() => handleBanStatusClick('chat')}>
                      <td style={{ fontWeight: 'bold' }}>Chat</td>
                      <td style={{ textAlign: 'center' }}>
                        {banStatus.chat && <RedTimes />}
                      </td>
                    </tr>
                    <tr onClick={() => handleBanStatusClick('chess')}>
                      <td style={{ fontWeight: 'bold' }}>Chess</td>
                      <td style={{ textAlign: 'center' }}>
                        {banStatus.chess && <RedTimes />}
                      </td>
                    </tr>
                    <tr onClick={() => handleBanStatusClick('posting')}>
                      <td style={{ fontWeight: 'bold' }}>Posting</td>
                      <td style={{ textAlign: 'center' }}>
                        {banStatus.posting && <RedTimes />}
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </div>
            )}
            {searching && <Loading style={{ position: 'absolute', top: 0 }} />}
          </div>
        </main>
        <footer>
          <Button
            transparent
            onClick={onHide}
            style={{ marginRight: '0.7rem' }}
          >
            Cancel
          </Button>
          <Button
            color={doneColor}
            disabled={submitDisabled}
            onClick={handleSubmit}
          >
            Done
          </Button>
        </footer>
      </Modal>
    </ErrorBoundary>
  );

  function handleBanStatusClick(feature) {
    setBanStatus((prevStatus) => ({
      ...prevStatus,
      [feature]: !prevStatus[feature]
    }));
  }

  async function handleSubmit() {
    await updateBanStatus({ userId: selectedUser.id, banStatus });
    onUpdateBanStatus({ ...selectedUser, banned: banStatus });
    onHide();
  }

  function handleSelectUser(user) {
    setSelectedUser(user);
    setSearchedUsers([]);
    setSearchText('');
  }

  async function handleUserSearch(text) {
    const users = await searchUsers(text);
    const result = users.filter((user) => user.authLevel < authLevel);
    setSearchedUsers(result);
  }
}

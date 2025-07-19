import React, { useEffect, useMemo, useState } from 'react';
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

export default function AddBanModal({ onHide }: { onHide: () => void }) {
  const level = useKeyContext((v) => v.myState.level);
  const doneColor = useKeyContext((v) => v.theme.done.color);
  const [submitting, setSubmitting] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState<Record<string, any>>({
    banned: null
  });
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
  const [banStatus, setBanStatus] = useState<Record<string, boolean>>({
    all: false,
    chat: false,
    chess: false,
    posting: false
  });
  useEffect(() => {
    setBanStatus(
      selectedUser.banned || {
        all: false,
        chat: false,
        chess: false,
        posting: false
      }
    );
  }, [selectedUser]);
  const submitDisabled = useMemo(() => {
    if (!selectedUser.banned) return true;
    const bannedFeatures: { [key: string]: boolean } = {};
    for (const key in banStatus) {
      if (banStatus[key]) {
        bannedFeatures[key] = true;
      }
    }
    const prevBannedFeatures: { [key: string]: boolean } = {};
    for (const key in selectedUser.banned) {
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
            loading={submitting}
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

  function handleBanStatusClick(feature: string) {
    setBanStatus((prevStatus) => ({
      ...prevStatus,
      [feature]: !prevStatus[feature]
    }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await updateBanStatus({ userId: selectedUser.id, banStatus });
      onUpdateBanStatus({ ...selectedUser, banned: banStatus });
      onHide();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  }

  function handleSelectUser(user: Record<string, any>) {
    setSelectedUser(user);
    setSearchedUsers([]);
    setSearchText('');
  }

  async function handleUserSearch(text: string) {
    const users = await searchUsers(text);
    const result = users.filter((user: { level: number }) => {
      return level > user.level;
    });
    setSearchedUsers(result);
  }
}

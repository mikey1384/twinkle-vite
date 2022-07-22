import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '~/components/Button';
import Modal from '~/components/Modal';
import Loading from '~/components/Loading';
import SearchInput from '~/components/Texts/SearchInput';
import DropdownButton from '~/components/Buttons/DropdownButton';
import Table from '../Table';
import Icon from '~/components/Icon';
import { useSearch } from '~/helpers/hooks';
import { useAppContext, useManagementContext, useKeyContext } from '~/contexts';
import { Color } from '~/constants/css';
import { capitalize } from '~/helpers/stringHelpers';
import localize from '~/constants/localize';

const searchUsersLabel = localize('searchUsers');

AddModeratorModal.propTypes = {
  accountTypes: PropTypes.array,
  onHide: PropTypes.func.isRequired
};

export default function AddModeratorModal({ accountTypes, onHide }) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const addModerators = useAppContext((v) => v.requestHelpers.addModerators);
  const searchUsers = useAppContext((v) => v.requestHelpers.searchUsers);
  const onEditModerators = useManagementContext(
    (v) => v.actions.onEditModerators
  );
  const { authLevel } = useKeyContext((v) => v.myState);
  const [dropdownShown, setDropdownShown] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const { handleSearch, searching } = useSearch({
    onSearch: handleUserSearch,
    onClear: () => setSearchedUsers([]),
    onSetSearchText: setSearchText
  });
  const TableContent = useMemo(() => {
    return selectedUsers.map((user) => {
      const dropdownMenu = accountTypes
        .filter((accountType) => accountType.label !== user.userType)
        .map((accountType) => ({
          label: capitalize(accountType.label),
          onClick: () =>
            handleAccountTypeClick({
              type: accountType.label,
              userId: user.id
            })
        }));
      if (user.userType) {
        dropdownMenu.push({
          label: (
            <>
              <Icon icon="trash-alt" />
              <span style={{ marginLeft: '1rem' }}>Remove</span>
            </>
          ),
          onClick: () =>
            handleAccountTypeClick({
              type: null,
              userId: user.id
            })
        });
      }
      return (
        <tr key={user.id}>
          <td>
            <span style={{ fontWeight: 'bold', fontSize: '1.7rem' }}>
              {user.username}
            </span>
            <small
              style={{
                color: Color.lightGray(),
                marginLeft: '0.7rem',
                fontSize: '1rem'
              }}
            >
              ({user.realName})
            </small>
          </td>
          <td style={{ display: 'flex', alignItems: 'center' }}>
            <DropdownButton
              style={{ position: 'absolute' }}
              icon="chevron-down"
              skeuomorphic
              text={user.userType || 'Not Selected'}
              color="darkerGray"
              onDropdownShown={setDropdownShown}
              menuProps={dropdownMenu}
            />
          </td>
        </tr>
      );
    });
  }, [accountTypes, selectedUsers]);

  return (
    <Modal closeWhenClickedOutside={!dropdownShown} onHide={onHide}>
      <header>Add / Edit Moderators</header>
      <main>
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
        {selectedUsers.length > 0 && (
          <Table columns="2fr 1fr" style={{ marginTop: '1.5rem' }}>
            <thead>
              <tr>
                <th>User</th>
                <th>Account Type</th>
              </tr>
            </thead>
            <tbody>{TableContent}</tbody>
          </Table>
        )}
        {selectedUsers.length === 0 && (
          <div
            style={{
              marginTop: '5rem',
              fontSize: '2.5rem',
              fontWeight: 'bold',
              paddingBottom: '3.5rem'
            }}
          >
            No users selected
          </div>
        )}
        {searching && (
          <Loading style={{ position: 'absolute', marginTop: '1rem' }} />
        )}
      </main>
      <footer>
        <Button transparent onClick={onHide} style={{ marginRight: '0.7rem' }}>
          Cancel
        </Button>
        <Button color={doneColor} onClick={handleSubmit}>
          Done
        </Button>
      </footer>
    </Modal>
  );

  function handleAccountTypeClick({ type, userId }) {
    setSelectedUsers((users) =>
      users.map((user) =>
        user.id === userId
          ? {
              ...user,
              userType: type
            }
          : user
      )
    );
  }

  function handleSelectUser(user) {
    setSelectedUsers((users) => users.concat(user));
    setSearchedUsers([]);
    setSearchText('');
  }

  async function handleSubmit() {
    const newModerators = selectedUsers.filter((user) => !!user.userType);
    await addModerators(newModerators);
    onEditModerators(newModerators);
    onHide();
  }

  async function handleUserSearch(text) {
    const users = await searchUsers(text);
    const result = users.filter((user) => user.authLevel < authLevel);
    setSearchedUsers(result);
  }
}

import React, { useMemo, useState } from 'react';
import Button from '~/components/Button';
import Modal from '~/components/Modal';
import Loading from '~/components/Loading';
import SearchInput from '~/components/Texts/SearchInput';
import DropdownButton from '~/components/Buttons/DropdownButton';
import Table from '../../Table';
import Icon from '~/components/Icon';
import { useAppContext, useManagementContext, useKeyContext } from '~/contexts';
import { useSearch } from '~/helpers/hooks';
import { Color } from '~/constants/css';
import { capitalize } from '~/helpers/stringHelpers';
import localize from '~/constants/localize';

const searchUsersLabel = localize('searchUsers');

export default function AddModeratorModal({
  accountTypes,
  onHide
}: {
  accountTypes: any[];
  onHide: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const doneColor = useKeyContext((v) => v.theme.done.color);
  const level = useKeyContext((v) => v.myState.level);
  const addModerators = useAppContext((v) => v.requestHelpers.addModerators);
  const searchUsers = useAppContext((v) => v.requestHelpers.searchUsers);
  const onEditModerators = useManagementContext(
    (v) => v.actions.onEditModerators
  );
  const [dropdownShown, setDropdownShown] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const { handleSearch, searching } = useSearch({
    onSearch: handleUserSearch,
    onClear: () => setSearchedUsers([]),
    onSetSearchText: setSearchText
  });
  const TableContent = useMemo(() => {
    return selectedUsers.map(
      (user: {
        id: number;
        username: string;
        realName: string;
        userType: string;
      }) => {
        const dropdownMenu: { label: any; onClick: () => void }[] = accountTypes
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
                type: '',
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
      }
    );
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
          onClickOutSide={() => {
            setSearchText('');
            setSearchedUsers([]);
          }}
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
        <Button loading={loading} color={doneColor} onClick={handleSubmit}>
          Done
        </Button>
      </footer>
    </Modal>
  );

  function handleAccountTypeClick({
    type,
    userId
  }: {
    type: string;
    userId: number;
  }) {
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

  function handleSelectUser(user: any) {
    setSelectedUsers((users) => users.concat(user));
    setSearchedUsers([]);
    setSearchText('');
  }

  async function handleSubmit() {
    setLoading(true);
    const newModerators = selectedUsers.filter((user) => !!user.userType);
    await addModerators(newModerators);
    onEditModerators(newModerators);
    onHide();
  }

  async function handleUserSearch(text: string) {
    const users = await searchUsers(text);
    const result = users.filter((user: { level: number }) => {
      return level > user.level;
    });
    setSearchedUsers(result);
  }
}

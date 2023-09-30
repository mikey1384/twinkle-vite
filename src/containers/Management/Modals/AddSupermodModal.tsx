import React, { useMemo, useState } from 'react';
import Button from '~/components/Button';
import Modal from '~/components/Modal';
import Loading from '~/components/Loading';
import SearchInput from '~/components/Texts/SearchInput';
import DropdownButton from '~/components/Buttons/DropdownButton';
import Table from '../Table';
import Icon from '~/components/Icon';
import { useAppContext, useManagementContext, useKeyContext } from '~/contexts';
import {
  MENTOR_ACHIEVEMENT_ID,
  SAGE_ACHIEVEMENT_ID,
  TWINKLE_FOUNDER_ACHIEVEMENT_ID
} from '~/constants/defaultValues';
import { useSearch } from '~/helpers/hooks';
import { Color } from '~/constants/css';
import localize from '~/constants/localize';

const searchUsersLabel = localize('searchUsers');

export default function AddSupermodModal({ onHide }: { onHide: () => void }) {
  const [loading, setLoading] = useState(false);
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const { level } = useKeyContext((v) => v.myState);
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
        unlockedAchievementIds?: number[];
      }) => {
        const dropdownMenu: { label: any; onClick: () => void }[] = [
          {
            label: 'Mentor',
            onClick: () => console.log('MENTOR clicked')
          },
          {
            label: 'Sage',
            onClick: () => console.log('SAGE clicked')
          },
          {
            label: 'Founder',
            onClick: () => console.log('FOUNDER clicked')
          }
        ];
        const isMentor = user.unlockedAchievementIds?.includes(
          MENTOR_ACHIEVEMENT_ID
        );
        const isSage =
          user.unlockedAchievementIds?.includes(SAGE_ACHIEVEMENT_ID);
        const isTwinkleFounder = user.unlockedAchievementIds?.includes(
          TWINKLE_FOUNDER_ACHIEVEMENT_ID
        );
        let userPosition = '';
        if (isMentor) userPosition = 'Mentor';
        if (isSage) userPosition = 'Sage';
        if (isTwinkleFounder) userPosition = 'Founder';

        if (userPosition) {
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
                text={userPosition || 'Not Selected'}
                color="darkerGray"
                onDropdownShown={setDropdownShown}
                menuProps={dropdownMenu}
              />
            </td>
          </tr>
        );
      }
    );
  }, [selectedUsers]);

  return (
    <Modal closeWhenClickedOutside={!dropdownShown} onHide={onHide}>
      <header>Add / Edit Supermods</header>
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
          searchResults={searchedUsers.filter(
            (user: { unlockedAchievementIds: number[] }) => {
              return !user.unlockedAchievementIds.length;
            }
          )}
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
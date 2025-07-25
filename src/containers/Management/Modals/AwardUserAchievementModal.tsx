import React, { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import SearchInput from '~/components/Texts/SearchInput';
import Loading from '~/components/Loading';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { useAppContext, useKeyContext } from '~/contexts';
import { useSearch } from '~/helpers/hooks';
import { css } from '@emotion/css';
import localize from '~/constants/localize';
import AchievementBadges from '~/components/AchievementBadges';

const searchUsersLabel = localize('searchUsers');

export default function AwardUserAchievementModal({
  achievementType,
  onHide
}: {
  achievementType: string;
  onHide: () => void;
}) {
  const doneColor = useKeyContext((v) => v.theme.done.color);
  const grantAchievements = useAppContext(
    (v) => v.requestHelpers.grantAchievements
  );
  const [posting, setPosting] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [searchedUsers, setSearchedUsers] = useState([]);
  const searchUsersWithAchievements = useAppContext(
    (v) => v.requestHelpers.searchUsersWithAchievements
  );
  const { handleSearch, searching } = useSearch({
    onSearch: handleUserSearch,
    onClear: () => setSearchedUsers([]),
    onSetSearchText: setSearchText
  });

  return (
    <ErrorBoundary componentPath="Management/Main/Achievements/AwardUserAchievementModal">
      <Modal wrapped onHide={onHide}>
        <header>Grant {`"${achievementType}"`} Achievement</header>
        <main
          className={css`
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
          `}
        >
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
            <div
              className={css`
                margin-top: 1.5rem;
                width: 100%;
              `}
            >
              {selectedUsers.map((user) => {
                const hasAchievement =
                  user.achievements[achievementType]?.isUnlocked;
                return (
                  <div
                    key={user.id}
                    className={css`
                      display: flex;
                      align-items: center;
                      justify-content: space-between;
                      padding: 0.75rem 1rem;
                      margin-bottom: 0.5rem;
                      background-color: ${hasAchievement
                        ? Color.highlightGray()
                        : Color.whiteGray()};
                      border: 1px solid #e0e0e0;
                      border-radius: 4px;
                      transition: all 0.2s ease-in-out;
                      opacity: ${hasAchievement ? 0.7 : 1};
                    `}
                  >
                    <div
                      className={css`
                        display: grid;
                        grid-template-columns: 1fr auto 1fr;
                        width: 100%;
                        align-items: center;
                        gap: 1rem;
                      `}
                    >
                      <div>
                        <div
                          className={css`
                            font-weight: 600;
                            font-size: 1.3rem;
                          `}
                        >
                          {user.username}
                        </div>
                        <div
                          className={css`
                            color: #666;
                            font-size: 1rem;
                          `}
                        >
                          {user.realName}
                        </div>
                        {hasAchievement && (
                          <div
                            className={css`
                              color: ${Color.darkerGray()};
                              font-size: 0.9rem;
                              font-weight: bold;
                              font-style: italic;
                              margin-top: 0.3rem;
                            `}
                          >
                            Already unlocked this achievement
                          </div>
                        )}
                      </div>
                      <AchievementBadges
                        unlockedAchievementIds={Object.keys(user.achievements)
                          .filter((key) => user.achievements[key].isUnlocked)
                          .map((key) => user.achievements[key].id)}
                        thumbSize="2.5rem"
                      />
                      <div
                        className={css`
                          display: flex;
                          justify-content: flex-end;
                        `}
                      >
                        <button
                          className={css`
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            background: none;
                            border: none;
                            color: ${Color.darkGray()};
                            cursor: pointer;
                            font-size: 1.1rem;
                            padding: 0.3rem 0.5rem;
                            transition: all 0.2s;
                            gap: 0.1rem;

                            &:hover {
                              color: ${Color.black()};
                            }

                            span {
                              margin-left: 0.3rem;
                            }
                          `}
                          onClick={() => handleRemoveUser(user.id)}
                        >
                          <Icon icon="times" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
          <Button onClick={onHide} transparent>
            Close
          </Button>
          <Button
            color={doneColor}
            onClick={handleSubmit}
            loading={posting}
            disabled={
              selectedUsers.filter(
                (user) => !user.achievements[achievementType]?.isUnlocked
              ).length === 0
            }
          >
            Grant
          </Button>
        </footer>
      </Modal>
    </ErrorBoundary>
  );

  function handleSelectUser(user: any) {
    setSelectedUsers((users) => [...users, user]);
    setSearchedUsers([]);
    setSearchText('');
  }

  function handleRemoveUser(userId: number) {
    setSelectedUsers((users) => users.filter((user) => user.id !== userId));
  }

  async function handleSubmit() {
    const usersToGrant = selectedUsers.filter(
      (user) => !user.achievements[achievementType]?.isUnlocked
    );

    if (usersToGrant.length > 0) {
      setPosting(true);
      try {
        await grantAchievements({
          targetUserIds: usersToGrant.map((user) => user.id),
          achievementType
        });
      } catch (error) {
        console.error('Error granting achievements:', error);
        // Handle the error (e.g., show an error message to the user)
      } finally {
        setPosting(false);
        onHide();
      }
    }
  }

  async function handleUserSearch(text: string) {
    const users = await searchUsersWithAchievements(text);
    const filteredUsers = users.filter(
      (user: any) =>
        !selectedUsers.some((selectedUser: any) => selectedUser.id === user.id)
    );
    setSearchedUsers(filteredUsers);
  }
}

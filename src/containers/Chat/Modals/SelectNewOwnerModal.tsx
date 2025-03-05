import React, { useMemo, useState, useCallback } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import SearchInput from '~/components/Texts/SearchInput';
import { useKeyContext, useAppContext } from '~/contexts';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { isSupermod } from '~/helpers';
import { useSearch } from '~/helpers/hooks';
import Loading from '~/components/Loading';
import CheckListGroup from '~/components/CheckListGroup';
import localize from '~/constants/localize';

const searchUsersLabel = localize('searchUsers');

export default function SelectNewOwnerModal({
  andLeave = false,
  isClass,
  loading,
  members,
  modalOverModal,
  onHide,
  onSubmit,
  channelId
}: {
  andLeave?: boolean;
  isClass: boolean;
  loading?: boolean;
  members: any[];
  modalOverModal?: boolean;
  onHide: () => void;
  onSubmit: (arg0: { newOwner: any; andLeave: boolean }) => void;
  channelId: number;
}) {
  const { userId } = useKeyContext((v) => v.myState);
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const searchChannelMembers = useAppContext(
    (v) => v.requestHelpers.searchChannelMembers
  );
  const [searchText, setSearchText] = useState('');
  const [searchedMembers, setSearchedMembers] = useState<any[]>([]);

  const handleSearchMembers = useCallback(
    async (text: string) => {
      if (text.length > 2) {
        const data = await searchChannelMembers({
          channelId,
          searchText: text
        });
        setSearchedMembers(data);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [channelId]
  );

  const { handleSearch, searching } = useSearch({
    onSearch: handleSearchMembers,
    onClear: () => setSearchedMembers([]),
    onSetSearchText: setSearchText
  });

  const shownMembers = useMemo(() => {
    if (!stringIsEmpty(searchText) && searchedMembers.length > 0) {
      return searchedMembers.filter(
        (member) =>
          member.id !== userId && (!isClass || isSupermod(member.level))
      );
    }
    return members.filter((member) => {
      return (
        member.id !== userId &&
        (stringIsEmpty(searchText) || member.username.includes(searchText)) &&
        (!isClass || isSupermod(member.level))
      );
    });
  }, [isClass, members, searchText, userId, searchedMembers]);

  const [selectedUser, setSelectedUser] = useState<any>(null);

  return (
    <Modal modalOverModal={modalOverModal} onHide={onHide}>
      <header>Select New Channel Owner</header>
      <main>
        {!stringIsEmpty(searchText) || shownMembers.length > 0 ? (
          <>
            <SearchInput
              autoFocus
              onChange={handleSearch}
              placeholder={`${searchUsersLabel}...`}
              value={searchText}
            />
            <CheckListGroup
              style={{ marginTop: '1.5rem' }}
              onSelect={(index: number) => setSelectedUser(shownMembers[index])}
              listItems={shownMembers.map((member) => ({
                label: member.username,
                checked: member.id === selectedUser?.id
              }))}
            />
            {searching && (
              <Loading style={{ marginTop: '1rem', position: 'absolute' }} />
            )}
          </>
        ) : isClass ? (
          <div
            style={{
              fontSize: '1.7rem',
              height: '30vh',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <div>
              You are the only teacher in this class group. Bring in another
              teacher first.
            </div>
          </div>
        ) : (
          <div
            style={{
              fontSize: '1.7rem',
              height: '30vh',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            You are the only member of this group
          </div>
        )}
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          Cancel
        </Button>
        <Button
          color={doneColor}
          disabled={!selectedUser}
          loading={loading}
          onClick={() => onSubmit({ newOwner: selectedUser, andLeave })}
        >
          Done
        </Button>
      </footer>
    </Modal>
  );
}

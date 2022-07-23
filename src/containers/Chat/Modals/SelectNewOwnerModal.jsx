import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import SearchInput from '~/components/Texts/SearchInput';
import { useKeyContext } from '~/contexts';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import CheckListGroup from '~/components/CheckListGroup';
import localize from '~/constants/localize';

const searchUsersLabel = localize('searchUsers');

SelectNewOwnerModal.propTypes = {
  andLeave: PropTypes.bool,
  isClass: PropTypes.bool,
  members: PropTypes.array.isRequired,
  modalOverModal: PropTypes.bool,
  onHide: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
};

export default function SelectNewOwnerModal({
  andLeave,
  isClass,
  members,
  modalOverModal,
  onHide,
  onSubmit
}) {
  const { userId } = useKeyContext((v) => v.myState);
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const [searchText, setSearchText] = useState('');
  const shownMembers = useMemo(() => {
    return members.filter(
      (member) =>
        member.id !== userId &&
        (stringIsEmpty(searchText) || member.username.includes(searchText)) &&
        (!isClass || member.authLevel > 2)
    );
  }, [isClass, members, searchText, userId]);
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <Modal modalOverModal={modalOverModal} onHide={onHide}>
      <header>Select New Channel Owner</header>
      <main>
        {!stringIsEmpty(searchText) || shownMembers.length > 0 ? (
          <>
            <SearchInput
              autoFocus
              onChange={(text) => setSearchText(text)}
              placeholder={`${searchUsersLabel}...`}
              value={searchText}
            />
            <CheckListGroup
              style={{ marginTop: '1.5rem' }}
              onSelect={(index) => setSelectedUser(shownMembers[index])}
              listItems={shownMembers.map((member) => ({
                label: member.username,
                checked: member.id === selectedUser?.id
              }))}
            />
          </>
        ) : isClass ? (
          <div style={{ fontSize: '1.7rem' }}>
            You are the only teacher in this class group. Bring in another
            teacher first.
          </div>
        ) : (
          <div style={{ fontSize: '1.7rem' }}>
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
          onClick={() => onSubmit({ newOwner: selectedUser, andLeave })}
        >
          Done
        </Button>
      </footer>
    </Modal>
  );
}

import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import DropdownButton from '~/components/Buttons/DropdownButton';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { capitalize } from '~/helpers/stringHelpers';
import { useAppContext, useManagementContext, useKeyContext } from '~/contexts';

EditModeratorModal.propTypes = {
  accountTypes: PropTypes.array,
  onHide: PropTypes.func.isRequired,
  target: PropTypes.object
};

export default function EditModeratorModal({ accountTypes, onHide, target }) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const changeAccountType = useAppContext(
    (v) => v.requestHelpers.changeAccountType
  );
  const onChangeModeratorAccountType = useManagementContext(
    (v) => v.actions.onChangeModeratorAccountType
  );
  const [dropdownShown, setDropdownShown] = useState(false);
  const [selectedAccountType, setSelectedAccountType] = useState(
    target.userType
  );
  const editMenuItems = useMemo(() => {
    const dropdownMenu = accountTypes
      .filter((accountType) => accountType.label !== selectedAccountType)
      .map((accountType) => ({
        label: capitalize(accountType.label),
        onClick: () => setSelectedAccountType(accountType.label)
      }));
    if (selectedAccountType) {
      dropdownMenu.push({
        label: (
          <>
            <Icon icon="trash-alt" />
            <span style={{ marginLeft: '1rem' }}>Remove</span>
          </>
        ),
        onClick: () => setSelectedAccountType(null)
      });
    }
    return dropdownMenu;
  }, [accountTypes, selectedAccountType]);

  return (
    <Modal closeWhenClickedOutside={!dropdownShown} onHide={onHide}>
      <header
        style={{ display: 'block' }}
      >{`Change Moderator Account Type:`}</header>
      <main>
        <div
          style={{
            marginTop: '1rem',
            fontWeight: 'bold',
            fontSize: '2rem',
            color: Color.logoBlue()
          }}
        >
          {target.username}
        </div>
        <DropdownButton
          style={{ marginTop: '1rem' }}
          icon="chevron-down"
          skeuomorphic
          text={selectedAccountType || 'Not Selected'}
          color="darkerGray"
          menuProps={editMenuItems}
          onDropdownShown={setDropdownShown}
        />
      </main>
      <footer>
        <Button transparent onClick={onHide} style={{ marginRight: '0.7rem' }}>
          Cancel
        </Button>
        <Button
          color={doneColor}
          disabled={target.userType === selectedAccountType}
          onClick={handleSubmit}
        >
          Done
        </Button>
      </footer>
    </Modal>
  );

  async function handleSubmit() {
    await changeAccountType({ userId: target.id, selectedAccountType });
    onChangeModeratorAccountType({ userId: target.id, selectedAccountType });
    onHide();
  }
}

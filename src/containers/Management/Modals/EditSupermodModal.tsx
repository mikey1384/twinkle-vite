import React, { useMemo, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import DropdownButton from '~/components/Buttons/DropdownButton';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { useAppContext, useManagementContext, useKeyContext } from '~/contexts';

export default function EditSupermodModal({
  onHide,
  target
}: {
  onHide: () => void;
  target: any;
}) {
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
    const dropdownMenu: { label: any; onClick: () => void }[] = [
      {
        label: 'SAGE',
        onClick: () => console.log('SAGE clicked')
      },
      {
        label: 'FOUNDER',
        onClick: () => console.log('FOUNDER clicked')
      }
    ];
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
  }, [selectedAccountType]);

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

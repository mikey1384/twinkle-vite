import React, { useMemo, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import DropdownButton from '~/components/Buttons/DropdownButton';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { capitalize } from '~/helpers/stringHelpers';
import { useAppContext, useManagementContext, useKeyContext } from '~/contexts';

export default function EditModeratorModal({
  accountTypes,
  onHide,
  target
}: {
  accountTypes: any;
  onHide: () => void;
  target: any;
}) {
  const [submitting, setSubmitting] = useState(false);
  const doneColor = useKeyContext((v) => v.theme.done.color);
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
      .filter(
        (accountType: { label: string }) =>
          accountType.label !== selectedAccountType
      )
      .map((accountType: { label: string }) => ({
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
          loading={submitting}
          disabled={target.userType === selectedAccountType}
          onClick={handleSubmit}
        >
          Done
        </Button>
      </footer>
    </Modal>
  );

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await changeAccountType({ userId: target.id, selectedAccountType });
      onChangeModeratorAccountType({
        userId: target.id,
        selectedAccountType
      });
    } catch (error) {
      console.error(error);
    } finally {
      onHide();
    }
  }
}

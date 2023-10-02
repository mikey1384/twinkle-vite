import React, { useMemo, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import DropdownButton from '~/components/Buttons/DropdownButton';
import Icon from '~/components/Icon';
import {
  MENTOR_ACHIEVEMENT_ID,
  SAGE_ACHIEVEMENT_ID,
  TWINKLE_FOUNDER_ACHIEVEMENT_ID,
  MENTOR_LABEL,
  SAGE_LABEL,
  FOUNDER_LABEL,
  roles
} from '~/constants/defaultValues';
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
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const changeSupermodRole = useAppContext(
    (v) => v.requestHelpers.changeSupermodRole
  );
  const onSetSupermodState = useManagementContext(
    (v) => v.actions.onSetSupermodState
  );
  const [dropdownShown, setDropdownShown] = useState(false);
  const role = useMemo(() => {
    const isMentor = target.unlockedAchievementIds?.includes(
      MENTOR_ACHIEVEMENT_ID
    );
    const isSage = target.unlockedAchievementIds?.includes(SAGE_ACHIEVEMENT_ID);
    const isTwinkleFounder = target.unlockedAchievementIds?.includes(
      TWINKLE_FOUNDER_ACHIEVEMENT_ID
    );
    let result = '';
    if (isMentor) result = MENTOR_LABEL;
    if (isSage) result = SAGE_LABEL;
    if (isTwinkleFounder) result = FOUNDER_LABEL;
    return result;
  }, [target]);
  const [selectedRole, setSelectedRole] = useState(role);

  const editMenuItems = useMemo(() => {
    const dropdownMenu: { label: any; onClick: () => void }[] = [
      {
        label: MENTOR_LABEL,
        onClick: () => setSelectedRole(MENTOR_LABEL)
      },
      {
        label: SAGE_LABEL,
        onClick: () => setSelectedRole(SAGE_LABEL)
      },
      {
        label: FOUNDER_LABEL,
        onClick: () => setSelectedRole(FOUNDER_LABEL)
      }
    ].filter((item) => item.label !== selectedRole);

    if (selectedRole) {
      dropdownMenu.push({
        label: (
          <>
            <Icon icon="trash-alt" />
            <span style={{ marginLeft: '1rem' }}>Remove</span>
          </>
        ),
        onClick: () => setSelectedRole('')
      });
    }
    return dropdownMenu;
  }, [selectedRole]);

  return (
    <Modal closeWhenClickedOutside={!dropdownShown} onHide={onHide}>
      <header style={{ display: 'block' }}>{`Manage Supermod Role`}</header>
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
          text={selectedRole || 'Not Selected'}
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
          disabled={role === selectedRole}
          onClick={handleSubmit}
        >
          Done
        </Button>
      </footer>
    </Modal>
  );

  async function handleSubmit() {
    const { unlockedAchievementIds, level, achievementPoints, title } =
      await changeSupermodRole({
        userId: target.id,
        role: selectedRole ? roles[selectedRole] : null
      });
    onSetUserState({
      userId: target.id,
      newState: { achievementPoints, title }
    });
    onSetSupermodState({
      userId: target.id,
      newState: { unlockedAchievementIds, level }
    });
    onHide();
  }
}

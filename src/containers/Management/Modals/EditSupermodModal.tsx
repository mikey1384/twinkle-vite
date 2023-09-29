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
  FOUNDER_LABEL
} from '~/constants/defaultValues';
import { Color } from '~/constants/css';
import { useAppContext, useKeyContext } from '~/contexts';

const roles: Record<string, string> = {
  [MENTOR_LABEL]: 'mentor',
  [SAGE_LABEL]: 'sage',
  [FOUNDER_LABEL]: 'twinkle_founder'
};

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
  const changeSupermodRole = useAppContext(
    (v) => v.requestHelpers.changeSupermodRole
  );
  const [dropdownShown, setDropdownShown] = useState(false);
  const userPosition = useMemo(() => {
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
  const [selectedPosition, setSelectedPosition] = useState(userPosition);

  const editMenuItems = useMemo(() => {
    const dropdownMenu: { label: any; onClick: () => void }[] = [
      {
        label: MENTOR_LABEL,
        onClick: () => setSelectedPosition(MENTOR_LABEL)
      },
      {
        label: SAGE_LABEL,
        onClick: () => setSelectedPosition(SAGE_LABEL)
      },
      {
        label: FOUNDER_LABEL,
        onClick: () => setSelectedPosition(FOUNDER_LABEL)
      }
    ].filter((item) => item.label !== selectedPosition);

    if (selectedPosition) {
      dropdownMenu.push({
        label: (
          <>
            <Icon icon="trash-alt" />
            <span style={{ marginLeft: '1rem' }}>Remove</span>
          </>
        ),
        onClick: () => setSelectedPosition('')
      });
    }
    return dropdownMenu;
  }, [selectedPosition]);

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
          text={selectedPosition || 'Not Selected'}
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
          disabled={userPosition === selectedPosition}
          onClick={handleSubmit}
        >
          Done
        </Button>
      </footer>
    </Modal>
  );

  async function handleSubmit() {
    await changeSupermodRole({
      userId: target.id,
      role: roles[selectedPosition]
    });
    onHide();
  }
}

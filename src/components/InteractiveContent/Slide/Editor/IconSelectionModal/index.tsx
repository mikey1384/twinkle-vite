import React, { useMemo, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import IconMenu from './IconMenu';
import { isEqual } from 'lodash';
import { useRoleColor } from '~/theme/useRoleColor';
import { Color } from '~/constants/css';

export default function IconSelectionModal({
  onHide,
  onSelectIcon,
  selectedIcon: prevSelectedIcon
}: {
  onHide: () => void;
  onSelectIcon: (arg0: any) => void;
  selectedIcon: any;
}) {
  const doneRole = useRoleColor('done', { fallback: 'blue' });
  const doneColor = useMemo(
    () => doneRole.getColor() || Color.blue(),
    [doneRole]
  );
  const [selectedIcon, setSelectedIcon] = useState(prevSelectedIcon);
  return (
    <Modal onHide={onHide}>
      <header>Select an icon</header>
      <main>
        <IconMenu
          selectedIcon={selectedIcon}
          onSelectIcon={(icon) =>
            setSelectedIcon((prevIcon: any) => {
              if (isEqual(prevIcon, icon)) return null;
              return icon;
            })
          }
        />
      </main>
      <footer>
        <Button variant="ghost" onClick={onHide} style={{ marginRight: '0.7rem' }}>
          Cancel
        </Button>
        <Button
          color={doneColor}
          onClick={() => {
            onSelectIcon(selectedIcon);
            onHide();
          }}
        >
          Done
        </Button>
      </footer>
    </Modal>
  );
}

import React, { useEffect, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Loading from '~/components/Loading';
import { css } from '@emotion/css';
import { useAppContext, useKeyContext } from '~/contexts';
import GroupItem from './GroupItem';

export default function SelectGroupsModal({
  onHide,
  onSelectDone,
  currentlySelectedGroupIds
}: {
  onHide: () => void;
  onSelectDone: (groupIds: number[]) => void;
  currentlySelectedGroupIds: number[];
}) {
  const [groups] = useState<any[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>(
    currentlySelectedGroupIds
  );
  const [loading] = useState(true);
  const loadPublicGroups = useAppContext(
    (v) => v.requestHelpers.loadPublicGroups
  );
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);

  useEffect(() => {
    init();
    async function init() {
      console.log('initing');
    }
  }, [loadPublicGroups]);

  const handleGroupSelect = (groupId: number) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  return (
    <Modal large wrapped modalOverModal onHide={onHide}>
      <header>Select Groups</header>
      <main>
        {loading ? (
          <Loading />
        ) : (
          <div
            className={css`
              display: flex;
              flex-direction: column;
              gap: 1rem;
              max-height: 70vh;
              overflow-y: auto;
            `}
          >
            {groups.map((group) => (
              <GroupItem
                key={group.id}
                group={group}
                isSelected={selectedGroupIds.includes(group.id)}
                onSelect={handleGroupSelect}
              />
            ))}
          </div>
        )}
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          Cancel
        </Button>
        <Button
          disabled={selectedGroupIds.length === 0}
          color={doneColor}
          onClick={() => onSelectDone(selectedGroupIds)}
        >
          Done
        </Button>
      </footer>
    </Modal>
  );
}

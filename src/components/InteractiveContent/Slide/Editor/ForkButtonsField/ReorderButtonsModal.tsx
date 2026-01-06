import React, { useMemo, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Modal from '~/components/Modal';
import LegacyModalLayout from '~/components/Modal/LegacyModalLayout';
import SortableListGroup from '~/components/SortableListGroup';
import Button from '~/components/Button';
import { isEqual } from 'lodash';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { isMobile } from '~/helpers';
import { useRoleColor } from '~/theme/useRoleColor';
import { Color } from '~/constants/css';

const Backend = isMobile(navigator) ? TouchBackend : HTML5Backend;

export default function ReorderButtonsModal({
  onHide,
  forkButtonsObj,
  forkButtonIds: initialButtonIds,
  onSubmit
}: {
  onHide: () => void;
  forkButtonsObj: any;
  forkButtonIds: number[];
  onSubmit: (arg: any) => void;
}) {
  const doneRole = useRoleColor('done', { fallback: 'blue' });
  const doneColor = useMemo(
    () => doneRole.getColor() || Color.blue(),
    [doneRole]
  );
  const [forkButtonIds, setForkButtonIds] = useState(initialButtonIds);
  return (
    <ErrorBoundary componentPath="ForkButtonsField/ReorderButtonsModal">
      <DndProvider backend={Backend}>
        <Modal
          modalKey="ReorderButtonsModal"
          isOpen
          size="sm"
          onClose={onHide}
          hasHeader={false}
          bodyPadding={0}
        >
          <LegacyModalLayout>
            <header>Reorder Buttons</header>
            <main>
              <SortableListGroup
                listItemObj={forkButtonsObj}
                onMove={handleMove}
                itemIds={forkButtonIds}
              />
            </main>
            <footer>
              <Button
                variant="ghost"
                style={{ marginRight: '0.7rem' }}
                onClick={onHide}
              >
                Cancel
              </Button>
              <Button
                disabled={isEqual(initialButtonIds, forkButtonIds)}
                color={doneColor}
                onClick={handleSubmit}
              >
                Done
              </Button>
            </footer>
          </LegacyModalLayout>
        </Modal>
      </DndProvider>
    </ErrorBoundary>
  );

  function handleMove({
    sourceId,
    targetId
  }: {
    sourceId: number;
    targetId: number;
  }) {
    const sourceIndex = forkButtonIds.indexOf(sourceId);
    const targetIndex = forkButtonIds.indexOf(targetId);
    const newForkButtonIds = [...forkButtonIds];
    newForkButtonIds.splice(sourceIndex, 1);
    newForkButtonIds.splice(targetIndex, 0, sourceId);
    setForkButtonIds(newForkButtonIds);
  }

  async function handleSubmit() {
    onSubmit(forkButtonIds);
    onHide();
  }
}

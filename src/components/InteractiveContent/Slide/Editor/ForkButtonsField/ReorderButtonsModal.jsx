import React, { useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import Modal from '~/components/Modal';
import SortableListGroup from '~/components/SortableListGroup';
import Button from '~/components/Button';
import { useKeyContext } from '~/contexts';
import { isEqual } from 'lodash';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { isMobile } from '~/helpers';

const Backend = isMobile(navigator) ? TouchBackend : HTML5Backend;

ReorderButtonsModal.propTypes = {
  onHide: PropTypes.func.isRequired,
  forkButtonsObj: PropTypes.object.isRequired,
  forkButtonIds: PropTypes.array.isRequired,
  onSubmit: PropTypes.func.isRequired
};

export default function ReorderButtonsModal({
  onHide,
  forkButtonsObj,
  forkButtonIds: initialButtonIds,
  onSubmit
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const [forkButtonIds, setForkButtonIds] = useState(initialButtonIds);
  return (
    <ErrorBoundary componentPath="ForkButtonsField/ReorderButtonsModal">
      <DndProvider backend={Backend}>
        <Modal small onHide={onHide}>
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
              transparent
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
        </Modal>
      </DndProvider>
    </ErrorBoundary>
  );

  function handleMove({ sourceId, targetId }) {
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

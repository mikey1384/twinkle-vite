import React, { useMemo, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import SortableListGroup from '~/components/SortableListGroup';
import { isEqual } from 'lodash';
import { useRoleColor } from '~/theme/useRoleColor';
import { Color } from '~/constants/css';

const titleLabel = 'Reorder Profile Sections';
const hintLabel = 'Messages stay pinned at the bottom.';

export default function ReorderSectionsModal({
  initialSectionOrder,
  sectionLabels,
  onHide,
  onSubmit
}: {
  initialSectionOrder: string[];
  sectionLabels: Record<string, string>;
  onHide: () => void;
  onSubmit: (sectionOrder: string[]) => void;
}) {
  const doneRole = useRoleColor('done', { fallback: 'blue' });
  const doneColor = useMemo(
    () => doneRole.getColor() || Color.blue(),
    [doneRole]
  );
  const [sectionOrder, setSectionOrder] = useState(initialSectionOrder);
  const listItemObj = useMemo(() => {
    const obj: Record<string, { label: string }> = {};
    for (const key of Object.keys(sectionLabels)) {
      obj[key] = { label: sectionLabels[key] };
    }
    return obj;
  }, [sectionLabels]);

  return (
    <Modal onHide={onHide}>
      <header>{titleLabel}</header>
      <main>
        <div style={{ marginBottom: '1.5rem', color: Color.darkGray() }}>
          {hintLabel}
        </div>
        <SortableListGroup
          listItemLabel="label"
          listItemObj={listItemObj}
          onMove={handleMove}
          itemIds={sectionOrder}
        />
      </main>
      <footer>
        <Button variant="ghost" style={{ marginRight: '0.7rem' }} onClick={onHide}>
          Cancel
        </Button>
        <Button
          disabled={isEqual(sectionOrder, initialSectionOrder)}
          color={doneColor}
          onClick={() => onSubmit(sectionOrder)}
        >
          Done
        </Button>
      </footer>
    </Modal>
  );

  function handleMove({
    sourceId,
    targetId
  }: {
    sourceId: string;
    targetId: string;
  }) {
    const sourceIndex = sectionOrder.indexOf(sourceId);
    const targetIndex = sectionOrder.indexOf(targetId);
    const nextOrder = [...sectionOrder];
    nextOrder.splice(sourceIndex, 1);
    nextOrder.splice(targetIndex, 0, sourceId);
    setSectionOrder(nextOrder);
  }
}

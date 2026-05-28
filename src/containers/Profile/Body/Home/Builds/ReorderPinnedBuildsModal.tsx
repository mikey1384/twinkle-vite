import React, { useMemo, useState } from 'react';
import Modal from '~/components/Modal';
import LegacyModalLayout from '~/components/Modal/LegacyModalLayout';
import Button from '~/components/Button';
import SortableListGroup from '~/components/SortableListGroup';
import type { BuildProjectListItemData } from '~/components/Build/ProjectListItem';
import { isEqual } from 'lodash';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import { Color } from '~/constants/css';

const titleLabel = 'Reorder Pinned Builds';

export default function ReorderPinnedBuildsModal({
  builds,
  initialBuildIds,
  onHide,
  onSubmit
}: {
  builds: BuildProjectListItemData[];
  initialBuildIds: number[];
  onHide: () => void;
  onSubmit: (buildIds: number[]) => Promise<void> | void;
}) {
  const doneRole = useRoleColor('done', { fallback: 'blue' });
  const doneColor = useMemo(
    () => doneRole.getColor() || Color.blue(),
    [doneRole]
  );
  const [buildIds, setBuildIds] = useState(initialBuildIds);
  const [submitting, setSubmitting] = useState(false);
  const listItemObj = useMemo(() => {
    const obj: Record<number, { title: string }> = {};
    for (const build of builds) {
      const buildId = Number(build?.id);
      if (!Number.isFinite(buildId) || buildId <= 0) continue;
      obj[buildId] = { title: build.title || `Build ${buildId}` };
    }
    return obj;
  }, [builds]);

  return (
    <Modal
      modalKey="ReorderPinnedBuilds"
      isOpen
      onClose={() => {
        if (submitting) return;
        onHide();
      }}
      hasHeader={false}
      bodyPadding={0}
    >
      <LegacyModalLayout>
        <header>{titleLabel}</header>
        <main>
          <SortableListGroup
            numbered
            listItemLabel="title"
            listItemObj={listItemObj}
            onMove={handleMove}
            itemIds={buildIds}
          />
        </main>
        <footer>
          <Button
            variant="ghost"
            style={{ marginRight: '0.7rem' }}
            disabled={submitting}
            onClick={onHide}
          >
            Cancel
          </Button>
          <Button
            disabled={isEqual(buildIds, initialBuildIds)}
            loading={submitting}
            color={doneColor}
            onClick={handleSubmit}
          >
            Done
          </Button>
        </footer>
      </LegacyModalLayout>
    </Modal>
  );

  function handleMove({
    sourceId,
    targetId
  }: {
    sourceId: number;
    targetId: number;
  }) {
    const sourceIndex = buildIds.indexOf(sourceId);
    const targetIndex = buildIds.indexOf(targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const nextBuildIds = [...buildIds];
    nextBuildIds.splice(sourceIndex, 1);
    nextBuildIds.splice(targetIndex, 0, sourceId);
    setBuildIds(nextBuildIds);
  }

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(buildIds);
    } finally {
      setSubmitting(false);
    }
  }
}

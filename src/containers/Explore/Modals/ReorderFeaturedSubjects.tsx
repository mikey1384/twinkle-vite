import React, { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import SortableListGroup from '~/components/SortableListGroup';
import { objectify } from '~/helpers';
import { isEqual } from 'lodash';
import { useAppContext, useExploreContext, useKeyContext } from '~/contexts';

export default function ReorderFeaturedSubjects({
  onHide,
  subjectIds: initialSubjectIds
}: {
  onHide: () => void;
  subjectIds: number[];
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const reportError = useAppContext((v) => v.requestHelpers.reportError);
  const uploadFeaturedSubjects = useAppContext(
    (v) => v.requestHelpers.uploadFeaturedSubjects
  );
  const featuredSubjects = useExploreContext((v) => v.state.subjects.featureds);
  const onLoadFeaturedSubjects = useExploreContext(
    (v) => v.actions.onLoadFeaturedSubjects
  );
  const [subjectIds, setSubjectIds] = useState(initialSubjectIds);
  const [isReordering, setIsReordering] = useState(false);
  const listItemObj = objectify(featuredSubjects);

  return (
    <Modal onHide={onHide}>
      <header>Reorder Featured Subjects</header>
      <main>
        <SortableListGroup
          listItemLabel="title"
          listItemObj={listItemObj}
          onMove={handleMove}
          itemIds={subjectIds}
        />
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          Cancel
        </Button>
        <Button
          disabled={isEqual(
            subjectIds,
            featuredSubjects.map((subject: { id: number }) => subject.id)
          )}
          loading={isReordering}
          color={doneColor}
          onClick={handleSubmit}
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
    sourceId: number;
    targetId: number;
  }) {
    const sourceIndex = subjectIds.indexOf(sourceId);
    const targetIndex = subjectIds.indexOf(targetId);
    const newSubjectIds = [...subjectIds];
    newSubjectIds.splice(sourceIndex, 1);
    newSubjectIds.splice(targetIndex, 0, sourceId);
    setSubjectIds(newSubjectIds);
  }

  async function handleSubmit() {
    setIsReordering(true);
    for (let subjectId of subjectIds) {
      if (!subjectId) {
        return reportError({
          componentPath: 'Explore/Modals/ReorderFeaturedSubjects',
          message: `handleSubmit: one of the elements inside subjectIds array is null`
        });
      }
    }
    const reorderedSubjects = await uploadFeaturedSubjects({
      selected: subjectIds
    });
    onLoadFeaturedSubjects(reorderedSubjects);
    onHide();
  }
}

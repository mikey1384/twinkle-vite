import { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import SortableListGroup from '~/components/SortableListGroup';
import { objectify } from '~/helpers';
import { isEqual } from 'lodash';
import { useAppContext, useExploreContext, useKeyContext } from '~/contexts';

ReorderFeaturedSubjects.propTypes = {
  subjectIds: PropTypes.array.isRequired,
  onHide: PropTypes.func.isRequired
};

export default function ReorderFeaturedSubjects({
  onHide,
  subjectIds: initialSubjectIds
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
  const [disabled, setDisabled] = useState(false);
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
          disabled={
            isEqual(
              subjectIds,
              featuredSubjects.map((subject) => subject.id)
            ) || disabled
          }
          color={doneColor}
          onClick={handleSubmit}
        >
          Done
        </Button>
      </footer>
    </Modal>
  );

  function handleMove({ sourceId, targetId }) {
    const sourceIndex = subjectIds.indexOf(sourceId);
    const targetIndex = subjectIds.indexOf(targetId);
    const newSubjectIds = [...subjectIds];
    newSubjectIds.splice(sourceIndex, 1);
    newSubjectIds.splice(targetIndex, 0, sourceId);
    setSubjectIds(newSubjectIds);
  }

  async function handleSubmit() {
    setDisabled(true);
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

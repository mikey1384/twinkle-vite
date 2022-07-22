import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import ForkButtonItem from './ForkButtonItem';
import ReorderButtonsModal from './ReorderButtonsModal';

ForkButtonsField.propTypes = {
  editedForkButtonIds: PropTypes.array.isRequired,
  editedForkButtonsObj: PropTypes.object.isRequired,
  onSetInputState: PropTypes.func.isRequired,
  style: PropTypes.object
};

export default function ForkButtonsField({
  editedForkButtonIds,
  editedForkButtonsObj,
  onSetInputState,
  style
}) {
  const [reorderButtonsModalShown, setReorderButtonsModalShown] =
    useState(false);
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        ...style
      }}
    >
      {editedForkButtonIds.map((forkButtonId, index) => {
        const forkButton = editedForkButtonsObj[forkButtonId];
        return (
          <ForkButtonItem
            key={forkButtonId}
            editedForkButtonIds={editedForkButtonIds}
            editedForkButtonsObj={editedForkButtonsObj}
            onSetInputState={onSetInputState}
            forkButton={forkButton}
            style={{ marginTop: index === 0 ? 0 : '1rem' }}
          />
        );
      })}
      <div
        style={{
          marginTop: '3rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <Button skeuomorphic onClick={handleAddButton}>
          <Icon icon="plus" />
          <span style={{ marginLeft: '0.7rem' }}>Add</span>
        </Button>
        <Button
          style={{ marginTop: '1rem' }}
          skeuomorphic
          onClick={() => setReorderButtonsModalShown(true)}
        >
          <Icon icon="bars" />
          <span style={{ marginLeft: '0.7rem' }}>Reorder</span>
        </Button>
      </div>
      {reorderButtonsModalShown && (
        <ReorderButtonsModal
          forkButtonIds={editedForkButtonIds}
          forkButtonsObj={editedForkButtonsObj}
          onSubmit={(forkButtonIds) =>
            onSetInputState({
              editedForkButtonIds: forkButtonIds
            })
          }
          onHide={() => setReorderButtonsModalShown(false)}
        />
      )}
    </div>
  );

  function handleAddButton() {
    let nextButtonId = 0;
    for (let i = 1; i <= editedForkButtonIds.length + 1; i++) {
      if (!editedForkButtonIds.includes(i)) {
        nextButtonId = i;
        break;
      }
    }
    onSetInputState({
      editedForkButtonIds: [...editedForkButtonIds, nextButtonId],
      editedForkButtonsObj: {
        ...editedForkButtonsObj,
        [nextButtonId]: {
          id: nextButtonId,
          label: `option ${nextButtonId}`
        }
      }
    });
  }
}

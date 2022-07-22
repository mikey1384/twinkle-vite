import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Input from '~/components/Texts/Input';
import Button from '~/components/Button';
import { useAppContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { addEmoji } from '~/helpers/stringHelpers';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';

Editor.propTypes = {
  missionId: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
  onSetMissionState: PropTypes.func.isRequired,
  tutorialPrompt: PropTypes.string,
  tutorialButtonLabel: PropTypes.string
};

export default function Editor({
  missionId,
  onClose,
  onSetMissionState,
  tutorialPrompt,
  tutorialButtonLabel
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const updateTutorialPrompt = useAppContext(
    (v) => v.requestHelpers.updateTutorialPrompt
  );
  const [editedTutorialPrompt, setEditedTutorialPrompt] = useState(
    tutorialPrompt || 'Need Help? Read the Tutorial'
  );
  const [editedTutorialButtonLabel, setEditedTutorialButtonLabel] = useState(
    tutorialButtonLabel || 'Show Tutorial'
  );
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        marginBottom: '-1rem'
      }}
    >
      <div
        className={css`
          width: 50%;
          @media (max-width: ${mobileMaxWidth}) {
            width: 100%;
          }
        `}
      >
        <Input
          autoFocus
          value={editedTutorialPrompt}
          onChange={(text) => setEditedTutorialPrompt(addEmoji(text))}
          placeholder="Write something"
        />
      </div>
      <div
        style={{
          marginTop: '2rem',
          border: `1px solid ${Color.borderGray()}`,
          borderRadius,
          padding: '1rem'
        }}
      >
        <Input
          autoFocus
          style={{ maxWidth: '13rem' }}
          value={editedTutorialButtonLabel}
          onChange={(text) => setEditedTutorialButtonLabel(text)}
          placeholder="Write something"
        />
      </div>
      <div style={{ display: 'flex', marginTop: '2rem' }}>
        <Button
          style={{ fontSize: '1.7rem' }}
          color={doneColor}
          onClick={handleDone}
        >
          Done
        </Button>
        <Button
          style={{ fontSize: '1.7rem', marginLeft: '1rem' }}
          transparent
          onClick={onClose}
        >
          Cancel
        </Button>
      </div>
    </div>
  );

  async function handleDone() {
    const success = await updateTutorialPrompt({
      missionId,
      tutorialPrompt: editedTutorialPrompt,
      buttonLabel: editedTutorialButtonLabel
    });
    if (success) {
      onSetMissionState({
        missionId,
        newState: {
          tutorialPrompt: editedTutorialPrompt,
          tutorialButtonLabel: editedTutorialButtonLabel
        }
      });
      onClose();
    }
  }
}

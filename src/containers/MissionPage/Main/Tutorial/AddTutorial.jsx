import React from 'react';
import PropTypes from 'prop-types';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { panel } from '../../Styles';
import { useAppContext, useMissionContext } from '~/contexts';

AddTutorial.propTypes = {
  missionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  missionTitle: PropTypes.string
};

export default function AddTutorial({ missionId, missionTitle }) {
  const attachMissionTutorial = useAppContext(
    (v) => v.requestHelpers.attachMissionTutorial
  );
  const onSetMissionState = useMissionContext(
    (v) => v.actions.onSetMissionState
  );
  return (
    <div
      className={panel}
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '5rem'
      }}
    >
      <Button skeuomorphic onClick={handleAttachTutorial}>
        <Icon icon="plus" />
        <span style={{ marginLeft: '0.7rem' }}>Attach a Tutorial</span>
      </Button>
    </div>
  );

  async function handleAttachTutorial() {
    const tutorialId = await attachMissionTutorial({ missionId, missionTitle });
    onSetMissionState({ missionId, newState: { tutorialId } });
  }
}

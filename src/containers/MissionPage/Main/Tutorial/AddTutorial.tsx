import React from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { panel } from '../../Styles';
import { useAppContext, useMissionContext } from '~/contexts';

export default function AddTutorial({
  missionId,
  missionTitle
}: {
  missionId: number;
  missionTitle: string;
}) {
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
      <Button variant="soft" tone="raised" onClick={handleAttachTutorial}>
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

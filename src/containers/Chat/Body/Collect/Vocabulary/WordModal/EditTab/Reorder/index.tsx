import React from 'react';
import PartOfSpeechBlock from './PartOfSpeechBlock';
import PartOfSpeechesList from './PartOfSpeechesList';

export default function Reorder({
  deletedDefIds,
  editedDefinitionOrder,
  onSetEditedDefinitionOrder,
  onSetPoses,
  poses,
  posObj
}: {
  deletedDefIds: number[];
  editedDefinitionOrder: { [key: string]: number[] };
  onSetEditedDefinitionOrder: (arg0: { [key: string]: number[] }) => void;
  onSetPoses: (arg0: string[]) => void;
  poses: string[];
  posObj: { [key: string]: { [key: number]: { title: string } } };
}) {
  return (
    <div style={{ display: 'flex', width: '100%' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '60%'
        }}
      >
        {poses.map((pos) => (
          <PartOfSpeechBlock
            key={pos}
            style={{ marginBottom: '1.5rem' }}
            type={pos}
            deletedDefIds={deletedDefIds}
            defIds={editedDefinitionOrder[pos]}
            posObject={posObj[pos]}
            onListItemMove={(params) =>
              handleDefinitionsMove({
                ...params,
                setIds: onSetEditedDefinitionOrder,
                ids: editedDefinitionOrder[pos],
                pos
              })
            }
          />
        ))}
      </div>
      <div
        style={{
          width: '40%',
          marginLeft: '1rem',
          marginTop: '3.5rem'
        }}
      >
        <PartOfSpeechesList
          partOfSpeeches={poses}
          onListItemMove={handlePosMove}
        />
      </div>
    </div>
  );

  function handleDefinitionsMove({
    sourceId,
    targetId,
    ids,
    pos,
    setIds
  }: {
    sourceId: number;
    targetId: number;
    ids: number[];
    pos: string;
    setIds: (v: any) => any;
  }) {
    const newIds = [...ids];
    const sourceIndex = newIds.indexOf(sourceId);
    const targetIndex = newIds.indexOf(targetId);
    newIds.splice(sourceIndex, 1);
    newIds.splice(targetIndex, 0, sourceId);
    setIds((ids: any[]) => ({
      ...ids,
      [pos]: newIds
    }));
  }

  function handlePosMove({
    sourceId: sourcePos,
    targetId: targetPos
  }: {
    sourceId: string;
    targetId: string;
  }) {
    const newPoses = [...poses];
    const sourceIndex = newPoses.indexOf(sourcePos);
    const targetIndex = newPoses.indexOf(targetPos);
    newPoses.splice(sourceIndex, 1);
    newPoses.splice(targetIndex, 0, sourcePos);
    onSetPoses(newPoses);
  }
}

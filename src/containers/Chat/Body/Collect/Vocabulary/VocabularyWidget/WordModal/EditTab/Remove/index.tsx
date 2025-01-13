import React from 'react';
import PartOfSpeechBlock from './PartOfSpeechBlock';

export default function Remove({
  editedDefinitionOrder,
  deletedDefIds,
  onListItemClick,
  poses,
  posObj
}: {
  editedDefinitionOrder: any;
  deletedDefIds: number[];
  onListItemClick: (id: number) => void;
  poses: string[];
  posObj: any;
}) {
  return (
    <div>
      <div>
        {poses.map((pos) => (
          <PartOfSpeechBlock
            key={pos}
            deletedDefIds={deletedDefIds}
            style={{ marginBottom: '1.5rem' }}
            type={pos}
            onListItemClick={onListItemClick}
            defIds={editedDefinitionOrder[pos]}
            posObject={posObj[pos]}
          />
        ))}
      </div>
    </div>
  );
}

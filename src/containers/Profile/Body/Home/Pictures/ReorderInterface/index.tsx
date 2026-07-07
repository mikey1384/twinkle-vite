import React, { useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Picture from './Picture';
import { objectify } from '~/helpers';

interface Picture {
  id: number | string;
  src: string;
}

interface MoveParams {
  sourceId: number | string;
  targetId: number | string;
}

export default function ReorderInterface({
  numPictures,
  pictures,
  reorderedPictureIds,
  onSetReorderedPictureIds
}: {
  numPictures: number;
  pictures: Picture[];
  reorderedPictureIds: (number | string)[];
  onSetReorderedPictureIds: (ids: (number | string)[]) => void;
}) {
  const pictureObj = useMemo(() => {
    return objectify(pictures);
  }, [pictures]);

  return (
    <ErrorBoundary componentPath="Profile/Body/Home/Pictures/ReorderInterface/index">
      <div
        style={{
          width:
            pictures.length > 5 ? '100%' : pictures.length > 3 ? '95%' : '75%',
          height: 'auto',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        {reorderedPictureIds.map((pictureId, index) => {
          const picture = pictureObj[pictureId];

          if (!picture) {
            console.error(`Picture with id ${pictureId} not found`);
            return null;
          }

          return (
            <Picture
              key={pictureId}
              numPictures={numPictures}
              picture={picture}
              style={{ marginLeft: index === 0 ? 0 : '1rem' }}
              onMove={handleMove}
            />
          );
        })}
      </div>
    </ErrorBoundary>
  );

  function handleMove({ sourceId, targetId }: MoveParams) {
    try {
      const sourceIndex = reorderedPictureIds.indexOf(sourceId);
      const targetIndex = reorderedPictureIds.indexOf(targetId);

      if (sourceIndex === -1 || targetIndex === -1) {
        console.error('Invalid source or target ID in drag and drop operation');
        return;
      }

      const newReorderedPictureIds = [...reorderedPictureIds];
      newReorderedPictureIds.splice(sourceIndex, 1);
      newReorderedPictureIds.splice(targetIndex, 0, sourceId);
      onSetReorderedPictureIds(newReorderedPictureIds);
    } catch (error) {
      console.error('Error during picture reordering:', error);
    }
  }
}

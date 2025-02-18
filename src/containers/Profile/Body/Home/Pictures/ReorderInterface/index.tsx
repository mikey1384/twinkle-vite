import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import Picture from './Picture';
import { isMobile, objectify } from '~/helpers';
import { DndProvider } from 'react-dnd';
import { TouchBackend } from 'react-dnd-touch-backend';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface Picture {
  id: number | string;
  src: string;
}

interface MoveParams {
  sourceId: number | string;
  targetId: number | string;
}

const Backend =
  typeof navigator !== 'undefined' && isMobile(navigator)
    ? TouchBackend
    : HTML5Backend;

ReorderInterface.propTypes = {
  numPictures: PropTypes.number.isRequired,
  pictures: PropTypes.array.isRequired,
  reorderedPictureIds: PropTypes.array.isRequired,
  onSetReorderedPictureIds: PropTypes.func.isRequired
};

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

  const handleMove = ({ sourceId, targetId }: MoveParams) => {
    try {
      const sourceIndex = reorderedPictureIds.indexOf(sourceId);
      const targetIndex = reorderedPictureIds.indexOf(targetId);

      // Validate indices
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
  };

  return (
    <ErrorBoundary componentPath="Profile/Body/Home/Pictures/ReorderInterface/index">
      <DndProvider backend={Backend}>
        <div
          style={{
            width:
              pictures.length > 5
                ? '100%'
                : pictures.length > 3
                ? '95%'
                : '75%',
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
      </DndProvider>
    </ErrorBoundary>
  );
}

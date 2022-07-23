import { useMemo } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import Picture from './Picture';
import { isMobile, objectify } from '~/helpers';
import { DndProvider } from 'react-dnd';
import { TouchBackend } from 'react-dnd-touch-backend';
import { HTML5Backend } from 'react-dnd-html5-backend';

const Backend = isMobile(navigator) ? TouchBackend : HTML5Backend;

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
}) {
  const pictureObj = useMemo(() => {
    return objectify(pictures);
  }, [pictures]);

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
          {reorderedPictureIds.map((pictureId, index) => (
            <Picture
              key={pictureId}
              numPictures={numPictures}
              picture={pictureObj[pictureId]}
              style={{ marginLeft: index === 0 ? 0 : '1rem' }}
              onMove={({ sourceId, targetId }) => {
                const sourceIndex = reorderedPictureIds.indexOf(sourceId);
                const targetIndex = reorderedPictureIds.indexOf(targetId);
                const newReorderedPictureIds = [...reorderedPictureIds];
                newReorderedPictureIds.splice(sourceIndex, 1);
                newReorderedPictureIds.splice(targetIndex, 0, sourceId);
                onSetReorderedPictureIds(newReorderedPictureIds);
              }}
            />
          ))}
        </div>
      </DndProvider>
    </ErrorBoundary>
  );
}

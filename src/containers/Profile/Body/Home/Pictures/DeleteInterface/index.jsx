import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import Picture from './Picture';

DeleteInterface.propTypes = {
  numPictures: PropTypes.number.isRequired,
  remainingPictures: PropTypes.array.isRequired,
  onSetRemainingPictures: PropTypes.func.isRequired
};

export default function DeleteInterface({
  remainingPictures,
  numPictures,
  onSetRemainingPictures
}) {
  return (
    <ErrorBoundary componentPath="Profile/Body/Home/Pictures/DeleteInterface/index">
      <div
        style={{
          width: '100%',
          height: 'auto',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        {remainingPictures.length === 0 ? (
          <div style={{ fontSize: '2rem' }}>No Pictures</div>
        ) : (
          remainingPictures.map((picture, index) => (
            <Picture
              key={index}
              onDelete={(pictureId) =>
                onSetRemainingPictures((pictures) =>
                  pictures.filter((picture) => picture.id !== pictureId)
                )
              }
              numPictures={numPictures}
              picture={picture}
              style={{ marginLeft: index === 0 ? 0 : '1rem' }}
            />
          ))
        )}
      </div>
    </ErrorBoundary>
  );
}

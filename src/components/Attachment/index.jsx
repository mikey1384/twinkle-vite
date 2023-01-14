import PropTypes from 'prop-types';
import CloseButton from '~/components/Buttons/CloseButton';
import ErrorBoundary from '~/components/ErrorBoundary';
import WebsiteContent from './WebsiteContent';
import FileContent from '~/components/FileContent';

Attachment.propTypes = {
  attachment: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onThumbnailLoad: PropTypes.func,
  style: PropTypes.object
};

export default function Attachment({
  attachment,
  attachment: { contentType = 'file', fileType },
  onClose,
  onThumbnailLoad,
  style
}) {
  return (
    <ErrorBoundary
      componentPath="Attachment/index"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        ...style
      }}
    >
      <CloseButton onClick={onClose} />
      {contentType === 'file' ? (
        <FileContent
          file={attachment.file}
          fileType={fileType}
          imageUrl={attachment.imageUrl}
          onThumbnailLoad={onThumbnailLoad}
        />
      ) : (
        <WebsiteContent attachment={attachment} />
      )}
    </ErrorBoundary>
  );
}

import React from 'react';
import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
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
      <Icon
        icon="times"
        style={{
          zIndex: 1,
          display: 'flex',
          background: '#000',
          color: '#fff',
          borderRadius: '50%',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '0.2rem',
          width: '2rem',
          height: '2rem',
          position: 'absolute',
          cursor: 'pointer',
          right: '-0.5rem',
          top: '-1rem'
        }}
        onClick={onClose}
      />
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

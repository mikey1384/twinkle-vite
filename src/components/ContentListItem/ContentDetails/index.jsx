import React from 'react';
import PropTypes from 'prop-types';
import VideoDetails from './VideoDetails';
import SubjectDetails from './SubjectDetails';
import UrlDetails from './UrlDetails';

ContentDetails.propTypes = {
  contentType: PropTypes.string.isRequired,
  description: PropTypes.string,
  title: PropTypes.string,
  uploader: PropTypes.object,
  contentId: PropTypes.number
};

export default function ContentDetails({
  contentType,
  description,
  title,
  uploader,
  contentId
}) {
  return (
    <div
      style={{
        width:
          contentType !== 'subject' && contentType !== 'url' ? '75%' : '100%',
        paddingTop: '1rem',
        paddingBottom: '1rem',
        paddingLeft: 0,
        paddingRight: 0,
        ...(contentType === 'url' ? { paddingTop: '0.5rem' } : {})
      }}
    >
      {contentType === 'video' && (
        <VideoDetails
          description={description}
          title={title}
          uploader={uploader}
        />
      )}
      {contentType === 'subject' && (
        <SubjectDetails
          description={description}
          title={title}
          uploader={uploader}
        />
      )}
      {contentType === 'url' && (
        <UrlDetails contentId={contentId} title={title} />
      )}
    </div>
  );
}

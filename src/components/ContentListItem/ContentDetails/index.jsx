import React from 'react';
import PropTypes from 'prop-types';
import Embedly from '~/components/Embedly';
import VideoDetails from './VideoDetails';
import SubjectDetails from './SubjectDetails';

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
        <div>
          <span
            style={{
              fontWeight: 'bold',
              fontSize: '2rem'
            }}
            className="label"
          >
            {title}
          </span>
          <Embedly
            small
            noLink
            style={{ marginTop: '0.5rem' }}
            contentId={contentId}
          />
        </div>
      )}
    </div>
  );
}

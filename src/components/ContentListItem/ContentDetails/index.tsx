import React from 'react';
import PropTypes from 'prop-types';
import VideoDetails from './VideoDetails';
import SubjectDetails from './SubjectDetails';
import UrlDetails from './UrlDetails';
import AIStoryDetails from './AIStoryDetails';

ContentDetails.propTypes = {
  contentType: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  story: PropTypes.string,
  title: PropTypes.string.isRequired,
  uploader: PropTypes.object.isRequired,
  contentId: PropTypes.number.isRequired,
  topic: PropTypes.string
};
export default function ContentDetails({
  contentType,
  description,
  story,
  title,
  uploader,
  contentId,
  topic
}: {
  contentType: string;
  description: string;
  story: string;
  title: string;
  uploader: any;
  contentId: number;
  topic: string;
}) {
  return (
    <div
      style={{
        width:
          contentType !== 'subject' &&
          contentType !== 'url' &&
          contentType !== 'aiStory'
            ? '75%'
            : '100%',
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
      {contentType === 'aiStory' && (
        <AIStoryDetails topic={topic} story={story} />
      )}
    </div>
  );
}

import PropTypes from 'prop-types';
import XPVideoPlayer from '~/components/XPVideoPlayer';
import { isMobile } from '~/helpers';

const displayIsMobile = isMobile(navigator);

XPVideo.propTypes = {
  contentType: PropTypes.string.isRequired,
  subjectIsAttachedToVideo: PropTypes.bool,
  isEditing: PropTypes.bool,
  rewardLevel: PropTypes.number,
  byUser: PropTypes.bool,
  title: PropTypes.string,
  uploader: PropTypes.object,
  contentId: PropTypes.number,
  content: PropTypes.string,
  rootId: PropTypes.number,
  rootObj: PropTypes.object
};

export default function XPVideo({
  contentType,
  subjectIsAttachedToVideo,
  isEditing,
  rewardLevel,
  byUser,
  title,
  uploader,
  contentId,
  content,
  rootId,
  rootObj
}) {
  if (contentType !== 'video' && !subjectIsAttachedToVideo) return null;
  return (
    <XPVideoPlayer
      isLink={displayIsMobile}
      rewardLevel={
        contentType === 'subject' ? rootObj.rewardLevel : rewardLevel
      }
      byUser={!!(rootObj.byUser || (contentType === 'video' && byUser))}
      onEdit={isEditing}
      title={rootObj.title || title}
      uploader={rootObj.uploader || uploader}
      videoId={contentType === 'video' ? contentId : rootId}
      videoCode={contentType === 'video' ? content : rootObj.content}
      style={{ paddingBottom: '0.5rem' }}
    />
  );
}

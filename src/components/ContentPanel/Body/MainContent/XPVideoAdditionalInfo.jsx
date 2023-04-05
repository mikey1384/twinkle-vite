import PropTypes from 'prop-types';
import AlreadyPosted from '~/components/AlreadyPosted';
import TagStatus from '~/components/TagStatus';

XPVideoAdditionalInfo.propTypes = {
  contentType: PropTypes.string.isRequired,
  uploader: PropTypes.object,
  contentId: PropTypes.number.isRequired,
  content: PropTypes.string,
  loggedIn: PropTypes.bool.isRequired,
  onAddTags: PropTypes.func.isRequired,
  onAddTagToContents: PropTypes.func.isRequired,
  onLoadTags: PropTypes.func.isRequired,
  rewardLevel: PropTypes.number,
  tags: PropTypes.array,
  theme: PropTypes.string
};

export default function XPVideoAdditionalInfo({
  contentType,
  uploader,
  contentId,
  content,
  loggedIn,
  onAddTags,
  onAddTagToContents,
  onLoadTags,
  rewardLevel,
  tags,
  theme
}) {
  if (contentType !== 'video') return null;
  return (
    <>
      <AlreadyPosted
        style={{
          marginTop: loggedIn && rewardLevel ? '0.5rem' : '-0.5rem',
          marginBottom: '0.5rem'
        }}
        uploaderId={(uploader || {}).id}
        contentId={contentId}
        contentType={contentType}
        url={content}
        videoCode={contentType === 'video' ? content : undefined}
      />
      <TagStatus
        onAddTags={onAddTags}
        onAddTagToContents={onAddTagToContents}
        onLoadTags={onLoadTags}
        tags={tags || []}
        contentId={contentId}
        theme={theme}
      />
    </>
  );
}

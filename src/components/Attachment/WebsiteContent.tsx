import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { truncateText } from '~/helpers/stringHelpers';
import { useContentState } from '~/helpers/hooks';
import YouTubeIcon from '~/assets/YoutubeIcon.svg';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Attachment } from '~/types';

const fallbackImage = '/img/link.png';

WebsiteContent.propTypes = {
  attachment: PropTypes.object.isRequired
};
export default function WebsiteContent({
  attachment
}: {
  attachment: Attachment;
}) {
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState('');
  const { content, thumbUrl } = useContentState({
    contentType: attachment.contentType || '',
    contentId: attachment.id
  });
  useEffect(() => {
    setImageUrl(
      attachment.contentType === 'video'
        ? `https://img.youtube.com/vi/${content}/mqdefault.jpg`
        : thumbUrl || fallbackImage
    );
  }, [attachment.contentType, content, thumbUrl]);

  return (
    <ErrorBoundary componentPath="Attachment/WebsiteContent">
      <div
        style={{
          width: '8rem',
          cursor: 'pointer',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={handleClick}
      >
        <div style={{ fontSize: '2.5rem' }}>
          {attachment.contentType === 'video' && (
            <img
              loading="lazy"
              style={{
                width: '4rem',
                height: '3rem',
                position: 'absolute',
                left: 'CALC(50% - 2rem)',
                top: '0.5rem'
              }}
              src={YouTubeIcon}
            />
          )}
          <img
            alt="Thumbnail"
            src={imageUrl}
            onError={handleImageLoadError}
            loading="lazy"
            style={{
              display: 'block',
              width: '100%',
              height: '4rem',
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              margin: 'auto'
            }}
          />
        </div>
        <div style={{ marginTop: '0.5rem' }}>
          {truncateText({ text: attachment.title, limit: 20 })}
        </div>
      </div>
    </ErrorBoundary>
  );

  function handleClick() {
    const path = attachment.contentType === 'url' ? 'links' : 'videos';
    navigate(`/${path}/${attachment.id}`);
  }

  function handleImageLoadError() {
    setImageUrl(!thumbUrl || imageUrl === thumbUrl ? fallbackImage : thumbUrl);
  }
}

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Attachment from './Attachment';
import { css } from '@emotion/css';
import { borderRadius, Color } from '~/constants/css';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { useInteractiveContext, useKeyContext } from '~/contexts';

SlideListItem.propTypes = {
  interactiveId: PropTypes.number.isRequired,
  onClick: PropTypes.func.isRequired,
  selectedSlideId: PropTypes.number,
  slide: PropTypes.object.isRequired,
  style: PropTypes.object
};

export default function SlideListItem({
  interactiveId,
  onClick,
  selectedSlideId,
  slide,
  style
}) {
  const {
    itemSelected: { color: itemSelectedColor, opacity: itemSelectedOpacity }
  } = useKeyContext((v) => v.theme);
  const onSetSlideState = useInteractiveContext(
    (v) => v.actions.onSetSlideState
  );
  const selected = useMemo(
    () => selectedSlideId === slide.id,
    [selectedSlideId, slide.id]
  );
  const highlightColor = useMemo(
    () => Color[itemSelectedColor](itemSelectedOpacity),
    [itemSelectedColor, itemSelectedOpacity]
  );

  return (
    <div
      style={{
        ...style,
        boxShadow: selected ? `0 0 3px ${highlightColor}` : null,
        border: selected ? `0.3rem solid ${highlightColor}` : null
      }}
      onClick={() => onClick(slide.id)}
      className={css`
        width: 100%;
        cursor: pointer;
        padding: 1rem;
        border: 1px solid ${Color.borderGray()};
        border-radius: ${borderRadius};
        background: #fff;
        .label {
          color: ${Color.black()};
          transition: color 1s;
        }
        transition: background 0.5s, border 0.5s;
        &:hover {
          border-color: ${Color.darkerBorderGray()};
          .label {
            color: ${Color.black()};
          }
          background: ${Color.highlightGray()};
        }
      `}
    >
      <p style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>
        {slide.heading || 'New Slide'}
      </p>
      <div
        style={{
          width: '100%',
          fontSize: stringIsEmpty(slide.heading) ? '1.5rem' : '1.3rem',
          marginTop:
            stringIsEmpty(slide.heading) || stringIsEmpty(slide.description)
              ? 0
              : '0.5rem'
        }}
      >
        {slide.description}
      </div>
      {slide.attachment && (
        <div
          style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
        >
          <Attachment
            small
            isOnModal
            type={slide.attachment.type}
            isYouTubeVideo={slide.attachment.isYouTubeVideo}
            fileUrl={slide.attachment.fileUrl}
            interactiveId={interactiveId}
            linkUrl={slide.attachment.linkUrl}
            thumbUrl={slide.attachment.thumbUrl}
            actualTitle={slide.attachment.actualTitle}
            actualDescription={slide.attachment.actualDescription}
            prevUrl={slide.attachment.prevUrl}
            siteUrl={slide.attachment.siteUrl}
            slideId={slide.id}
            onSetEmbedProps={handleSetEmbedProps}
            onThumbnailUpload={handleThumbnailUpload}
          />
        </div>
      )}
    </div>
  );

  async function handleSetEmbedProps(params) {
    onSetSlideState({
      interactiveId,
      slideId: slide.id,
      newState: {
        attachment: {
          ...slide.attachment,
          ...params
        }
      }
    });
  }

  function handleThumbnailUpload(thumbUrl) {
    onSetSlideState({
      interactiveId,
      slideId: slide.id,
      newState: {
        attachment: {
          ...slide.attachment,
          thumbUrl
        }
      }
    });
  }
}

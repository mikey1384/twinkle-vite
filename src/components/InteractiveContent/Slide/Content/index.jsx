import { useMemo } from 'react';
import PropTypes from 'prop-types';
import Attachment from '../../Attachment';
import ForkButtons from './ForkButtons';
import LongText from '~/components/Texts/LongText';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { useKeyContext } from '~/contexts';

Content.propTypes = {
  centerRef: PropTypes.func,
  forkedFrom: PropTypes.number,
  heading: PropTypes.string,
  interactiveId: PropTypes.number,
  isPublished: PropTypes.bool,
  isPortal: PropTypes.bool,
  description: PropTypes.string,
  attachment: PropTypes.object,
  forkButtonIds: PropTypes.array,
  forkButtonsObj: PropTypes.object,
  isOnModal: PropTypes.bool,
  onForkButtonClick: PropTypes.func,
  onPortalButtonClick: PropTypes.func,
  onSetEmbedProps: PropTypes.func,
  onThumbnailUpload: PropTypes.func,
  portalButton: PropTypes.object,
  slideId: PropTypes.number,
  selectedForkButtonId: PropTypes.number
};

export default function Content({
  centerRef,
  forkedFrom,
  heading,
  interactiveId,
  isPublished,
  isPortal,
  description,
  attachment,
  forkButtonIds,
  forkButtonsObj,
  isOnModal,
  onForkButtonClick,
  onPortalButtonClick,
  onSetEmbedProps,
  onThumbnailUpload,
  portalButton,
  slideId,
  selectedForkButtonId
}) {
  const {
    button: { color: buttonColor },
    buttonHovered: { color: buttonHoverColor }
  } = useKeyContext((v) => v.theme);
  const descriptionShown = useMemo(
    () => !stringIsEmpty(description),
    [description]
  );
  const bodyShown = useMemo(() => {
    return (
      descriptionShown ||
      attachment?.fileUrl ||
      attachment?.linkUrl ||
      forkButtonIds?.length > 0 ||
      (isPortal && portalButton && !!forkedFrom)
    );
  }, [
    attachment?.fileUrl,
    attachment?.linkUrl,
    descriptionShown,
    forkButtonIds?.length,
    forkedFrom,
    isPortal,
    portalButton
  ]);
  const displayedHeading = useMemo(() => {
    if (!stringIsEmpty(heading)) {
      return heading;
    }
    if (!bodyShown && !descriptionShown) {
      return 'New Slide';
    }
    return '';
  }, [bodyShown, descriptionShown, heading]);
  const headingShown = useMemo(() => !!displayedHeading, [displayedHeading]);
  const attachmentMarginTop = useMemo(
    () => (headingShown || descriptionShown ? '3rem' : 0),
    [descriptionShown, headingShown]
  );

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '30rem',
        display: 'flex',
        flexDirection: 'column',
        ...(headingShown && !bodyShown ? { justifyContent: 'center' } : {})
      }}
    >
      <div
        style={{
          top: '50%',
          position: 'absolute'
        }}
        ref={centerRef}
      />
      {!isPublished && (
        <div
          style={{
            textAlign: 'center',
            padding: '0 1rem 1rem 1rem',
            color: Color.rose(),
            fontWeight: 'bold',
            fontSize: '1.3rem'
          }}
        >{`(Draft)`}</div>
      )}
      {headingShown && (
        <div>
          <p
            className={css`
              margin-top: ${headingShown && !bodyShown ? '0' : '1rem'};
              text-align: center;
              font-size: 2.5rem;
              font-weight: bold;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.7rem;
              }
            `}
          >
            {displayedHeading}
          </p>
        </div>
      )}
      {bodyShown && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flexGrow: 1,
            ...(headingShown
              ? {}
              : { marginTop: descriptionShown ? '0.5rem' : 0 })
          }}
        >
          {descriptionShown && (
            <div
              className={css`
                margin-top: ${headingShown &&
                (forkButtonIds?.length ||
                (isPortal && portalButton && !!forkedFrom) ||
                attachment?.fileUrl ||
                attachment?.linkUrl
                  ? '2rem'
                  : 0)};
                display: flex;
                justify-content: center;
                font-size: 2rem;
                line-height: 1.6;
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1.5rem;
                }
              `}
            >
              <LongText
                className={css`
                  white-space: pre-wrap;
                  overflow-wrap: break-word;
                  word-break: break-word;
                `}
                maxLines={100}
              >
                {description}
              </LongText>
            </div>
          )}
          {(attachment?.fileUrl || attachment?.linkUrl) && (
            <div
              style={{
                marginTop: attachmentMarginTop,
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <Attachment
                type={attachment.type}
                interactiveId={interactiveId}
                isOnModal={isOnModal}
                isYouTubeVideo={attachment.isYouTubeVideo}
                fileUrl={attachment.fileUrl}
                linkUrl={attachment.linkUrl}
                thumbUrl={attachment.thumbUrl}
                actualTitle={attachment.actualTitle}
                actualDescription={attachment.actualDescription}
                prevUrl={attachment.prevUrl}
                siteUrl={attachment.siteUrl}
                slideId={slideId}
                onSetEmbedProps={onSetEmbedProps}
                onThumbnailUpload={onThumbnailUpload}
              />
            </div>
          )}
          {forkButtonIds?.length > 0 && (
            <ForkButtons
              descriptionShown={descriptionShown}
              forkButtonIds={forkButtonIds}
              forkButtonsObj={forkButtonsObj}
              onForkButtonClick={onForkButtonClick}
              selectedForkButtonId={selectedForkButtonId}
            />
          )}
          {isPortal && portalButton && !!forkedFrom && (
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                marginTop: '3rem'
              }}
            >
              <Button
                onClick={() => onPortalButtonClick(portalButton.destination)}
                color={buttonColor}
                hoverColor={buttonHoverColor}
                skeuomorphic
                style={{ fontSize: '1.7rem' }}
              >
                <Icon icon={portalButton.icon} />
                <span style={{ marginLeft: '0.7rem' }}>
                  {portalButton.label}
                </span>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

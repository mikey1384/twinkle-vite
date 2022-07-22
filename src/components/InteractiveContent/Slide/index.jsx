import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  useAppContext,
  useInteractiveContext,
  useKeyContext
} from '~/contexts';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import Content from './Content';
import Deleted from './Deleted';
import Editor from './Editor';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import InsertSlide from './InsertSlide';
import DropdownButton from '~/components/Buttons/DropdownButton';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import { useInView } from 'react-intersection-observer';

Slide.propTypes = {
  archivedSlides: PropTypes.array,
  attachment: PropTypes.object,
  cannotMoveUp: PropTypes.bool,
  cannotMoveDown: PropTypes.bool,
  displayedSlideIds: PropTypes.array,
  fileUploadProgress: PropTypes.number,
  innerRef: PropTypes.func,
  index: PropTypes.number,
  insertButtonShown: PropTypes.bool,
  interactiveId: PropTypes.number,
  style: PropTypes.object,
  heading: PropTypes.string,
  isDeleted: PropTypes.bool,
  isEditing: PropTypes.bool,
  isPublished: PropTypes.bool,
  isLastSlide: PropTypes.bool,
  isFork: PropTypes.bool,
  isOnModal: PropTypes.bool,
  isPortal: PropTypes.bool,
  forkedFrom: PropTypes.number,
  description: PropTypes.string,
  onExpandPath: PropTypes.func,
  onMoveSlide: PropTypes.func,
  forkButtonIds: PropTypes.array,
  forkButtonsObj: PropTypes.object,
  onCurrentSlideIdChange: PropTypes.func,
  onGoBackToMission: PropTypes.func,
  portalButton: PropTypes.object,
  slideId: PropTypes.number,
  slideObj: PropTypes.object,
  paths: PropTypes.object,
  selectedForkButtonId: PropTypes.number,
  uploadingFile: PropTypes.bool
};

export default function Slide({
  archivedSlides,
  cannotMoveUp,
  cannotMoveDown,
  displayedSlideIds,
  heading,
  index,
  description,
  fileUploadProgress,
  innerRef,
  insertButtonShown,
  interactiveId,
  isDeleted,
  isLastSlide,
  isOnModal,
  isPublished,
  isEditing,
  isFork,
  isPortal,
  forkedFrom,
  onCurrentSlideIdChange,
  onExpandPath,
  onMoveSlide,
  forkButtonIds,
  forkButtonsObj,
  onGoBackToMission,
  portalButton,
  slideId,
  paths,
  attachment,
  selectedForkButtonId,
  slideObj,
  style,
  uploadingFile
}) {
  const [ComponentRef, inView] = useInView({
    threshold: 1
  });
  useEffect(() => {
    if (inView) {
      onCurrentSlideIdChange?.(slideId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, slideId]);
  const deleteInteractiveSlide = useAppContext(
    (v) => v.requestHelpers.deleteInteractiveSlide
  );
  const publishInteractiveSlide = useAppContext(
    (v) => v.requestHelpers.publishInteractiveSlide
  );
  const undeleteInteractiveSlide = useAppContext(
    (v) => v.requestHelpers.undeleteInteractiveSlide
  );
  const unPublishInteractiveSlide = useAppContext(
    (v) => v.requestHelpers.unPublishInteractiveSlide
  );
  const onArchiveSlide = useInteractiveContext((v) => v.actions.onArchiveSlide);
  const onChangeNumUpdates = useInteractiveContext(
    (v) => v.actions.onChangeNumUpdates
  );
  const onGoBack = useInteractiveContext((v) => v.actions.onGoBack);
  const onRemoveInteractiveSlide = useInteractiveContext(
    (v) => v.actions.onRemoveInteractiveSlide
  );
  const onSetSlideState = useInteractiveContext(
    (v) => v.actions.onSetSlideState
  );

  const { canEdit } = useKeyContext((v) => v.myState);
  const [confirmModalShown, setConfirmModalShown] = useState(false);

  const dropdownMenuProps = useMemo(() => {
    return [
      {
        label: (
          <>
            <Icon icon="pencil-alt" />
            <span style={{ marginLeft: '1rem' }}>Edit</span>
          </>
        ),
        onClick: () =>
          onSetSlideState({
            interactiveId,
            slideId,
            newState: { isEditing: true }
          })
      },
      ...(isFork
        ? []
        : [
            ...(cannotMoveUp
              ? []
              : [
                  {
                    label: (
                      <>
                        <Icon icon="arrow-up" />
                        <span style={{ marginLeft: '1rem' }}>Move Up</span>
                      </>
                    ),
                    onClick: () =>
                      onMoveSlide({ slideId, direction: 'up', interactiveId })
                  }
                ]),
            ...(cannotMoveDown
              ? []
              : [
                  {
                    label: (
                      <>
                        <Icon icon="arrow-down" />
                        <span style={{ marginLeft: '1rem' }}>Move Down</span>
                      </>
                    ),
                    onClick: () =>
                      onMoveSlide({ slideId, direction: 'down', interactiveId })
                  }
                ])
          ]),
      ...(isPublished
        ? []
        : [
            {
              label: (
                <>
                  <Icon icon="upload" />
                  <span style={{ marginLeft: '1rem' }}>Publish</span>
                </>
              ),
              onClick: handlePublishSlide
            }
          ]),
      {
        label:
          isPublished && !isFork ? (
            <>
              <Icon icon="ban" />
              <span style={{ marginLeft: '1rem' }}>Unpublish</span>
            </>
          ) : (
            <>
              <Icon icon="trash-alt" />
              <span style={{ marginLeft: '1rem' }}>Delete</span>
            </>
          ),
        onClick: handleDeleteClick
      }
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    displayedSlideIds,
    interactiveId,
    isPublished,
    isDeleted,
    isFork,
    slideId,
    cannotMoveDown,
    cannotMoveUp
  ]);

  return (
    <>
      {insertButtonShown && (
        <InsertSlide
          archivedSlides={archivedSlides}
          forkedFrom={forkedFrom}
          interactiveId={interactiveId}
          slideId={slideId}
          slideObj={slideObj}
          className={css`
            margin-top: ${index === 0 ? 0 : '2rem'};
            @media (max-width: ${mobileMaxWidth}) {
              margin-top: ${index === 0 && canEdit ? 0 : '1rem'};
            }
          `}
        />
      )}
      <div
        ref={innerRef}
        className={css`
          width: 100%;
          height: auto;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding-left: 2rem;
          padding-right: 2rem;
          padding-top: ${isEditing ? '2rem' : '1rem'};
          padding-bottom: 2rem;
          margin-top: ${canEdit ? '2rem' : index === 0 ? 0 : '5rem'};
          background: #fff;
          border: 1px solid ${Color.borderGray()};
          border-radius: ${borderRadius};
          @media (max-width: ${mobileMaxWidth}) {
            margin-top: ${canEdit ? '1rem' : index === 0 ? 0 : '2rem'};
            border-left: 0;
            border-right: 0;
            border-radius: 0;
          }
        `}
        style={style}
      >
        {!!canEdit && !isEditing && !isDeleted && (
          <div className="dropdown-wrapper">
            <DropdownButton
              skeuomorphic
              color="darkerGray"
              listStyle={{ width: '25ch' }}
              style={{
                position: 'absolute',
                right: '1rem',
                top: '1rem',
                zIndex: 10
              }}
              opacity={0.8}
              menuProps={dropdownMenuProps}
            />
          </div>
        )}
        {isEditing ? (
          <Editor
            attachment={attachment}
            description={description}
            fileUploadProgress={fileUploadProgress}
            forkedFrom={forkedFrom}
            heading={heading}
            interactiveId={interactiveId}
            isFork={isFork}
            isPortal={isPortal}
            isLastSlide={isLastSlide}
            forkButtonIds={forkButtonIds}
            forkButtonsObj={forkButtonsObj}
            onHideDeletedMessages={handleHideDeletedMessages}
            paths={paths}
            portalButton={portalButton}
            slideId={slideId}
            slideObj={slideObj}
            uploadingFile={uploadingFile}
          />
        ) : isDeleted ? (
          <Deleted
            onRemoveInteractiveSlide={() =>
              onRemoveInteractiveSlide({ interactiveId, slideId })
            }
            onUndeleteSlide={handleUndeleteSlide}
          />
        ) : (
          <Content
            centerRef={ComponentRef}
            forkedFrom={forkedFrom}
            isPublished={isPublished}
            isPortal={isPortal}
            portalButton={portalButton}
            interactiveId={interactiveId}
            attachment={attachment}
            heading={heading}
            description={description}
            forkButtonIds={forkButtonIds}
            forkButtonsObj={forkButtonsObj}
            onForkButtonClick={handleForkButtonClick}
            onPortalButtonClick={handlePortalButtonClick}
            onSetEmbedProps={handleSetEmbedProps}
            onThumbnailUpload={handleThumbnailUpload}
            slideId={slideId}
            selectedForkButtonId={selectedForkButtonId}
            isOnModal={isOnModal}
          />
        )}
        {!isPublished && !isEditing && !isDeleted && (
          <div style={{ bottom: '1rem', right: '1rem', position: 'absolute' }}>
            <Button color="darkBlue" onClick={handlePublishSlide} skeuomorphic>
              <Icon icon="upload" />
              <span style={{ marginLeft: '0.7rem' }}>Publish</span>
            </Button>
          </div>
        )}
        {confirmModalShown && (
          <ConfirmModal
            onHide={() => setConfirmModalShown(false)}
            title="Remove Fork Slide"
            description="Are you sure? This action cannot be undone"
            onConfirm={() => handleDeleteSlide({ noUndelete: true })}
            modalOverModal={isOnModal}
          />
        )}
      </div>
    </>
  );

  function handleDeleteClick() {
    if (isFork) {
      return setConfirmModalShown(true);
    }
    if (isPublished) {
      return handleUnpublishSlide();
    }
    handleDeleteSlide();
  }

  async function handleDeleteSlide({ noUndelete } = {}) {
    const numUpdates = await deleteInteractiveSlide(slideId);
    onChangeNumUpdates({ interactiveId, numUpdates });
    if (noUndelete) {
      onRemoveInteractiveSlide({ interactiveId, slideId });
    } else {
      onSetSlideState({
        interactiveId,
        slideId,
        newState: { isDeleted: true, selectedForkButtonId: null }
      });
    }
    for (let [key, slide] of Object.entries(slideObj)) {
      if (slide.forkedFrom === slideId) {
        onArchiveSlide({ interactiveId, slideId: Number(key) });
      }
    }
  }

  function handleHideDeletedMessages(forkSlideId) {
    for (let slideId of displayedSlideIds) {
      if (
        displayedSlideIds.indexOf(slideId) >
          displayedSlideIds.indexOf(forkSlideId) &&
        slideObj[slideId]?.isDeleted
      ) {
        onRemoveInteractiveSlide({ interactiveId, slideId });
      }
    }
  }

  function handleForkButtonClick(buttonId) {
    if (onExpandPath) {
      onExpandPath({ newSlides: paths[buttonId], slideId, buttonId });
    }
  }

  function handlePortalButtonClick(forkId) {
    if (forkId === 0) {
      return onGoBackToMission?.();
    }
    onGoBack({ interactiveId, forkId: forkId || forkedFrom });
  }

  async function handlePublishSlide() {
    const numUpdates = await publishInteractiveSlide(slideId);
    onChangeNumUpdates({ interactiveId, numUpdates });
    onSetSlideState({
      interactiveId,
      slideId,
      newState: { isPublished: true }
    });
  }

  async function handleUnpublishSlide() {
    const numUpdates = await unPublishInteractiveSlide(slideId);
    onChangeNumUpdates({ interactiveId, numUpdates });
    onSetSlideState({
      interactiveId,
      slideId,
      newState: { isPublished: false }
    });
  }

  async function handleSetEmbedProps(params) {
    onSetSlideState({
      interactiveId,
      slideId,
      newState: {
        attachment: {
          ...attachment,
          ...params
        }
      }
    });
  }

  function handleThumbnailUpload(thumbUrl) {
    onSetSlideState({
      interactiveId,
      slideId,
      newState: {
        attachment: {
          ...attachment,
          thumbUrl
        }
      }
    });
  }

  async function handleUndeleteSlide() {
    const numUpdates = await undeleteInteractiveSlide(slideId);
    onChangeNumUpdates({ interactiveId, numUpdates });
    onSetSlideState({
      interactiveId,
      slideId,
      newState: { isDeleted: false }
    });
  }
}

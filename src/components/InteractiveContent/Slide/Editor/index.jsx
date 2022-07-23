import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  useAppContext,
  useInputContext,
  useInteractiveContext,
  useKeyContext
} from '~/contexts';
import {
  addEmoji,
  exceedsCharLimit,
  finalizeEmoji,
  generateFileName,
  stringIsEmpty,
  isValidUrl,
  isValidYoutubeUrl
} from '~/helpers/stringHelpers';
import Textarea from '~/components/Texts/Textarea';
import Input from '~/components/Texts/Input';
import AttachmentField from './AttachmentField';
import FileUploadStatusIndicator from '~/components/FileUploadStatusIndicator';
import SwitchButton from '~/components/Buttons/SwitchButton';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import ForkButtonsField from './ForkButtonsField';
import GoBackField from './GoBackField';
import { returnImageFileFromUrl } from '~/helpers';
import { edit } from '~/constants/placeholders';
import { isEqual } from 'lodash';
import { v1 as uuidv1 } from 'uuid';

Editor.propTypes = {
  attachment: PropTypes.object,
  heading: PropTypes.string,
  description: PropTypes.string,
  fileUploadProgress: PropTypes.number,
  forkedFrom: PropTypes.number,
  isFork: PropTypes.bool,
  isPortal: PropTypes.bool,
  forkButtonIds: PropTypes.array,
  forkButtonsObj: PropTypes.object,
  portalButton: PropTypes.object,
  paths: PropTypes.object,
  interactiveId: PropTypes.number,
  onHideDeletedMessages: PropTypes.func,
  slideId: PropTypes.number,
  slideObj: PropTypes.object,
  isLastSlide: PropTypes.bool,
  uploadingFile: PropTypes.bool
};

export default function Editor({
  attachment,
  description,
  fileUploadProgress,
  forkedFrom,
  heading,
  interactiveId,
  isFork,
  isPortal,
  isLastSlide,
  forkButtonIds,
  forkButtonsObj,
  onHideDeletedMessages,
  portalButton,
  paths,
  slideId,
  slideObj,
  uploadingFile
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const defaultInputState = useMemo(
    () => ({
      editedPortalButton: portalButton || {
        label: 'Go Back',
        icon: 'history',
        destination: forkedFrom
      },
      editedIsFork: isFork,
      editedIsPortal: isPortal,
      editedAttachment: attachment || null,
      editedHeading: heading || '',
      editedDescription: description || '',
      editedForkButtonIds: forkButtonIds.length > 0 ? forkButtonIds : [1, 2],
      editedForkButtonsObj:
        forkButtonsObj && Object.keys(forkButtonsObj).length > 0
          ? forkButtonsObj
          : {
              1: {
                id: 1,
                label: 'option 1'
              },
              2: {
                id: 2,
                label: 'option 2'
              }
            }
    }),
    [
      attachment,
      description,
      forkButtonIds,
      forkButtonsObj,
      forkedFrom,
      heading,
      isFork,
      isPortal,
      portalButton
    ]
  );

  const editInteractiveSlide = useAppContext(
    (v) => v.requestHelpers.editInteractiveSlide
  );
  const uploadFile = useAppContext((v) => v.requestHelpers.uploadFile);
  const uploadThumb = useAppContext((v) => v.requestHelpers.uploadThumb);
  const state = useInputContext((v) => v.state);
  const onSetEditInteractiveForm = useInputContext(
    (v) => v.actions.onSetEditInteractiveForm
  );
  const onChangeNumUpdates = useInteractiveContext(
    (v) => v.actions.onChangeNumUpdates
  );
  const onSetSlideState = useInteractiveContext(
    (v) => v.actions.onSetSlideState
  );
  const prevInputState = useMemo(
    () => state[`edit-interactive-${interactiveId}-${slideId}`],
    [interactiveId, slideId, state]
  );
  const inputStateRef = useRef(prevInputState || defaultInputState);
  const [inputState, setInputState] = useState(
    prevInputState || defaultInputState
  );
  const editForm = inputState || {};
  const {
    editedPortalButton,
    editedIsFork,
    editedIsPortal,
    editedAttachment,
    editedHeading = '',
    editedDescription = '',
    editedForkButtonIds,
    editedForkButtonsObj
  } = editForm;

  const pathsExist = useMemo(() => {
    if (!paths) return false;
    for (let [, path] of Object.entries(paths)) {
      if (path.length > 0) return true;
    }
    return false;
  }, [paths]);

  const forkSwitchShown = useMemo(
    () => isLastSlide && !(isFork && pathsExist),
    [isFork, isLastSlide, pathsExist]
  );

  const portalSwitchShown = !!forkedFrom;

  const descriptionExceedsCharLimit = useMemo(
    () =>
      exceedsCharLimit({
        contentType: 'interactive',
        inputType: 'description',
        text: editedDescription
      }),
    [editedDescription]
  );

  const headingExceedsCharLimit = useMemo(
    () =>
      exceedsCharLimit({
        contentType: 'interactive',
        inputType: 'heading',
        text: editedHeading
      }),
    [editedHeading]
  );

  const doneButtonDisabled = useMemo(() => {
    if (uploadingFile) {
      return true;
    }
    if (editedAttachment?.isChanging && !editedAttachment?.newAttachment) {
      return false;
    }
    const portalButtonNotChanged = editedIsPortal
      ? isEqual(editedPortalButton, portalButton)
      : true;
    const forkButtonOrderNotChanged = editedIsFork
      ? isEqual(editedForkButtonIds, forkButtonIds)
      : true;
    const forkButtonNotChanged = editedIsFork
      ? isEqual(editedForkButtonsObj, forkButtonsObj)
      : true;
    const attachmentNotChanged = editedAttachment
      ? isEqual(
          {
            ...editedAttachment,
            isYouTubeVideo:
              editedAttachment.type !== 'link'
                ? null
                : editedAttachment.isYouTubeVideo,
            linkUrl:
              editedAttachment.type !== 'link'
                ? null
                : editedAttachment.linkUrl,
            type: null,
            isChanging: null,
            newAttachment: editedAttachment?.newAttachment
          },
          {
            ...attachment,
            isYouTubeVideo:
              attachment?.type !== 'link' ? null : attachment?.isYouTubeVideo,
            linkUrl: attachment?.type !== 'link' ? null : attachment?.linkUrl,
            type: null,
            isChanging: null,
            newAttachment: attachment?.newAttachment
          }
        )
      : true;

    if (
      portalButtonNotChanged &&
      editedIsFork === isFork &&
      editedIsPortal === isPortal &&
      attachmentNotChanged &&
      editedHeading === heading &&
      editedDescription === description &&
      forkButtonOrderNotChanged &&
      forkButtonNotChanged
    ) {
      return true;
    }
    if (editedAttachment?.type === 'link') {
      if (stringIsEmpty(editedAttachment?.linkUrl)) {
        return true;
      }
      if (!isValidUrl(editedAttachment?.linkUrl)) {
        return true;
      }
      if (
        editedAttachment.isYouTubeVideo &&
        !isValidYoutubeUrl(editedAttachment?.linkUrl)
      ) {
        return true;
      }
    }
    if (descriptionExceedsCharLimit) {
      return true;
    }
    if (headingExceedsCharLimit) {
      return true;
    }
    if (editedIsFork) {
      for (let [, button] of Object.entries(editedForkButtonsObj)) {
        if (
          stringIsEmpty(button.label) ||
          exceedsCharLimit({
            contentType: 'interactive',
            inputType: 'heading',
            text: button.label
          })
        ) {
          return true;
        }
      }
    }
    return false;
  }, [
    uploadingFile,
    editedAttachment,
    editedIsPortal,
    editedPortalButton,
    portalButton,
    editedIsFork,
    editedForkButtonIds,
    forkButtonIds,
    editedForkButtonsObj,
    forkButtonsObj,
    attachment,
    isFork,
    isPortal,
    editedHeading,
    heading,
    editedDescription,
    description,
    descriptionExceedsCharLimit,
    headingExceedsCharLimit
  ]);

  useEffect(() => {
    return function saveInputStateBeforeUnmount() {
      onSetEditInteractiveForm({
        interactiveId,
        slideId,
        form: inputStateRef.current
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (
      editedAttachment &&
      attachment &&
      editedAttachment.fileUrl === attachment.fileUrl &&
      !editedAttachment.thumbUrl &&
      attachment.thumbUrl
    ) {
      handleSetInputState({
        ...editForm,
        editedAttachment: {
          ...editedAttachment,
          thumbUrl: attachment.thumbUrl
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachment, editedAttachment, interactiveId, slideId]);

  return (
    <div
      style={{
        width: '100%'
      }}
    >
      <div
        style={{
          display: 'flex',
          height: '100%',
          alignItems: 'center',
          flexDirection: 'column'
        }}
      >
        <div style={{ width: '70%' }}>
          <Input
            onChange={(text) =>
              handleSetInputState({
                ...editForm,
                editedHeading: text
              })
            }
            placeholder={edit.heading}
            value={editedHeading}
            style={headingExceedsCharLimit?.style}
          />
          <Textarea
            minRows={4}
            onChange={(event) => {
              const { value } = event.target;
              handleSetInputState({
                ...editForm,
                editedDescription: value
              });
            }}
            onKeyUp={(event) => {
              const { value } = event.target;
              handleSetInputState({
                ...editForm,
                editedDescription: addEmoji(value)
              });
            }}
            placeholder={edit.description}
            value={editedDescription}
            style={{ marginTop: '1rem', ...descriptionExceedsCharLimit?.style }}
          />
          <AttachmentField
            type={editedAttachment?.type || 'none'}
            isChanging={editedAttachment?.isChanging}
            isYouTubeVideo={editedAttachment?.isYouTubeVideo}
            fileUrl={editedAttachment?.fileUrl || ''}
            linkUrl={editedAttachment?.linkUrl || ''}
            thumbUrl={editedAttachment?.thumbUrl || ''}
            newAttachment={editedAttachment?.newAttachment || null}
            onThumbnailLoad={(thumbnail) => {
              handleSetInputState({
                ...editForm,
                editedAttachment: {
                  ...editForm.editedAttachment,
                  ...(editForm.editedAttachment?.newAttachment
                    ? {
                        newAttachment: {
                          ...editForm.editedAttachment?.newAttachment,
                          thumbnail
                        }
                      }
                    : {})
                }
              });
            }}
            onSetAttachmentState={(newState) => {
              handleSetInputState({
                ...editForm,
                editedAttachment: {
                  ...editForm.editedAttachment,
                  ...newState
                }
              });
            }}
            uploadingFile={uploadingFile}
          />
          {uploadingFile && (
            <FileUploadStatusIndicator
              style={{
                fontSize: '1.7rem',
                fontWeight: 'bold',
                marginTop: 0,
                paddingBottom: '1rem'
              }}
              fileName={editedAttachment?.newAttachment?.file?.name}
              uploadProgress={fileUploadProgress}
            />
          )}
          <div style={{ marginTop: '2rem', width: '100%' }}>
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              {forkSwitchShown && (
                <SwitchButton
                  labelStyle={{
                    fontSize: '1.7rem',
                    fontWeight: 'bold'
                  }}
                  label={
                    <>
                      <Icon icon="code-branch" />
                      <span style={{ marginLeft: '0.7rem' }}>fork buttons</span>
                    </>
                  }
                  checked={!!editedIsFork}
                  onChange={() =>
                    handleSetInputState({
                      ...editForm,
                      editedIsFork: !editedIsFork
                    })
                  }
                />
              )}
            </div>
            {((editedIsFork && forkSwitchShown) || isFork) &&
              editedForkButtonIds && (
                <ForkButtonsField
                  style={{ marginTop: '1rem' }}
                  editedForkButtonIds={editedForkButtonIds}
                  editedForkButtonsObj={editedForkButtonsObj}
                  onSetInputState={(newState) =>
                    handleSetInputState({
                      ...editForm,
                      ...newState
                    })
                  }
                />
              )}
          </div>
          {portalSwitchShown && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
                marginTop: '2rem'
              }}
            >
              <SwitchButton
                labelStyle={{
                  fontSize: '1.7rem',
                  fontWeight: 'bold'
                }}
                label={
                  <>
                    <Icon icon="history" />
                    <span style={{ marginLeft: '0.7rem' }}>go back button</span>
                  </>
                }
                checked={editedIsPortal}
                onChange={() =>
                  handleSetInputState({
                    ...editForm,
                    editedIsPortal: !editedIsPortal
                  })
                }
              />
              {editedIsPortal && (
                <GoBackField
                  button={editedPortalButton}
                  forkedFrom={forkedFrom}
                  interactiveId={interactiveId}
                  onSetButtonState={(newState) =>
                    handleSetInputState({
                      ...editForm,
                      editedPortalButton: {
                        ...editForm.editedPortalButton,
                        ...newState
                      }
                    })
                  }
                  slideObj={slideObj}
                  style={{ marginTop: '1rem' }}
                />
              )}
            </div>
          )}
        </div>
        <div
          style={{
            marginTop: forkSwitchShown || portalSwitchShown ? '2rem' : 0,
            width: '100%',
            display: 'flex',
            flexDirection: 'row-reverse'
          }}
        >
          <Button
            color={doneColor}
            onClick={handleSubmit}
            disabled={doneButtonDisabled}
          >
            Done
          </Button>
          <Button
            transparent
            disabled={uploadingFile}
            style={{ marginRight: '1rem' }}
            onClick={() => {
              handleSetInputState(prevInputState);
              onSetSlideState({
                interactiveId,
                slideId,
                newState: { isEditing: false }
              });
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );

  function handleSetInputState(newState) {
    setInputState(newState);
    inputStateRef.current = newState;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const deletingAttachment =
      !!editedAttachment?.isChanging && !editedAttachment?.newAttachment;
    const post = {
      ...editForm,
      editedAttachment: deletingAttachment ? null : editedAttachment,
      editedPaths: paths,
      editedHeading: finalizeEmoji(editedHeading),
      editedDescription: finalizeEmoji(editedDescription)
    };

    if (editedAttachment?.newAttachment && editedAttachment?.type !== 'none') {
      const promises = [];
      onSetSlideState({
        interactiveId,
        slideId,
        newState: { uploadingFile: true }
      });
      promises.push(
        uploadFile({
          context: 'interactive',
          fileName: generateFileName(editedAttachment.newAttachment.file.name),
          filePath: uuidv1(),
          file: editedAttachment.newAttachment.file,
          onUploadProgress: handleUploadProgress
        })
      );
      if (editedAttachment?.newAttachment?.thumbnail) {
        promises.push(
          (async () => {
            const file = returnImageFileFromUrl({
              imageUrl: editedAttachment?.newAttachment?.thumbnail
            });
            const thumbUrl = await uploadThumb({
              file,
              path: uuidv1()
            });
            return Promise.resolve(thumbUrl);
          })()
        );
      }
      const [uploadedFilePath, thumbUrl] = await Promise.all(promises);
      onSetSlideState({
        interactiveId,
        slideId,
        newState: { uploadingFile: false }
      });
      const post = {
        ...editForm,
        editedAttachment: {
          type: editForm.editedAttachment.type,
          fileUrl: uploadedFilePath,
          thumbUrl
        },
        editedHeading: finalizeEmoji(editedHeading),
        editedDescription: finalizeEmoji(editedDescription)
      };
      const { slide: newState, numUpdates } = await editInteractiveSlide({
        slideId,
        post
      });
      onChangeNumUpdates({ interactiveId, numUpdates });
      onSetSlideState({
        interactiveId,
        slideId,
        newState: {
          ...newState,
          isEditing: false,
          fileUploadProgress: null
        }
      });
      handleSetInputState(post);
    } else {
      const { slide: newState, numUpdates } = await editInteractiveSlide({
        slideId,
        post
      });
      onChangeNumUpdates({ interactiveId, numUpdates });
      onSetSlideState({
        interactiveId,
        slideId,
        newState: {
          ...newState,
          isEditing: false,
          fileUploadProgress: null
        }
      });
      handleSetInputState(post);
    }
    if (editForm.editedIsFork) {
      onHideDeletedMessages(slideId);
    }

    function handleUploadProgress({ loaded, total }) {
      onSetSlideState({
        interactiveId,
        slideId,
        newState: { fileUploadProgress: loaded / total }
      });
    }
  }
}

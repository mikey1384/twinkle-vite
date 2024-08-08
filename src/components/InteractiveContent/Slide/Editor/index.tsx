import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import ThumbnailPicker from '~/components/ThumbnailPicker';

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
}: {
  attachment: any;
  description: string;
  fileUploadProgress: number;
  forkedFrom: number;
  heading: string;
  interactiveId: number;
  isFork: boolean;
  isPortal: boolean;
  forkButtonIds: number[];
  forkButtonsObj: { [key: string]: any };
  onHideDeletedMessages: (arg: any) => void;
  portalButton: any;
  paths: any[];
  slideId: number;
  slideObj: any;
  isLastSlide: boolean;
  uploadingFile: boolean;
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const checkUserChange = useKeyContext((v) => v.helpers.checkUserChange);
  const { userId } = useKeyContext((v) => v.myState);

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputState, setInputState] = useState(
    prevInputState || defaultInputState
  );
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [selectedThumbnailIndex, setSelectedThumbnailIndex] = useState(0);
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
    for (const path of Object.values(paths)) {
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
      for (const button of Object.values(editedForkButtonsObj) as {
        label: string;
      }[]) {
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
            onChange={(event: any) => {
              const { value } = event.target;
              handleSetInputState({
                ...editForm,
                editedDescription: value
              });
            }}
            onKeyUp={(event: any) => {
              const { value } = event.target;
              handleSetInputState({
                ...editForm,
                editedDescription: addEmoji(value)
              });
            }}
            placeholder={edit.description}
            value={editedDescription}
            hasError={!!descriptionExceedsCharLimit}
            style={{ marginTop: '1rem' }}
          />
          <AttachmentField
            type={editedAttachment?.type || 'none'}
            isChanging={editedAttachment?.isChanging}
            isYouTubeVideo={editedAttachment?.isYouTubeVideo}
            fileUrl={editedAttachment?.fileUrl || ''}
            linkUrl={editedAttachment?.linkUrl || ''}
            thumbUrl={editedAttachment?.thumbUrl || ''}
            newAttachment={editedAttachment?.newAttachment || null}
            onThumbnailLoad={handleThumbnailLoad}
            onSetAttachmentState={(newState: any) => {
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
          {thumbnails.length > 0 && (
            <ThumbnailPicker
              thumbnails={thumbnails}
              initialSelectedIndex={selectedThumbnailIndex}
              onSelect={handleThumbnailSelect}
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
            loading={isSubmitting}
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

  function handleSetInputState(newState: any) {
    setInputState(newState);
    inputStateRef.current = newState;
  }

  function handleThumbnailLoad({
    thumbnails,
    selectedIndex
  }: {
    thumbnails: string[];
    selectedIndex: number;
  }) {
    setThumbnails(thumbnails);
    setSelectedThumbnailIndex(selectedIndex);
    handleSetInputState({
      ...editForm,
      editedAttachment: {
        ...editForm.editedAttachment,
        thumbnail: thumbnails[selectedIndex]
      }
    });
  }

  function handleThumbnailSelect(index: number) {
    setSelectedThumbnailIndex(index);
    handleSetInputState({
      ...editForm,
      editedAttachment: {
        ...editForm.editedAttachment,
        thumbnail: thumbnails[index]
      }
    });
  }

  async function handleSubmit(event: any) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const deletingAttachment =
        !!editedAttachment?.isChanging && !editedAttachment?.newAttachment;
      const post = {
        ...editForm,
        editedAttachment: deletingAttachment ? null : editedAttachment,
        editedPaths: paths,
        editedHeading: finalizeEmoji(editedHeading),
        editedDescription: finalizeEmoji(editedDescription)
      };

      if (
        editedAttachment?.newAttachment &&
        editedAttachment?.type !== 'none'
      ) {
        const promises = [];
        onSetSlideState({
          interactiveId,
          slideId,
          newState: { uploadingFile: true }
        });
        promises.push(
          uploadFile({
            context: 'interactive',
            fileName: generateFileName(
              editedAttachment.newAttachment.file.name
            ),
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
        const userChanged = checkUserChange(userId);
        if (userChanged) {
          return;
        }
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
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }

    function handleUploadProgress({
      loaded,
      total
    }: {
      loaded: number;
      total: number;
    }) {
      const userChanged = checkUserChange(userId);
      if (userChanged) {
        return;
      }
      onSetSlideState({
        interactiveId,
        slideId,
        newState: { fileUploadProgress: loaded / total }
      });
    }
  }
}

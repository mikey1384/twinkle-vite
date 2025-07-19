import React, { useMemo, useState } from 'react';
import Button from '~/components/Button';
import UploadButton from '~/components/Buttons/UploadButton';
import Icon from '~/components/Icon';
import FileViewer from '~/components/FileViewer';
import AlertModal from '~/components/Modals/AlertModal';
import FileContent from '~/components/FileContent';
import { mb, returnMaxUploadSize } from '~/constants/defaultValues';
import { getFileInfoFromFileName } from '~/helpers/stringHelpers';
import { returnImageFileFromUrl } from '~/helpers';
import { useKeyContext } from '~/contexts';
import { css } from '@emotion/css';

export default function FileField({
  isChanging,
  fileUrl,
  newAttachment,
  onSetAttachmentState,
  onThumbnailLoad,
  thumbUrl,
  uploadingFile
}: {
  isChanging: boolean;
  fileUrl: string;
  newAttachment: any;
  onSetAttachmentState: (v: any) => void;
  onThumbnailLoad: (data: {
    thumbnails: string[];
    selectedIndex: number;
  }) => void;
  thumbUrl: string;
  uploadingFile: boolean;
}) {
  const fileUploadLvl = useKeyContext((v) => v.myState.fileUploadLvl);
  const maxSize = useMemo(
    () => returnMaxUploadSize(fileUploadLvl),
    [fileUploadLvl]
  );
  const [alertModalShown, setAlertModalShown] = useState(false);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {!(isChanging || !fileUrl) ? (
        <>
          <Button
            skeuomorphic
            className={css`
              z-index: 10;
              opacity: 0.9;
              &:hover {
                opacity: 1;
              }
            `}
            style={{
              position: 'absolute',
              right: 3,
              top: 3,
              padding: '0.6rem'
            }}
            onClick={() => onSetAttachmentState({ isChanging: true })}
          >
            <Icon icon="times" size="lg" />
          </Button>
          <FileViewer thumbUrl={thumbUrl} src={fileUrl} />
        </>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '1rem'
          }}
        >
          {newAttachment && !uploadingFile && (
            <FileContent
              file={newAttachment.file}
              fileType={newAttachment.fileType}
              imageUrl={newAttachment.imageUrl}
              fileIconSize="10x"
              fileNameLength={50}
              fileNameStyle={{ fontSize: '1.5rem', lineHeight: 2.5 }}
              imageBackgroundColor="#fff"
              onThumbnailLoad={onThumbnailLoad}
              style={{ width: '100%', marginBottom: '2rem', height: 'auto' }}
            />
          )}
          {!uploadingFile && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                flexDirection: 'column'
              }}
            >
              <UploadButton
                onFileSelect={handleFileSelection}
                color="orange"
                skeuomorphic
                icon="paperclip"
                text={`Select ${newAttachment ? 'another' : 'a'} file`}
              />
              {fileUrl && (
                <Button
                  onClick={() =>
                    onSetAttachmentState({
                      isChanging: false,
                      newAttachment: null
                    })
                  }
                  style={{ marginTop: '1rem' }}
                  skeuomorphic
                >
                  Cancel
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      {alertModalShown && (
        <AlertModal
          title="File is too large"
          content={`The file size is larger than your limit of ${
            maxSize / mb
          } MB`}
          onHide={() => setAlertModalShown(false)}
        />
      )}
    </div>
  );

  function handleFileSelection(fileObj: File) {
    if (fileObj.size / mb > maxSize) {
      return setAlertModalShown(true);
    }
    const { fileType } = getFileInfoFromFileName(fileObj.name);
    if (fileType === 'image') {
      const reader = new FileReader();
      reader.onload = (upload: any) => {
        const payload = upload.target.result;
        const extension = fileObj.name.split('.').pop();
        if (extension === 'gif') {
          onSetAttachmentState({
            newAttachment: {
              fileType,
              file: fileObj,
              imageUrl: payload
            }
          });
        } else {
          window.loadImage(
            payload,
            function (img) {
              const imageUri = img.toDataURL(
                `image/${extension === 'png' ? 'png' : 'jpeg'}`
              );
              const file = returnImageFileFromUrl({
                imageUrl: imageUri,
                fileName: fileObj.name
              });
              onSetAttachmentState({
                newAttachment: {
                  fileType,
                  file,
                  imageUrl: imageUri
                }
              });
            },
            { orientation: true, canvas: true }
          );
        }
      };
      reader.readAsDataURL(fileObj);
    } else {
      onSetAttachmentState({
        newAttachment: {
          file: fileObj,
          contentType: 'file',
          fileType
        }
      });
    }
  }
}

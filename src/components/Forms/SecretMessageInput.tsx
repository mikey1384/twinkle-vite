import React, { useMemo, useRef, useState } from 'react';
import { Color } from '~/constants/css';
import {
  addEmoji,
  exceedsCharLimit,
  addCommasToNumber,
  getFileInfoFromFileName,
  stringIsEmpty
} from '~/helpers/stringHelpers';
import { useKeyContext } from '~/contexts';
import { returnImageFileFromUrl } from '~/helpers';
import {
  FILE_UPLOAD_XP_REQUIREMENT,
  mb,
  returnMaxUploadSize
} from '~/constants/defaultValues';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import Textarea from '~/components/Texts/Textarea';
import AlertModal from '~/components/Modals/AlertModal';
import Attachment from '~/components/Attachment';
import FullTextReveal from '~/components/Texts/FullTextReveal';
import localize from '~/constants/localize';

const secretMessageLabel = localize('secretMessage');
const enterSecretMessageLabel = localize('enterSecretMessage');

export default function SecretMessageInput({
  autoFocus = true,
  onSetSecretAnswer,
  secretAttachment,
  onSetSecretAttachment,
  onThumbnailLoad,
  secretAnswer
}: {
  autoFocus?: boolean;
  secretAnswer: string;
  secretAttachment: any;
  onSetSecretAnswer: (secretAnswer: string) => void;
  onSetSecretAttachment: (secretAttachment: any) => void;
  onThumbnailLoad: (data: {
    thumbnails: string[];
    selectedIndex: number;
  }) => void;
}) {
  const [onHover, setOnHover] = useState(false);
  const [alertModalShown, setAlertModalShown] = useState(false);
  const [draggedFile, setDraggedFile] = useState();
  const FileInputRef: React.RefObject<any> = useRef(null);
  const { fileUploadLvl, level, twinkleXP, userId } = useKeyContext(
    (v) => v.myState
  );
  const {
    button: { color: buttonColor },
    buttonHovered: { color: buttonHoverColor },
    skeuomorphicDisabled: {
      color: skeuomorphicDisabledColor,
      opacity: skeuomorphicDisabledOpacity
    }
  } = useKeyContext((v) => v.theme);
  const secretAnswerExceedsCharLimit = useMemo(
    () =>
      exceedsCharLimit({
        contentType: 'subject',
        inputType: 'description',
        text: secretAnswer
      }),
    [secretAnswer]
  );
  const maxSize = useMemo(
    () => returnMaxUploadSize(fileUploadLvl),
    [fileUploadLvl]
  );
  const disabled = useMemo(
    () => !userId || (level === 0 && twinkleXP < FILE_UPLOAD_XP_REQUIREMENT),
    [level, twinkleXP, userId]
  );

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <span
        style={{
          fontWeight: 'bold',
          fontSize: '2rem',
          color: Color.darkerGray()
        }}
      >
        {secretMessageLabel}
      </span>
      <div style={{ width: '100%', display: 'flex' }}>
        <div style={{ flexGrow: 1 }}>
          <Textarea
            autoFocus={autoFocus}
            draggedFile={draggedFile}
            hasError={!!secretAnswerExceedsCharLimit}
            style={{
              marginTop: '0.5rem'
            }}
            value={secretAnswer}
            minRows={4}
            placeholder={enterSecretMessageLabel}
            onChange={(event: any) =>
              onSetSecretAnswer(addEmoji(event.target.value))
            }
            onDrop={handleDrop}
            onKeyUp={(event: any) => {
              if (event.key === ' ') {
                onSetSecretAnswer(addEmoji(event.target.value));
              }
            }}
          />
          {secretAnswerExceedsCharLimit && (
            <small style={{ color: 'red' }}>
              {secretAnswerExceedsCharLimit.message}
            </small>
          )}
        </div>
        <div style={{ marginLeft: '1rem' }}>
          {secretAttachment ? (
            <Attachment
              style={{ marginLeft: '1rem', fontSize: '1rem' }}
              attachment={secretAttachment}
              onDragStart={() => {
                const file = secretAttachment?.file;
                let newFile;
                const { fileType } = getFileInfoFromFileName(file?.name);
                if (fileType === 'image') {
                  newFile = new File([file], file.name, {
                    type: 'image/png'
                  });
                } else {
                  newFile = file;
                }
                setDraggedFile(newFile);
              }}
              onThumbnailLoad={onThumbnailLoad}
              onClose={() => onSetSecretAttachment(null)}
            />
          ) : (
            <div>
              <Button
                skeuomorphic
                color={buttonColor}
                hoverColor={buttonHoverColor}
                onClick={() => (disabled ? null : FileInputRef.current.click())}
                onMouseEnter={() => setOnHover(true)}
                onMouseLeave={() => setOnHover(false)}
                style={{
                  opacity: disabled ? 0.2 : 1,
                  cursor: disabled ? 'default' : 'pointer',
                  boxShadow: disabled ? 'none' : '',
                  borderColor: disabled
                    ? Color[skeuomorphicDisabledColor](
                        skeuomorphicDisabledOpacity
                      )
                    : ''
                }}
              >
                <Icon size="lg" icon="upload" />
              </Button>
              {userId && disabled && (
                <FullTextReveal
                  style={{
                    fontSize: '1.3rem',
                    marginTop: '0.5rem'
                  }}
                  text={`Requires ${addCommasToNumber(
                    FILE_UPLOAD_XP_REQUIREMENT
                  )} XP`}
                  show={onHover}
                />
              )}
            </div>
          )}
        </div>
      </div>
      <input
        ref={FileInputRef}
        style={{ display: 'none' }}
        type="file"
        onChange={handleUpload}
      />
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

  function handleDrop(filePath: string) {
    onSetSecretAnswer(
      `${
        stringIsEmpty(secretAnswer) ? '' : `${secretAnswer}\n`
      }![](${filePath})`
    );
    if (draggedFile) {
      setDraggedFile(undefined);
      onSetSecretAttachment(null);
    }
  }

  function handleUpload(event: any) {
    const fileObj = event.target.files[0];
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
          onSetSecretAttachment({
            file: fileObj,
            fileType,
            imageUrl: payload
          });
        } else {
          window.loadImage(
            payload,
            function (img) {
              const imageUrl = img.toDataURL(
                `image/${extension === 'png' ? 'png' : 'jpeg'}`
              );
              const file = returnImageFileFromUrl({
                imageUrl,
                fileName: fileObj.name
              });
              onSetSecretAttachment({
                file,
                fileType,
                imageUrl
              });
            },
            { orientation: true, canvas: true }
          );
        }
      };
      reader.readAsDataURL(fileObj);
    } else {
      onSetSecretAttachment({
        file: fileObj,
        fileType
      });
    }
    event.target.value = null;
  }
}

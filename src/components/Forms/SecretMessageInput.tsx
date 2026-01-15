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
  needsImageConversion,
  convertToWebFriendlyFormat
} from '~/helpers/imageHelpers';
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
import FullTextReveal from '~/components/Texts/FullTextReveal';import { useRoleColor } from '~/theme/useRoleColor';

const secretMessageLabel = 'Secret Message';
const enterSecretMessageLabel = 'Enter Secret Message';

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
  const { colorKey: buttonColorKey } = useRoleColor('button', {
    fallback: 'logoBlue'
  });
  const { colorKey: buttonHoverColorKey } = useRoleColor('buttonHovered', {
    fallback: buttonColorKey || 'logoBlue'
  });
  const {
    defaultOpacity: skeuomorphicDisabledOpacity = 0.4,
    getColor: getSkeuomorphicDisabledColor
  } = useRoleColor('skeuomorphicDisabled', {
    fallback: 'darkerGray',
    opacity: 0.4
  });

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
                if (file) {
                  setDraggedFile(file);
                }
              }}
              onThumbnailLoad={onThumbnailLoad}
              onClose={() => onSetSecretAttachment(null)}
            />
          ) : (
            <div>
              <Button
                variant="soft"
                tone="raised"
                color={
                  buttonColorKey &&
                  Color[buttonColorKey as keyof typeof Color]
                    ? buttonColorKey
                    : 'logoBlue'
                }
                hoverColor={
                  buttonHoverColorKey &&
                  Color[buttonHoverColorKey as keyof typeof Color]
                    ? buttonHoverColorKey
                    : buttonColorKey || 'logoBlue'
                }
                onClick={() => (disabled ? null : FileInputRef.current.click())}
                onMouseEnter={() => setOnHover(true)}
                onMouseLeave={() => setOnHover(false)}
                style={{
                  opacity: disabled ? 0.2 : 1,
                  cursor: disabled ? 'default' : 'pointer',
                  boxShadow: disabled ? 'none' : '',
                  borderColor: disabled
                    ? getSkeuomorphicDisabledColor(skeuomorphicDisabledOpacity)
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

  async function handleUpload(event: any) {
    const fileObj = event.target.files[0];
    if (fileObj.size / mb > maxSize) {
      return setAlertModalShown(true);
    }
    const { fileType } = getFileInfoFromFileName(fileObj.name);

    // Check if image needs conversion (HEIC, TIFF, AVIF, etc.) BEFORE fileType check
    // These formats may not be classified as 'image' but are images that need conversion
    if (needsImageConversion(fileObj.name)) {
      try {
        const { file: convertedFile, dataUrl, converted } =
          await convertToWebFriendlyFormat(fileObj);
        if (converted) {
          // Note: We don't re-check size after conversion. The user selected a file
          // within their limit - they shouldn't be penalized if our conversion inflates it.
          onSetSecretAttachment({
            file: convertedFile,
            fileType: 'image',
            imageUrl: dataUrl
          });
          event.target.value = null;
          return;
        }
        // Conversion failed - fall through to non-image handling
      } catch (error) {
        console.warn('Image conversion failed:', error);
        // Fall through to non-image handling
      }
    }

    if (fileType === 'image') {
      const reader = new FileReader();
      reader.onload = (upload: any) => {
        const payload = upload.target.result;
        const extension = fileObj.name.split('.').pop()?.toLowerCase();
        if (extension === 'gif' || extension === 'svg') {
          onSetSecretAttachment({
            file: fileObj,
            fileType,
            imageUrl: payload
          });
        } else {
          window.loadImage(
            payload,
            function (img) {
              // loadImage returns a canvas on success, or an error on failure
              if (img && typeof img.toDataURL === 'function') {
                const outputFormat = extension === 'png' ? 'png' : 'jpeg';
                const imageUrl = img.toDataURL(`image/${outputFormat}`);
                // Use correct extension to match actual content type
                const outputFileName =
                  outputFormat === 'png'
                    ? fileObj.name
                    : fileObj.name.replace(/\.[^.]+$/, '.jpg');
                const file = returnImageFileFromUrl({
                  imageUrl,
                  fileName: outputFileName
                });
                onSetSecretAttachment({
                  file,
                  fileType,
                  imageUrl
                });
              } else {
                // loadImage couldn't process - use original file
                onSetSecretAttachment({
                  file: fileObj,
                  fileType,
                  imageUrl: payload
                });
              }
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

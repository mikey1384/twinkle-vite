import React, { useMemo, useState } from 'react';
import ProgressBar from '~/components/ProgressBar';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useAppContext, useKeyContext } from '~/contexts';
import { v1 as uuidv1 } from 'uuid';
import {
  cloudFrontURL,
  mb,
  returnMaxUploadSize
} from '~/constants/defaultValues';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import TextareaAutosize from 'react-textarea-autosize';
import AlertModal from '~/components/Modals/AlertModal';

export default function Textarea({
  className,
  innerRef,
  maxRows = 20,
  onDrop,
  theme,
  ...props
}: {
  className?: string;
  context?: string;
  innerRef?: any;
  isDroppable?: boolean;
  maxRows?: number;
  onDrop?: (filePath: string) => void;
  theme?: string;
  [key: string]: any;
}) {
  const { fileUploadLvl } = useKeyContext((v) => v.myState);
  const maxSize = useMemo(
    () => returnMaxUploadSize(fileUploadLvl),
    [fileUploadLvl]
  );
  const uploadFile = useAppContext((v) => v.requestHelpers.uploadFile);
  const [uploadErrorType, setUploadErrorType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const progress = useMemo(
    () => Math.ceil(100 * uploadProgress),
    [uploadProgress]
  );
  const errorModalContent = useMemo(() => {
    switch (uploadErrorType) {
      case 'size':
        return {
          title: 'File too large',
          content: `The file size exceeds the maximum allowed upload size of ${addCommasToNumber(
            maxSize / mb
          )}MB.`
        };
      case 'type':
        return {
          title: 'Unsupported file type',
          content:
            'Only image files can be uploaded. Please try again with a different file.'
        };
      default:
        return {
          title: 'Upload error',
          content:
            'An error occurred while trying to upload your file. Please try again.'
        };
    }
  }, [maxSize, uploadErrorType]);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <TextareaAutosize
        {...props}
        maxRows={maxRows}
        ref={innerRef}
        onDrop={onDrop ? handleDrop : undefined}
        onDragOver={(e) => e.preventDefault()}
        className={`${className} ${css`
          opacity: ${uploading ? 0.2 : 1};
          font-family: 'Noto Sans', Helvetica, sans-serif, Arial;
          width: 100%;
          position: relative;
          font-size: 1.7rem;
          padding: 1rem;
          border: 1px solid ${Color.darkerBorderGray()};
          &:focus {
            outline: none;
            border: 1px solid ${Color.logoBlue()};
            box-shadow: 0px 0px 3px ${Color.logoBlue(0.8)};
            ::placeholder {
              color: ${Color.lighterGray()};
            }
          }
          ::placeholder {
            color: ${Color.gray()};
          }
          @media (max-width: ${mobileMaxWidth}) {
            line-height: 1.6;
            font-size: 1.5rem;
          }
        `}`}
      />
      {uploading && (
        <div
          style={{
            position: 'absolute',
            height: '100%',
            width: '100%',
            top: '-5px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <ProgressBar
            theme={theme}
            progress={progress}
            color={progress === 100 ? Color.green() : undefined}
            style={{ width: '80%' }}
          />
        </div>
      )}
      {uploadErrorType && (
        <AlertModal
          {...errorModalContent}
          onHide={() => setUploadErrorType('')}
        />
      )}
    </div>
  );

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (file.size / mb > maxSize) {
      return setUploadErrorType('size');
    }
    if (!file.type.startsWith('image/')) {
      return setUploadErrorType('type');
    }
    setUploading(true);
    const filePath = uuidv1();
    try {
      await uploadFile({
        filePath,
        file,
        context: 'embed',
        onUploadProgress: handleUploadProgress
      });
      onDrop?.(
        `${cloudFrontURL}/attachments/embed/${filePath}/${encodeURIComponent(
          file.name
        )}`
      );
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  function handleUploadProgress({
    loaded,
    total
  }: {
    loaded: number;
    total: number;
  }) {
    setUploadProgress(loaded / total);
  }
}

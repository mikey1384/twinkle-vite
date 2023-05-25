import React, { useMemo, useState } from 'react';
import ProgressBar from '~/components/ProgressBar';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useAppContext } from '~/contexts';
import { v1 as uuidv1 } from 'uuid';
import { cloudFrontURL } from '~/constants/defaultValues';
import TextareaAutosize from 'react-textarea-autosize';

export default function Textarea({
  className,
  context = 'feed',
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
  const uploadFile = useAppContext((v) => v.requestHelpers.uploadFile);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const progress = useMemo(
    () => Math.ceil(100 * uploadProgress),
    [uploadProgress]
  );

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
    </div>
  );

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setUploading(true);
    const file = e.dataTransfer.files[0];
    const filePath = uuidv1();
    await uploadFile({
      filePath,
      file,
      onUploadProgress: handleUploadProgress
    });
    onDrop?.(
      `${cloudFrontURL}/attachments/${context}/${filePath}/${encodeURIComponent(
        file.name
      )}`
    );
    setUploading(false);
    setUploadProgress(0);
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

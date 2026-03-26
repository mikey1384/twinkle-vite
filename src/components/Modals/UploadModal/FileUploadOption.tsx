import React, { useId, useRef, useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { useRoleColor } from '~/theme/useRoleColor';

const hiddenFileInputStyle: React.CSSProperties = {
  position: 'fixed',
  left: '-9999px',
  top: 0,
  width: '1px',
  height: '1px',
  opacity: 0,
  pointerEvents: 'none'
};

const buttonFileInputOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  opacity: 0,
  cursor: 'pointer'
};

interface FileUploadOptionProps {
  onFileSelect: (file: File) => void;
  onFilesSelect?: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
}

export default function FileUploadOption({
  onFileSelect,
  onFilesSelect,
  accept,
  multiple = false
}: FileUploadOptionProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const { colorKey: buttonColorKey } = useRoleColor('button', {
    fallback: 'logoBlue'
  });
  const isMultiImageSelectEnabled = Boolean(multiple && onFilesSelect);
  const buttonPhotoInputRef = useRef<HTMLInputElement>(null);
  const buttonFileInputRef = useRef<HTMLInputElement>(null);
  const photoInputId = useId();
  const fileInputId = useId();
  const primaryInputId = isMultiImageSelectEnabled ? photoInputId : fileInputId;

  return (
    <div style={{ textAlign: 'center', padding: '2rem', width: '100%' }}>
      <div
        style={{
          fontSize: '1.6rem',
          fontWeight: 'bold',
          marginBottom: '2rem',
          color: Color.black()
        }}
      >
        Upload from Your Device
      </div>

      <label
        htmlFor={primaryInputId}
        style={{
          display: 'block',
          border: `2px dashed ${
            isDragOver ? Color.logoBlue() : Color.borderGray()
          }`,
          borderRadius: '1rem',
          padding: '3rem',
          marginBottom: '2rem',
          backgroundColor: isDragOver ? Color.logoBlue(0.1) : Color.wellGray(),
          transition: 'all 0.2s ease',
          cursor: 'pointer'
        }}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Icon
          icon="cloud-upload-alt"
          size="4x"
          style={{ color: Color.gray() }}
        />
        <div
          style={{ marginTop: '1rem', fontSize: '1.2rem', color: Color.gray() }}
        >
          {isDragOver
            ? isMultiImageSelectEnabled
              ? 'Drop photos here'
              : 'Drop files here'
            : isMultiImageSelectEnabled
            ? 'Drag and drop photos here or click to browse'
            : 'Drag and drop files here or click to browse'}
        </div>
        {accept && !isMultiImageSelectEnabled && (
          <div
            style={{
              marginTop: '0.5rem',
              fontSize: '1rem',
              color: Color.gray()
            }}
          >
            Accepted formats: {accept}
          </div>
        )}
      </label>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}
      >
        {isMultiImageSelectEnabled ? (
          <>
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              <Button
                variant="soft"
                tone="raised"
                color={
                  buttonColorKey && buttonColorKey in Color
                    ? buttonColorKey
                    : 'logoBlue'
                }
                onClick={handleChoosePhotosClick}
                style={{ fontSize: '1.4rem', padding: '1rem 2rem' }}
              >
                <Icon icon="images" />
                <span style={{ marginLeft: '0.7rem' }}>Choose Photos</span>
              </Button>
              <input
                ref={buttonPhotoInputRef}
                type="file"
                accept="image/*"
                multiple
                tabIndex={-1}
                onChange={handlePhotosChange}
                style={buttonFileInputOverlayStyle}
                aria-label="Choose Photos"
              />
            </div>
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              <Button
                variant="soft"
                tone="raised"
                color={
                  buttonColorKey && buttonColorKey in Color
                    ? buttonColorKey
                    : 'logoBlue'
                }
                onClick={handleChooseFileClick}
                style={{ fontSize: '1.4rem', padding: '1rem 2rem' }}
              >
                <Icon icon="folder-open" />
                <span style={{ marginLeft: '0.7rem' }}>Choose File</span>
              </Button>
              <input
                ref={buttonFileInputRef}
                type="file"
                accept={accept}
                multiple={false}
                tabIndex={-1}
                onChange={handleFileChange}
                style={buttonFileInputOverlayStyle}
                aria-label="Choose File"
              />
            </div>
          </>
        ) : (
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <Button
              variant="soft"
              tone="raised"
              color={
                buttonColorKey && buttonColorKey in Color
                  ? buttonColorKey
                  : 'logoBlue'
              }
              onClick={handleChooseFileClick}
              style={{ fontSize: '1.4rem', padding: '1rem 2rem' }}
            >
              <Icon icon="folder-open" />
              <span style={{ marginLeft: '0.7rem' }}>Choose File</span>
            </Button>
            <input
              ref={buttonFileInputRef}
              type="file"
              accept={accept}
              multiple={false}
              tabIndex={-1}
              onChange={handleFileChange}
              style={buttonFileInputOverlayStyle}
              aria-label="Choose File"
            />
          </div>
        )}
      </div>

      {isMultiImageSelectEnabled && (
        <div style={{ marginTop: '1rem', fontSize: '1.1rem', color: Color.gray() }}>
          Tip: Choose multiple photos to send them in one message.
        </div>
      )}

      <input
        id={photoInputId}
        type="file"
        accept="image/*"
        multiple
        tabIndex={-1}
        onChange={handlePhotosChange}
        style={hiddenFileInputStyle}
        aria-hidden="true"
      />
      <input
        id={fileInputId}
        type="file"
        accept={accept}
        multiple={false}
        tabIndex={-1}
        onChange={handleFileChange}
        style={hiddenFileInputStyle}
        aria-hidden="true"
      />
    </div>
  );

  function handlePhotosChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      onFilesSelect?.(files);
    }
    event.target.value = '';
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
    event.target.value = '';
  }

  function handleChoosePhotosClick() {
    if (!buttonPhotoInputRef.current) return;
    buttonPhotoInputRef.current.value = '';
    buttonPhotoInputRef.current.click();
  }

  function handleChooseFileClick() {
    if (!buttonFileInputRef.current) return;
    buttonFileInputRef.current.value = '';
    buttonFileInputRef.current.click();
  }

  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  function handleDragEnter(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  }

  function handleDragLeave(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const relatedTarget = event.relatedTarget as Node | null;
    if (!relatedTarget || !event.currentTarget.contains(relatedTarget)) {
      setIsDragOver(false);
    }
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      if (multiple && onFilesSelect) onFilesSelect(Array.from(files));
      else onFileSelect(files[0]);
    }
  }
}

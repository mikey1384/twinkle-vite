import React, { useRef, useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { useRoleColor } from '~/theme/useRoleColor';

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
  const photoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const { colorKey: buttonColorKey } = useRoleColor('button', {
    fallback: 'logoBlue'
  });
  const isMultiImageSelectEnabled = Boolean(multiple && onFilesSelect);

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

      <div
        style={{
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
        onClick={handleSelectPrimary}
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
      </div>

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
            <Button
              variant="soft"
              tone="raised"
              color={
                buttonColorKey && buttonColorKey in Color
                  ? buttonColorKey
                  : 'logoBlue'
              }
              onClick={handleSelectPhotos}
              style={{ fontSize: '1.4rem', padding: '1rem 2rem' }}
            >
              <Icon icon="images" />
              <span style={{ marginLeft: '0.7rem' }}>Choose Photos</span>
            </Button>
            <Button
              variant="soft"
              tone="raised"
              color={
                buttonColorKey && buttonColorKey in Color
                  ? buttonColorKey
                  : 'logoBlue'
              }
              onClick={handleSelectFile}
              style={{ fontSize: '1.4rem', padding: '1rem 2rem' }}
            >
              <Icon icon="folder-open" />
              <span style={{ marginLeft: '0.7rem' }}>Choose File</span>
            </Button>
          </>
        ) : (
          <Button
            variant="soft"
            tone="raised"
            color={
              buttonColorKey && buttonColorKey in Color
                ? buttonColorKey
                : 'logoBlue'
            }
            onClick={handleSelectFile}
            style={{ fontSize: '1.4rem', padding: '1rem 2rem' }}
          >
            <Icon icon="folder-open" />
            <span style={{ marginLeft: '0.7rem' }}>Choose File</span>
          </Button>
        )}
      </div>

      {isMultiImageSelectEnabled && (
        <div style={{ marginTop: '1rem', fontSize: '1.1rem', color: Color.gray() }}>
          Tip: Choose multiple photos to send them in one message.
        </div>
      )}

      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handlePhotosChange}
        style={{ display: 'none' }}
        aria-hidden="true"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={false}
        onChange={handleFileChange}
        style={{ display: 'none' }}
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

  function handleSelectPrimary() {
    if (isMultiImageSelectEnabled) {
      return handleSelectPhotos();
    }
    handleSelectFile();
  }

  function handleSelectPhotos() {
    if (photoInputRef.current) {
      photoInputRef.current.click();
    }
  }

  function handleSelectFile() {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
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

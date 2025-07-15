import React, { useRef, useCallback } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useKeyContext } from '~/contexts';
import { Color } from '~/constants/css';

interface FileUploadOptionProps {
  onFileSelect: (file: File) => void;
  accept?: string;
}

export default function FileUploadOption({
  onFileSelect,
  accept
}: FileUploadOptionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    button: { color: buttonColor }
  } = useKeyContext((v) => v.theme);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        onFileSelect(files[0]);
      }
      event.target.value = '';
    },
    [onFileSelect]
  );

  const handleSelectFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
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
          border: `2px dashed ${Color.borderGray()}`,
          borderRadius: '1rem',
          padding: '3rem',
          marginBottom: '2rem',
          backgroundColor: Color.wellGray()
        }}
      >
        <Icon
          icon="cloud-upload-alt"
          size="4x"
          style={{ color: Color.gray() }}
        />
        <div
          style={{ marginTop: '1rem', fontSize: '1.2rem', color: Color.gray() }}
        >
          Click the button below to select files
        </div>
        {accept && (
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

      <Button
        skeuomorphic
        color={buttonColor}
        onClick={handleSelectFile}
        style={{ fontSize: '1.4rem', padding: '1rem 2rem' }}
      >
        <Icon icon="folder-open" />
        <span style={{ marginLeft: '0.7rem' }}>Choose Files</span>
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-hidden="true"
      />
    </div>
  );
}

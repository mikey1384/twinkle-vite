import React, { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import UploadModalContent from './Content';

interface UploadModalProps {
  onHide: () => void;
  onFileSelect: (file: File) => void;
  onDirectUpload: () => void;
  accept?: string;
}

export default function UploadModal({
  onHide,
  onFileSelect,
  onDirectUpload,
  accept
}: UploadModalProps) {
  const [selectedOption, setSelectedOption] = useState<
    'select' | 'upload' | 'generate'
  >('select');

  return (
    <Modal onHide={onHide} medium>
      <header
        style={{ display: selectedOption === 'select' ? 'none' : 'block' }}
      >
        <Button
          transparent
          onClick={() => setSelectedOption('select')}
          style={{ marginRight: '1rem' }}
        >
          <Icon icon="arrow-left" />
        </Button>
        Upload Options
      </header>
      <main style={{ padding: selectedOption === 'select' ? 0 : '1rem' }}>
        <UploadModalContent
          selectedOption={selectedOption}
          onFileSelect={onFileSelect}
          onFileUploadSelect={handleFileUploadSelect}
          onAIGenerateSelect={handleAIGenerateSelect}
          onGeneratedImage={handleGeneratedImage}
          onSetSelectedOption={setSelectedOption}
          accept={accept || 'image/*'}
        />
      </main>
      {selectedOption === 'select' && (
        <footer>
          <Button transparent onClick={onHide}>
            Cancel
          </Button>
        </footer>
      )}
    </Modal>
  );

  function handleFileUploadSelect() {
    setSelectedOption('upload');
    onDirectUpload();
    onHide();
  }

  function handleAIGenerateSelect() {
    setSelectedOption('generate');
  }

  function handleGeneratedImage(file: File) {
    onFileSelect(file);
    onHide();
  }
}

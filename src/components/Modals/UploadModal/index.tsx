import React, { useState } from 'react';
import NewModal from '~/components/NewModal';
import Button from '~/components/Button';
import UploadModalContent from './Content';

interface UploadModalProps {
  isOpen: boolean;
  onHide: () => void;
  onFileSelect: (file: File) => void;
  accept?: string;
}

export default function UploadModal({
  isOpen,
  onHide,
  onFileSelect,
  accept
}: UploadModalProps) {
  const [selectedOption, setSelectedOption] = useState<
    'select' | 'upload' | 'generate'
  >('select');

  return (
    <NewModal
      isOpen={isOpen}
      onClose={handleClose}
      title={getModalTitle()}
      size="lg"
      closeOnBackdropClick={selectedOption === 'select'}
      modalLevel={2}
      preventBodyScroll={false}
      footer={
        selectedOption === 'select' ? (
          <Button transparent onClick={handleClose}>Cancel</Button>
        ) : selectedOption === 'generate' || selectedOption === 'upload' ? (
          <Button transparent onClick={() => setSelectedOption('select')}>
            Back
          </Button>
        ) : null
      }
    >
      <UploadModalContent
        selectedOption={selectedOption}
        onFileSelect={handleFileSelection}
        onFileUploadSelect={() => setSelectedOption('upload')}
        onAIGenerateSelect={() => setSelectedOption('generate')}
        onGeneratedImage={handleGeneratedImage}
        onSetSelectedOption={setSelectedOption}
        accept={accept || '*/*'}
      />
    </NewModal>
  );

  function handleClose() {
    setSelectedOption('select');
    onHide();
  }

  function getModalTitle() {
    switch (selectedOption) {
      case 'upload':
        return 'Upload File';
      case 'generate':
        return 'Draw Images';
      default:
        return 'Upload';
    }
  }

  function handleFileSelection(file: File) {
    onFileSelect(file);
    handleClose();
  }

  function handleGeneratedImage(file: File) {
    onFileSelect(file);
    handleClose();
  }
}

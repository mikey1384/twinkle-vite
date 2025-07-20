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

  // Reset state when modal closes
  const handleClose = () => {
    setSelectedOption('select');
    onHide();
  };

  // Determine modal title based on selected option
  const getModalTitle = () => {
    switch (selectedOption) {
      case 'upload':
        return 'Upload File';
      case 'generate':
        return 'Generate Image with AI';
      default:
        return 'Upload';
    }
  };

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
          <Button transparent onClick={handleClose}>
            Cancel
          </Button>
        ) : selectedOption === 'generate' ? (
          <Button transparent onClick={() => setSelectedOption('select')}>
            Back
          </Button>
        ) : null
      }
    >
      <UploadModalContent
        selectedOption={selectedOption}
        onFileSelect={handleFileSelection}
        onFileUploadSelect={handleFileUploadSelect}
        onAIGenerateSelect={handleAIGenerateSelect}
        onGeneratedImage={handleGeneratedImage}
        onSetSelectedOption={setSelectedOption}
        accept={accept || 'image/*'}
      />
    </NewModal>
  );

  function handleFileUploadSelect() {
    // Create a temporary file input and trigger it immediately
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept || 'image/*';
    input.onchange = (event: any) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        handleFileSelection(files[0]);
      }
    };
    input.click();
  }

  function handleAIGenerateSelect() {
    setSelectedOption('generate');
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

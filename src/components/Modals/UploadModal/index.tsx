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
  const [isFilePickerActive, setIsFilePickerActive] = useState(false);

  return (
    <NewModal
      isOpen={isOpen}
      onClose={handleClose}
      title={getModalTitle()}
      size="lg"
      closeOnBackdropClick={selectedOption === 'select' && !isFilePickerActive}
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
        accept={accept || '*/*'}
      />
    </NewModal>
  );

  function handleFileUploadSelect() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept || '*/*';
    setIsFilePickerActive(true);
    input.onchange = function (event: any) {
      setIsFilePickerActive(false);
      const files = event.target.files;
      if (files && files.length > 0) {
        handleFileSelection(files[0]);
      }
    };
    input.click();
  }

  function handleClose() {
    setSelectedOption('select');
    onHide();
  }

  function getModalTitle() {
    switch (selectedOption) {
      case 'upload':
        return 'Upload File';
      case 'generate':
        return 'Generate Image with AI';
      default:
        return 'Upload';
    }
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

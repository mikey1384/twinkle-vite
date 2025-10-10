import React, { useRef, useState } from 'react';
import NewModal from '~/components/NewModal';
import Button from '~/components/Button';
import UploadModalContent from './Content';

const useThisImageButtonStyle = {
  padding: '1rem 3rem',
  fontSize: '1.1rem',
  fontWeight: 600,
  minWidth: 200,
  borderRadius: '12px',
  textTransform: 'none',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)'
};

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
  const [canUseGeneratedImage, setCanUseGeneratedImage] = useState(false);
  const useGeneratedImageHandlerRef = useRef<
    (() => void | Promise<void>) | null
  >(null);

  let footerContent: React.ReactNode = null;

  if (selectedOption === 'select') {
    footerContent = (
      <Button transparent onClick={handleClose}>
        Cancel
      </Button>
    );
  } else if (selectedOption === 'generate') {
    footerContent = (
      <>
        {canUseGeneratedImage && (
          <Button
            filled
            color="green"
            onClick={handleUseThisImageClick}
            style={useThisImageButtonStyle as React.CSSProperties}
            mobilePadding="1rem"
            mobileBorderRadius="12px"
          >
            Use This Image
          </Button>
        )}
        <Button transparent onClick={() => handleChangeOption('select')}>
          Back
        </Button>
      </>
    );
  } else if (selectedOption === 'upload') {
    footerContent = (
      <Button transparent onClick={() => handleChangeOption('select')}>
        Back
      </Button>
    );
  }

  return (
    <NewModal
      isOpen={isOpen}
      onClose={handleClose}
      title={getModalTitle()}
      size="lg"
      closeOnBackdropClick={selectedOption === 'select'}
      modalLevel={2}
      preventBodyScroll={false}
      footer={footerContent}
    >
      <UploadModalContent
        selectedOption={selectedOption}
        onFileSelect={handleFileSelection}
        onFileUploadSelect={() => handleChangeOption('upload')}
        onAIGenerateSelect={() => handleChangeOption('generate')}
        onGeneratedImage={handleGeneratedImage}
        onSetSelectedOption={handleChangeOption}
        onUseImageAvailabilityChange={setCanUseGeneratedImage}
        onRegisterUseImageHandler={handleRegisterUseImageHandler}
        accept={accept || '*/*'}
      />
    </NewModal>
  );

  function handleClose() {
    resetUseImageState();
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

  function handleRegisterUseImageHandler(
    handler: (() => void | Promise<void>) | null
  ) {
    useGeneratedImageHandlerRef.current = handler;
  }

  function handleUseThisImageClick() {
    useGeneratedImageHandlerRef.current?.();
  }

  function handleChangeOption(option: 'select' | 'upload' | 'generate') {
    resetUseImageState();
    setSelectedOption(option);
  }

  function resetUseImageState() {
    setCanUseGeneratedImage(false);
    useGeneratedImageHandlerRef.current = null;
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

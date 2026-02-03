import React, { useRef, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import ConfirmModal from '~/components/Modals/ConfirmModal';
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
  onFilesSelect?: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
}

export default function UploadModal({
  isOpen,
  onHide,
  onFileSelect,
  onFilesSelect,
  accept,
  multiple = false
}: UploadModalProps) {
  const [selectedOption, setSelectedOption] = useState<
    'select' | 'upload' | 'generate'
  >('select');
  const [canUseGeneratedImage, setCanUseGeneratedImage] = useState(false);
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const useGeneratedImageHandlerRef = useRef<
    (() => void | Promise<void>) | null
  >(null);

  let footerContent: React.ReactNode = null;

  if (selectedOption === 'select') {
    footerContent = (
      <Button variant="ghost" onClick={handleClose}>
        Cancel
      </Button>
    );
  } else if (selectedOption === 'generate') {
    footerContent = (
      <>
        {canUseGeneratedImage && (
          <Button
            variant="soft"
            tone="raised"
            color="green"
            onClick={handleUseThisImageClick}
            style={useThisImageButtonStyle as React.CSSProperties}
            mobilePadding="1rem"
            mobileBorderRadius="12px"
          >
            Use This Image
          </Button>
        )}
        <Button variant="ghost" onClick={handleBackFromGenerate}>
          Back
        </Button>
      </>
    );
  } else if (selectedOption === 'upload') {
    footerContent = (
      <Button variant="ghost" onClick={() => handleChangeOption('select')}>
        Back
      </Button>
    );
  }

  return (
    <>
      <Modal
        modalKey="UploadModal"
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
          onFilesSelect={handleFilesSelection}
          onFileUploadSelect={() => handleChangeOption('upload')}
          onAIGenerateSelect={() => handleChangeOption('generate')}
          onGeneratedImage={handleGeneratedImage}
          onSetSelectedOption={handleChangeOption}
          onUseImageAvailabilityChange={setCanUseGeneratedImage}
          onRegisterUseImageHandler={handleRegisterUseImageHandler}
          accept={accept || '*/*'}
          multiple={multiple}
        />
      </Modal>
      {confirmModalShown && (
        <ConfirmModal
          modalOverModal
          modalLevel={3}
          title="Discard Image?"
          description="You have an image ready to use. Are you sure you want to go back?"
          onHide={() => setConfirmModalShown(false)}
          onConfirm={() => {
            setConfirmModalShown(false);
            handleChangeOption('select');
          }}
        />
      )}
    </>
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
        return 'Make Images';
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

  function handleBackFromGenerate() {
    if (canUseGeneratedImage) {
      setConfirmModalShown(true);
    } else {
      handleChangeOption('select');
    }
  }

  function resetUseImageState() {
    setCanUseGeneratedImage(false);
    useGeneratedImageHandlerRef.current = null;
  }

  function handleFileSelection(file: File) {
    onFileSelect(file);
    handleClose();
  }

  function handleFilesSelection(files: File[]) {
    if (onFilesSelect) {
      onFilesSelect(files);
    } else if (files.length > 0) {
      onFileSelect(files[0]);
    }
    handleClose();
  }

  function handleGeneratedImage(file: File) {
    onFileSelect(file);
    handleClose();
  }
}

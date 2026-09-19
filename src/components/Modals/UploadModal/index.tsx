import React, { useEffect, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import ProgressBar from '~/components/ProgressBar';
import {
  convertVideoForUpload,
  needsVideoUploadConversion
} from '~/helpers/videoUploadConversion';
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
  allowMultipleGenericFileSelection?: boolean;
  imageGenerationPurpose?: 'buildThumbnail';
}

export default function UploadModal({
  isOpen,
  onHide,
  onFileSelect,
  onFilesSelect,
  accept,
  multiple = false,
  allowMultipleGenericFileSelection = false,
  imageGenerationPurpose
}: UploadModalProps) {
  const [selectedOption, setSelectedOption] = useState<
    'select' | 'upload' | 'generate'
  >('select');
  const [canUseGeneratedImage, setCanUseGeneratedImage] = useState(false);
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const useGeneratedImageHandlerRef = useRef<
    (() => void | Promise<void>) | null
  >(null);
  // A picked MKV is rewrapped as MP4 before the caller ever sees it, so the
  // name, type and bytes every caller stores are already the playable ones.
  const [conversion, setConversion] = useState<{
    fileName: string;
    progress: number;
  } | null>(null);
  const conversionSessionRef = useRef<{
    controller: AbortController | null;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) setConversion(null);
    return () => {
      const session = conversionSessionRef.current;
      conversionSessionRef.current = null;
      session?.controller?.abort();
    };
  }, [isOpen]);

  let footerContent: React.ReactNode = null;

  if (conversion) {
    footerContent = (
      <Button variant="ghost" onClick={handleSkipConversion}>
        Upload the original instead
      </Button>
    );
  } else if (selectedOption === 'select') {
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
        closeOnBackdropClick={selectedOption === 'select' && !conversion}
        modalLevel={2}
        preventBodyScroll={false}
        footer={footerContent}
      >
        {conversion ? (
          <div
            style={{
              width: '100%',
              padding: '2rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <div style={{ fontSize: '1.7rem', fontWeight: 700 }}>
              Making this video play on phones
            </div>
            <div style={{ fontSize: '1.4rem', lineHeight: 1.5 }}>
              {conversion.fileName} is an MKV file, which iPhones and iPads
              cannot play. It is being saved as MP4 on your device first, then
              it uploads as usual.
            </div>
            <ProgressBar progress={Math.round(conversion.progress * 100)} />
          </div>
        ) : (
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
            allowMultipleGenericFileSelection={allowMultipleGenericFileSelection}
            imageGenerationPurpose={imageGenerationPurpose}
          />
        )}
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
    // Closing mid-conversion means "never mind": nothing is handed on.
    const session = conversionSessionRef.current;
    conversionSessionRef.current = null;
    session?.controller?.abort();
    setConversion(null);
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

  async function handleFileSelection(file: File) {
    const [prepared] = (await prepareFilesForUpload([file])) || [];
    if (!prepared) return;
    onFileSelect(prepared);
    handleClose();
  }

  async function handleFilesSelection(files: File[]) {
    const prepared = await prepareFilesForUpload(files);
    if (!prepared) return;
    if (onFilesSelect) {
      onFilesSelect(prepared);
    } else if (prepared.length > 0) {
      onFileSelect(prepared[0]);
    }
    handleClose();
  }

  // Resolves to null when the modal was closed while converting.
  async function prepareFilesForUpload(files: File[]) {
    const previous = conversionSessionRef.current;
    conversionSessionRef.current = null;
    previous?.controller?.abort();
    if (!files.some(needsVideoUploadConversion)) return files;
    const session: { controller: AbortController | null } = { controller: null };
    conversionSessionRef.current = session;
    const prepared: File[] = [];
    try {
      for (const file of files) {
        if (!needsVideoUploadConversion(file)) {
          prepared.push(file);
          continue;
        }
        const controller = new AbortController();
        session.controller = controller;
        setConversion({ fileName: file.name, progress: 0 });
        const result = await convertVideoForUpload({
          file,
          signal: controller.signal,
          onProgress: (progress) => {
            if (conversionSessionRef.current === session) {
              setConversion({ fileName: file.name, progress });
            }
          }
        });
        if (conversionSessionRef.current !== session) return null;
        prepared.push(result.file);
      }
      return prepared;
    } finally {
      if (conversionSessionRef.current === session) {
        conversionSessionRef.current = null;
        setConversion(null);
      }
    }
  }

  // The original still uploads; it just will not play on every device.
  function handleSkipConversion() {
    conversionSessionRef.current?.controller?.abort();
  }

  function handleGeneratedImage(file: File) {
    onFileSelect(file);
    handleClose();
  }
}

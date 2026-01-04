import React, { useRef, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import FileUploadOption from '../UploadModal/FileUploadOption';
import ImageEditModal from '../ImageModal/ImageEditModal';
import { MAX_PROFILE_PIC_SIZE } from '~/constants/defaultValues';
import AlertModal from '~/components/Modals/AlertModal';

type ScreenType = 'select' | 'upload' | 'edit';

export default function ProfilePicModal({
  currentPicUrl,
  onHide,
  onSelectImage
}: {
  currentPicUrl?: string;
  onHide: () => void;
  onSelectImage: (imageUri: string) => void;
}) {
  const [screen, setScreen] = useState<ScreenType>('select');
  const [alertModalShown, setAlertModalShown] = useState(false);
  const [canUseEditedImage, setCanUseEditedImage] = useState(false);
  const useEditedImageHandlerRef = useRef<(() => void | Promise<void>) | null>(
    null
  );

  function handleClose() {
    setScreen('select');
    onHide();
  }

  function handleFileSelect(file: File) {
    if (file.size / 1000 > MAX_PROFILE_PIC_SIZE) {
      setAlertModalShown(true);
      return;
    }
    const reader = new FileReader();
    reader.onload = (upload: any) => {
      onSelectImage(upload.target.result);
      handleClose();
    };
    reader.readAsDataURL(file);
  }

  function handleEditedImageConfirm(imageDataUrl: string) {
    onSelectImage(imageDataUrl);
    handleClose();
  }

  function handleRegisterUseImageHandler(
    handler: (() => void | Promise<void>) | null
  ) {
    useEditedImageHandlerRef.current = handler;
  }

  function handleUseThisImageClick() {
    useEditedImageHandlerRef.current?.();
  }

  let footerContent: React.ReactNode = null;
  let modalTitle = 'Change Profile Picture';

  if (screen === 'select') {
    footerContent = (
      <Button variant="ghost" onClick={handleClose}>
        Cancel
      </Button>
    );
  } else if (screen === 'upload') {
    modalTitle = 'Upload Picture';
    footerContent = (
      <Button variant="ghost" onClick={() => setScreen('select')}>
        Back
      </Button>
    );
  } else if (screen === 'edit') {
    modalTitle = 'Edit Picture';
    footerContent = (
      <>
        {canUseEditedImage && (
          <Button
            variant="soft"
            tone="raised"
            color="green"
            onClick={handleUseThisImageClick}
            style={{
              padding: '1rem 3rem',
              fontSize: '1.1rem',
              fontWeight: 600,
              minWidth: 200,
              borderRadius: '12px'
            }}
          >
            Use This Image
          </Button>
        )}
        <Button variant="ghost" onClick={() => setScreen('select')}>
          Back
        </Button>
      </>
    );
  }

  return (
    <>
      <Modal
        isOpen
        onClose={handleClose}
        title={modalTitle}
        size="lg"
        closeOnBackdropClick={screen === 'select'}
        footer={footerContent}
      >
        {screen === 'select' && (
          <SelectionScreen
            hasCurrentPic={!!currentPicUrl}
            onUploadSelect={() => setScreen('upload')}
            onEditSelect={() => setScreen('edit')}
          />
        )}
        {screen === 'upload' && (
          <FileUploadOption onFileSelect={handleFileSelect} accept="image/*" />
        )}
        {screen === 'edit' && currentPicUrl && (
          <ImageEditModal
            imageUrl={currentPicUrl}
            onClose={() => setScreen('select')}
            embedded
            onConfirm={handleEditedImageConfirm}
            onUseImageAvailabilityChange={setCanUseEditedImage}
            onRegisterUseImageHandler={handleRegisterUseImageHandler}
          />
        )}
      </Modal>
      {alertModalShown && (
        <AlertModal
          title="Image is too large (limit: 10mb)"
          content="Please select a smaller image"
          onHide={() => setAlertModalShown(false)}
        />
      )}
    </>
  );
}

function SelectionScreen({
  hasCurrentPic,
  onUploadSelect,
  onEditSelect
}: {
  hasCurrentPic: boolean;
  onUploadSelect: () => void;
  onEditSelect: () => void;
}) {
  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: hasCurrentPic
            ? 'repeat(auto-fit, minmax(250px, 1fr))'
            : '1fr',
          gap: '1.5rem',
          maxWidth: hasCurrentPic ? '600px' : '300px',
          margin: '0 auto'
        }}
      >
        <Button
          variant="soft"
          tone="raised"
          color="logoBlue"
          onClick={onUploadSelect}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '2rem 1.5rem',
            minHeight: '180px',
            borderRadius: '12px',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              padding: '1rem',
              marginBottom: '1rem'
            }}
          >
            <Icon icon="upload" size="2x" />
          </div>
          <div
            style={{
              fontSize: '1.3rem',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}
          >
            Upload from Device
          </div>
          <div
            style={{
              fontSize: '0.9rem',
              opacity: 0.9,
              textAlign: 'center',
              lineHeight: '1.4'
            }}
          >
            Choose a photo from your computer or mobile device
          </div>
        </Button>

        {hasCurrentPic && (
          <Button
            variant="soft"
            tone="raised"
            color="pink"
            onClick={onEditSelect}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '2rem 1.5rem',
              minHeight: '180px',
              borderRadius: '12px',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
          >
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                padding: '1rem',
                marginBottom: '1rem'
              }}
            >
              <Icon icon="wand-magic-sparkles" size="2x" />
            </div>
            <div
              style={{
                fontSize: '1.3rem',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}
            >
              Edit Current Picture
            </div>
            <div
              style={{
                fontSize: '0.9rem',
                opacity: 0.9,
                textAlign: 'center',
                lineHeight: '1.4'
              }}
            >
              Modify your current profile picture with drawing tools or AI
            </div>
          </Button>
        )}
      </div>
    </div>
  );
}

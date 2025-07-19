import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import AlertModal from '~/components/Modals/AlertModal';
import ErrorBoundary from '~/components/ErrorBoundary';
import ImageEditModal from '~/components/Modals/ImageEditModal';
import { useAppContext } from '~/contexts';
import { isMobile } from '~/helpers';
import { Color } from '~/constants/css';
import { MAX_PROFILE_PIC_SIZE } from '~/constants/defaultValues';
import UploadButton from '~/components/Buttons/UploadButton';

StartScreen.propTypes = {
  navigateTo: PropTypes.func.isRequired,
  onHide: PropTypes.func.isRequired,
  profileId: PropTypes.number.isRequired
};

const deviceIsMobile = isMobile(navigator);

export default function StartScreen({
  navigateTo,
  onHide,
  profileId
}: {
  navigateTo: (arg0: any) => any;
  onHide: () => any;
  profileId: number;
}) {
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const [alertModalShown, setAlertModalShown] = useState(false);
  const [imageEditModalShown, setImageEditModalShown] = useState(false);
  const [imageUri, setImageUri] = useState(null);

  return (
    <ErrorBoundary
      componentPath="Profile/Body/Home/Pictures/AddPictureModal/StartScreen/index"
      style={{ display: 'flex', width: '100%' }}
    >
      <div
        style={{
          width: '50%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <div
          style={{
            fontWeight: 'bold',
            fontSize: '2rem',
            color: Color.black()
          }}
        >
          from Your {deviceIsMobile ? 'Device' : 'Computer'}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '1.5rem'
          }}
        >
          <UploadButton
            icon="upload"
            accept="image/*"
            color="blue"
            style={{ fontSize: '3.5rem', padding: '1.5rem' }}
            onFileSelect={handlePicture}
          />
        </div>
      </div>
      <div
        style={{
          width: '50%',
          flexDirection: 'column',
          alignItems: 'center',
          display: 'flex',
          marginLeft: '1rem'
        }}
      >
        <div
          style={{
            fontWeight: 'bold',
            fontSize: '2rem',
            color: Color.black()
          }}
        >
          from Archive
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '1.5rem'
          }}
        >
          <Button
            skeuomorphic
            style={{ fontSize: '3.5rem', padding: '1.5rem' }}
            color="pink"
            onClick={() => navigateTo('archive')}
          >
            <Icon icon="image" />
          </Button>
        </div>
      </div>
      {alertModalShown && (
        <AlertModal
          title="Image is too large (limit: 10mb)"
          content="Please select a smaller image"
          onHide={() => setAlertModalShown(false)}
        />
      )}
      {imageEditModalShown && (
        <ImageEditModal
          hasDescription
          modalOverModal
          aspectFixed={false}
          imageUri={imageUri}
          onEditDone={handleImageEditDone}
          onHide={() => {
            setImageUri(null);
            setImageEditModalShown(false);
          }}
        />
      )}
    </ErrorBoundary>
  );

  function handleImageEditDone({ pictures }: { pictures?: any[] }) {
    if (pictures) {
      onSetUserState({
        userId: profileId,
        newState: { pictures }
      });
    }
    onHide();
  }

  function handlePicture(file: File) {
    const reader = new FileReader();
    if (file.size / 1000 > MAX_PROFILE_PIC_SIZE) {
      return setAlertModalShown(true);
    }
    reader.onload = (upload: any) => {
      setImageEditModalShown(true);
      setImageUri(upload.target.result);
    };
    reader.readAsDataURL(file);
  }
}

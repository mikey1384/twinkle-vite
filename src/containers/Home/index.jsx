import React, { memo, useState } from 'react';
import PropTypes from 'prop-types';
import ImageEditModal from '~/components/Modals/ImageEditModal';
import AlertModal from '~/components/Modals/AlertModal';
import ErrorBoundary from '~/components/ErrorBoundary';
import ProfileWidget from '~/components/ProfileWidget';
import HomeMenuItems from '~/components/HomeMenuItems';
import Notification from '~/components/Notification';
import People from './People';
import Earn from './Earn';
import Store from './Store';
import Stories from './Stories';
import LocalContext from './Context';
import { useAppContext, useKeyContext } from '~/contexts';
import { container, Left, Center, Right } from './Styles';

Home.propTypes = {
  onFileUpload: PropTypes.func,
  section: PropTypes.string
};

function Home({ onFileUpload, section }) {
  const { userId } = useKeyContext((v) => v.myState);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const [alertModalShown, setAlertModalShown] = useState(false);
  const [imageEditModalShown, setImageEditModalShown] = useState(false);
  const [imageUri, setImageUri] = useState(null);

  return (
    <ErrorBoundary componentPath="Home/index">
      <LocalContext.Provider
        value={{
          onFileUpload
        }}
      >
        <div className={container}>
          <div className={Left}>
            <ProfileWidget
              onShowAlert={() => setAlertModalShown(true)}
              onLoadImage={(upload) => {
                setImageEditModalShown(true);
                setImageUri(upload.target.result);
              }}
            />
            <HomeMenuItems style={{ marginTop: '1rem' }} />
          </div>
          <div className={Center}>
            <div style={{ maxWidth: '700px', width: '100%' }}>
              {section === 'people' && <People />}
              {section === 'earn' && <Earn />}
              {section === 'store' && <Store />}
              {section === 'story' && <Stories />}
            </div>
          </div>
          <Notification trackScrollPosition className={Right} location="home" />
          {imageEditModalShown && (
            <ImageEditModal
              isProfilePic
              imageUri={imageUri}
              onEditDone={handleImageEditDone}
              onHide={() => {
                setImageUri(null);
                setImageEditModalShown(false);
              }}
            />
          )}
          {alertModalShown && (
            <AlertModal
              title="Image is too large (limit: 10mb)"
              content="Please select a smaller image"
              onHide={() => setAlertModalShown(false)}
            />
          )}
        </div>
      </LocalContext.Provider>
    </ErrorBoundary>
  );

  function handleImageEditDone({ filePath }) {
    onSetUserState({
      userId,
      newState: { profilePicUrl: `/profile/${filePath}` }
    });
    setImageEditModalShown(false);
  }
}

export default memo(Home);

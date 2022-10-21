import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import HomeMenuItems from '~/components/HomeMenuItems';
import ProfileWidget from '~/components/ProfileWidget';
import Notification from '~/components/Notification';
import AlertModal from '~/components/Modals/AlertModal';
import ImageEditModal from '~/components/Modals/ImageEditModal';
import Icon from '~/components/Icon';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useLocation } from 'react-router-dom';
import { useSpring, animated } from 'react-spring';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';

MobileMenu.propTypes = {
  onClose: PropTypes.func.isRequired
};

export default function MobileMenu({ onClose }) {
  const location = useLocation();
  const styles = useSpring({
    to: { marginLeft: '0' },
    from: { marginLeft: '-100%' }
  });
  const displayedRef = useRef(false);
  const onLogout = useAppContext((v) => v.user.actions.onLogout);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onResetChat = useChatContext((v) => v.actions.onResetChat);
  const { username, userId } = useKeyContext((v) => v.myState);
  const [alertModalShown, setAlertModalShown] = useState(false);
  const [imageEditStatus, setImageEditStatus] = useState({
    imageEditModalShown: false,
    imageUri: null
  });
  const { imageEditModalShown, imageUri } = imageEditStatus;

  useEffect(() => {
    if (displayedRef.current) {
      onClose();
    }
    displayedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  return (
    <ErrorBoundary
      componentPath="App/MobileMenu"
      className={`mobile ${css`
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        position: fixed;
        z-index: 999999;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
      `}`}
    >
      <animated.div
        style={styles}
        className={`momentum-scroll-enabled ${css`
          height: 100%;
          width: 70%;
          position: relative;
          background: ${Color.whiteGray()};
          overflow-y: scroll;
        `}`}
      >
        <ProfileWidget
          onShowAlert={() => setAlertModalShown(true)}
          onLoadImage={(upload) =>
            setImageEditStatus({
              ...imageEditStatus,
              imageEditModalShown: true,
              imageUri: upload.target.result
            })
          }
        />
        <HomeMenuItems style={{ marginTop: '1rem' }} />
        <Notification location="home" />
        {username && (
          <div
            className={css`
              font-weight: bold;
              border-top: 1px solid ${Color.borderGray()};
              background: #fff;
              width: 100%;
              text-align: center;
              color: ${Color.cranberry()};
              font-size: 2rem;
              padding: 1rem;
              margin-top: 1rem;
            `}
            onClick={handleLogout}
          >
            <Icon icon="right-from-bracket" />
            <span style={{ marginLeft: '0.7rem' }}>Log out</span>
          </div>
        )}
      </animated.div>
      <div style={{ width: '30%', position: 'relative' }} onClick={onClose}>
        <Icon
          icon="times"
          style={{
            color: '#fff',
            position: 'absolute',
            top: '2rem',
            right: '2rem',
            fontSize: '4rem',
            opacity: '0.8'
          }}
        />
      </div>
      {imageEditModalShown && (
        <ImageEditModal
          isProfilePic
          imageUri={imageUri}
          onEditDone={handleImageEditDone}
          onHide={() =>
            setImageEditStatus({
              imageUri: null,
              imageEditModalShown: false
            })
          }
        />
      )}
      {alertModalShown && (
        <AlertModal
          title="Image is too large (limit: 10mb)"
          content="Please select a smaller image"
          onHide={() => setAlertModalShown(false)}
        />
      )}
    </ErrorBoundary>
  );

  function handleImageEditDone({ filePath }) {
    onSetUserState({
      userId,
      newState: { profilePicUrl: `/profile/${filePath}` }
    });
    setImageEditStatus({
      imageUri: null,
      imageEditModalShown: false
    });
  }

  function handleLogout() {
    onLogout();
    onSetUserState({ userId, newState: { online: false } });
    onResetChat();
  }
}

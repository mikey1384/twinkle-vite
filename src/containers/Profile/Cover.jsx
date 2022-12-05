import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import ProfilePic from '~/components/ProfilePic';
import ColorSelector from '~/components/ColorSelector';
import Button from '~/components/Button';
import AlertModal from '~/components/Modals/AlertModal';
import ImageModal from '~/components/Modals/ImageModal';
import ImageEditModal from '~/components/Modals/ImageEditModal';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { cloudFrontURL, MAX_PROFILE_PIC_SIZE } from '~/constants/defaultValues';
import { useTheme } from '~/helpers/hooks';
import { useAppContext, useKeyContext, useChatContext } from '~/contexts';
import { isMobile } from '~/helpers';
import localize from '~/constants/localize';

const deviceIsMobile = isMobile(navigator);
const changeThemeMobileLabel = localize('changeThemeMobile');
const changeThemeLabel = localize('changeTheme2');

Cover.propTypes = {
  onSelectTheme: PropTypes.func.isRequired,
  onSetTheme: PropTypes.func.isRequired,
  profile: PropTypes.object.isRequired,
  selectedTheme: PropTypes.string
};

export default function Cover({
  onSelectTheme,
  onSetTheme,
  profile,
  selectedTheme
}) {
  const chatStatus = useChatContext((v) => v.state.chatStatus);
  const checkIfUserOnline = useAppContext(
    (v) => v.requestHelpers.checkIfUserOnline
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const { userId } = useKeyContext((v) => v.myState);
  const {
    id,
    profilePicUrl,
    profileTheme,
    realName,
    twinkleXP,
    username,
    userType
  } = profile;
  const [alertModalShown, setAlertModalShown] = useState(false);
  const [colorSelectorShown, setColorSelectorShown] = useState(false);
  const [imageModalShown, setImageModalShown] = useState(false);
  const [imageEditModalShown, setImageEditModalShown] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const FileInputRef = useRef(null);

  useEffect(() => {
    onSelectTheme(profileTheme || 'logoBlue');
    if (id !== userId) {
      handleCheckIfUserOnline();
    }
    async function handleCheckIfUserOnline() {
      const online = await checkIfUserOnline(id);
      onSetUserState({ userId: id, newState: { online } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    cover: { color: coverColor },
    coverText: { color: coverTextColor, shadow: coverTextShadowColor },
    done: { color: doneColor }
  } = useTheme(selectedTheme || profileTheme || 'logoBlue');

  return (
    <ErrorBoundary componentPath="Profile/Cover">
      <div
        style={{
          color: Color[coverTextColor](),
          backgroundRepeat: 'no-repeat',
          backgroundSize: '100% 100%',
          backgroundColor: Color[coverColor]()
        }}
        className={css`
          height: 26rem;
          margin-top: -1rem;
          display: flex;
          justify-content: space-between;
          width: 100%;
          position: relative;
          @media (max-width: ${mobileMaxWidth}) {
            height: 12rem;
          }
        `}
      >
        <div
          className={css`
            margin-left: 29rem;
            font-size: 5rem;
            padding-top: 15rem;
            font-weight: bold;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            ${coverTextShadowColor
              ? `text-shadow: 2px 2px ${Color[coverTextShadowColor]()};`
              : ''}
            > p {
              font-size: 2rem;
              line-height: 1rem;
            }
            @media (max-width: ${mobileMaxWidth}) {
              margin-left: 15rem;
              padding-top: 6rem;
              font-size: 2.5rem;
              ${coverTextShadowColor
                ? `text-shadow: 1px 1px ${Color[coverTextShadowColor]()};`
                : ''}
              > p {
                font-size: 1.3rem;
              }
            }
          `}
        >
          {username}
          {userType ? (
            <>
              {' '}
              <span
                className={css`
                  font-size: 2.5rem;
                  @media (max-width: ${mobileMaxWidth}) {
                    font-size: 1.5rem;
                  }
                `}
              >
                {`[${userType.includes('teacher') ? 'teacher' : userType}]`}
              </span>
            </>
          ) : (
            ''
          )}
          <p>({realName})</p>
        </div>
        {profile.id === userId && (
          <div
            className={css`
              @media (max-width: ${mobileMaxWidth}) {
                button {
                  font-size: 1.3rem;
                }
              }
            `}
            style={{
              background: colorSelectorShown && '#fff',
              borderRadius,
              position: 'absolute',
              padding: '1rem',
              bottom: '1rem',
              right: '1rem'
            }}
          >
            {!colorSelectorShown && (
              <Button
                style={{ marginBottom: '-1rem', marginRight: '-1rem' }}
                default
                filled
                onClick={() => setColorSelectorShown(true)}
              >
                {deviceIsMobile ? changeThemeMobileLabel : changeThemeLabel}
              </Button>
            )}
            {colorSelectorShown && (
              <>
                <ColorSelector
                  colors={[
                    'logoBlue',
                    'green',
                    'orange',
                    'gold',
                    'red',
                    'rose',
                    'pink',
                    'purple',
                    'darkBlue',
                    'black',
                    'vantaBlack'
                  ]}
                  twinkleXP={twinkleXP || 0}
                  setColor={onSelectTheme}
                  selectedColor={selectedTheme || profileTheme || 'logoBlue'}
                  style={{
                    width: '100%',
                    height: 'auto',
                    justifyContent: 'center'
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    marginTop: '1rem',
                    justifyContent: 'flex-end'
                  }}
                >
                  <Button
                    style={{ fontSize: '1.2rem', marginRight: '1rem' }}
                    skeuomorphic
                    color="darkerGray"
                    onClick={handleColorSelectCancel}
                  >
                    Cancel
                  </Button>
                  <Button
                    style={{ fontSize: '1.2rem' }}
                    color={doneColor}
                    filled
                    onClick={handleSetTheme}
                  >
                    Change
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
        <input
          ref={FileInputRef}
          style={{ display: 'none' }}
          type="file"
          onChange={handlePicture}
          accept="image/*"
        />
      </div>
      <div
        className={css`
          position: absolute;
          top: 7rem;
          left: 3rem;
          @media (max-width: ${mobileMaxWidth}) {
            left: 1rem;
            top: 5rem;
          }
        `}
      >
        <ProfilePic
          isProfilePage
          className={css`
            width: 22rem;
            font-size: 2rem;
            z-index: 10;
            @media (max-width: ${mobileMaxWidth}) {
              width: 10rem;
              height: 10rem;
            }
          `}
          userId={profile.id}
          onClick={
            userId === profile.id
              ? () => FileInputRef.current.click()
              : profilePicUrl
              ? () => setImageModalShown(true)
              : null
          }
          profilePicUrl={profilePicUrl}
          online={
            chatStatus[profile.id]?.isAway ||
            chatStatus[profile.id]?.isOnline ||
            chatStatus[profile.id]?.isBusy
          }
          large
          statusShown
        />
      </div>
      {imageModalShown && (
        <ImageModal
          downloadable={false}
          src={`${cloudFrontURL}${profilePicUrl}`}
          onHide={() => setImageModalShown(false)}
        />
      )}
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
    </ErrorBoundary>
  );

  function handleColorSelectCancel() {
    onSelectTheme(profileTheme || 'logoBlue');
    setColorSelectorShown(false);
  }

  function handleImageEditDone({ filePath }) {
    onSetUserState({
      userId,
      newState: { profilePicUrl: `/profile/${filePath}` }
    });
    setImageEditModalShown(false);
  }

  async function handleSetTheme() {
    setColorSelectorShown(false);
    onSetTheme();
  }

  function handlePicture(event) {
    const reader = new FileReader();
    const file = event.target.files[0];
    if (file.size / 1000 > MAX_PROFILE_PIC_SIZE) {
      return setAlertModalShown(true);
    }
    reader.onload = (upload) => {
      setImageEditModalShown(true);
      setImageUri(upload.target.result);
    };

    reader.readAsDataURL(file);
    event.target.value = null;
  }
}

import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import ProfilePic from '~/components/ProfilePic';
import ColorSelector from '~/components/ColorSelector';
import Button from '~/components/Button';
import AlertModal from '~/components/Modals/AlertModal';
import ImageModal from '~/components/Modals/ImageModal';
import ImageEditModal from '~/components/Modals/ImageEditModal';
import ErrorBoundary from '~/components/ErrorBoundary';
import UserTitle from '~/components/Texts/UserTitle';
import AchievementBadges from '~/components/AchievementBadges';
import UsernameHistoryModal from '~/components/Modals/UsernameHistoryModal';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { cloudFrontURL, MAX_PROFILE_PIC_SIZE } from '~/constants/defaultValues';
import { returnTheme, isMobile } from '~/helpers';
import { useAppContext, useKeyContext, useChatContext } from '~/contexts';
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
}: {
  onSelectTheme: (theme: string) => void;
  onSetTheme: () => void;
  profile: any;
  selectedTheme: string;
}) {
  const chatStatus = useChatContext((v) => v.state.chatStatus);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const { userId } = useKeyContext((v) => v.myState);
  const {
    profilePicUrl,
    profileTheme,
    realName,
    twinkleXP,
    unlockedAchievementIds,
    username
  } = profile;
  const [alertModalShown, setAlertModalShown] = useState(false);
  const [usernameHistoryShown, setUsernameHistoryShown] = useState(false);
  const [colorSelectorShown, setColorSelectorShown] = useState(false);
  const [imageModalShown, setImageModalShown] = useState(false);
  const [imageEditModalShown, setImageEditModalShown] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const FileInputRef: React.RefObject<any> = useRef(null);

  useEffect(() => {
    onSelectTheme(profileTheme || 'logoBlue');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    cover: { color: coverColor },
    coverText: { color: coverTextColor, shadow: coverTextShadowColor },
    done: { color: doneColor }
  } = useMemo(
    () => returnTheme(selectedTheme || profileTheme || 'logoBlue'),
    [profileTheme, selectedTheme]
  );

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
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            margin-left: 29rem;
            font-weight: bold;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            ${coverTextShadowColor
              ? `text-shadow: 2px 2px ${Color[coverTextShadowColor]()};`
              : ''}
            @media (max-width: ${mobileMaxWidth}) {
              margin-left: 15rem;
              ${coverTextShadowColor
                ? `text-shadow: 1px 1px ${Color[coverTextShadowColor]()};`
                : ''}
            }
          `}
        >
          <div
            style={{
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'flex-start'
            }}
          >
            <AchievementBadges
              thumbSize="3rem"
              unlockedAchievementIds={unlockedAchievementIds}
            />
          </div>
          <div
            className={css`
              font-size: 5rem;
              line-height: 1;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: ${username?.length < 13 ? '2.5rem' : '1.8rem'};
              }
            `}
          >
            <span
              className={css`
                cursor: ${profile.hasUsernameChanged ? 'pointer' : 'default'};
                &:hover {
                  text-decoration: ${profile.hasUsernameChanged
                    ? 'underline'
                    : 'none'};
                }
              `}
              onClick={() =>
                profile.hasUsernameChanged && setUsernameHistoryShown(true)
              }
            >
              {username}
            </span>{' '}
            <UserTitle
              user={profile}
              className={`unselectable ${css`
                display: inline;
                font-size: 2rem;
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1.2rem;
                }
              `}`}
            />
          </div>
          <div
            className={css`
              margin-bottom: 0.5rem;
              margin-top: 0.5rem;
              font-size: 1.7rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.1rem;
              }
            `}
          >
            ({realName})
          </div>
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
              background: colorSelectorShown ? '#fff' : '',
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
              : undefined
          }
          profilePicUrl={profilePicUrl}
          online={chatStatus[profile.id]?.isOnline}
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
      {usernameHistoryShown && (
        <UsernameHistoryModal
          userId={profile.id}
          onHide={() => setUsernameHistoryShown(false)}
        />
      )}
    </ErrorBoundary>
  );

  function handleColorSelectCancel() {
    onSelectTheme(profileTheme || 'logoBlue');
    setColorSelectorShown(false);
  }

  function handleImageEditDone({ filePath }: { filePath?: string }) {
    if (filePath) {
      onSetUserState({
        userId,
        newState: { profilePicUrl: `/profile/${filePath}` }
      });
    }
    setImageEditModalShown(false);
  }

  async function handleSetTheme() {
    setColorSelectorShown(false);
    onSetTheme();
  }

  function handlePicture(event: any) {
    const reader = new FileReader();
    const file = event.target.files[0];
    if (file.size / 1000 > MAX_PROFILE_PIC_SIZE) {
      return setAlertModalShown(true);
    }
    reader.onload = (upload: any) => {
      setImageEditModalShown(true);
      setImageUri(upload.target.result);
    };

    reader.readAsDataURL(file);
    event.target.value = null;
  }
}

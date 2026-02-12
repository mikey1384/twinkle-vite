import React, { useEffect, useRef, useState } from 'react';
import ProfilePic from '~/components/ProfilePic';
import ColorSelector from '~/components/ColorSelector';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import AlertModal from '~/components/Modals/AlertModal';
import ImageModal from '~/components/Modals/ImageModal';
import ImageEditModal from '~/components/Modals/ImageEditModal';
import ProfilePicModal from '~/components/Modals/ProfilePicModal';
import ErrorBoundary from '~/components/ErrorBoundary';
import UserTitle from '~/components/Texts/UserTitle';
import AchievementBadges from '~/components/AchievementBadges';
import UsernameHistoryModal from '~/components/Modals/UsernameHistoryModal';
import BuildWallpaper from './BuildWallpaper';
import WallpaperPickerModal from './WallpaperPickerModal';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { cloudFrontURL, MAX_PROFILE_PIC_SIZE } from '~/constants/defaultValues';
import { isMobile } from '~/helpers';
import { useAppContext, useKeyContext, useChatContext } from '~/contexts';
import ScopedTheme from '~/theme/ScopedTheme';
import { useThemeTokens } from '~/theme/useThemeTokens';

const deviceIsMobile = isMobile(navigator);
const changeThemeMobileLabel = 'Theme';
const changeThemeLabel = 'Change Theme';

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
  const setFeaturedBuild = useAppContext(
    (v) => v.requestHelpers.setFeaturedBuild
  );
  const userId = useKeyContext((v) => v.myState.userId);
  const {
    featuredBuildId,
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
  const [profilePicModalShown, setProfilePicModalShown] = useState(false);
  const [wallpaperPickerShown, setWallpaperPickerShown] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const FileInputRef: React.RefObject<any> = useRef(null);

  useEffect(() => {
    onSelectTheme(profileTheme || 'logoBlue');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const coverStatusSize = 'medium';

  const { themeName, themeRoles } = useThemeTokens({
    themeName: selectedTheme || profileTheme
  });

  const resolveColor = (name?: string, fallback?: string) => {
    const target = name ?? fallback;
    if (!target) return undefined;
    const fn = Color[target as keyof typeof Color];
    return fn ? fn() : target;
  };

  const coverBackground =
    resolveColor(themeRoles.cover?.color, themeName) || Color.logoBlue();
  const coverTextColor =
    resolveColor(themeRoles.coverText?.color, 'white') || '#fff';
  const coverTextShadowColor = resolveColor(themeRoles.coverText?.shadow, '');
  const doneButtonColor = themeRoles.done?.color || 'blue';

  const coverBackgroundVar = `var(--role-cover-color, ${coverBackground})`;
  const coverTextColorVar = `var(--role-coverText-color, ${coverTextColor})`;
  const coverTextShadowVar = coverTextShadowColor
    ? `var(--role-coverText-shadow, ${coverTextShadowColor})`
    : 'var(--role-coverText-shadow, transparent)';
  const coverShadowLarge = coverTextShadowColor
    ? `2px 2px ${coverTextShadowVar}`
    : 'none';
  const coverShadowSmall = coverTextShadowColor
    ? `1px 1px ${coverTextShadowVar}`
    : 'none';

  return (
    <ErrorBoundary componentPath="Profile/Cover">
      <ScopedTheme
        theme={themeName as any}
        roles={['cover', 'coverText', 'done']}
      >
        <div
          style={{
            color: coverTextColorVar,
            backgroundRepeat: 'no-repeat',
            backgroundSize: '100% 100%',
            backgroundColor: coverBackgroundVar
          }}
          className={css`
            height: 26rem;
            margin-top: -1rem;
            display: flex;
            justify-content: space-between;
            width: 100%;
            position: relative;
            overflow: hidden;
            @media (max-width: ${mobileMaxWidth}) {
              height: 12rem;
            }
          `}
        >
          {!deviceIsMobile && featuredBuildId && (
            <BuildWallpaper buildId={featuredBuildId} />
          )}
          {!deviceIsMobile && featuredBuildId && (
            <div
              className={css`
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 3;
                pointer-events: none;
                background: linear-gradient(
                  to bottom,
                  rgba(0, 0, 0, 0) 40%,
                  rgba(0, 0, 0, 0.35) 100%
                );
              `}
            />
          )}
          <div
            style={{ position: 'relative', zIndex: 5 }}
            className={css`
              display: flex;
              flex-direction: column;
              justify-content: flex-end;
              margin-left: 29rem;
              font-weight: bold;
              overflow: hidden;
              white-space: nowrap;
              text-overflow: ellipsis;
              text-shadow: ${coverShadowLarge};
              @media (max-width: ${mobileMaxWidth}) {
                margin-left: 15rem;
                text-shadow: ${coverShadowSmall};
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
                right: '1rem',
                zIndex: 15
              }}
            >
              {!colorSelectorShown && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {!deviceIsMobile && (
                    <Button
                      style={{ marginBottom: '-1rem' }}
                      variant="solid"
                      tone="raised"
                      onClick={() => setWallpaperPickerShown(true)}
                    >
                      <Icon icon="image" style={{ marginRight: '0.5rem' }} />
                      Wallpaper
                    </Button>
                  )}
                  <Button
                    style={{
                      marginBottom: '-1rem',
                      marginRight: '-1rem'
                    }}
                    variant="solid"
                    tone="raised"
                    onClick={() => setColorSelectorShown(true)}
                  >
                    {deviceIsMobile
                      ? changeThemeMobileLabel
                      : changeThemeLabel}
                  </Button>
                </div>
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
                    selectedColor={themeName}
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
                      variant="solid"
                      tone="raised"
                      color="darkerGray"
                      onClick={handleColorSelectCancel}
                    >
                      Cancel
                    </Button>
                    <Button
                      style={{ fontSize: '1.2rem' }}
                      color={doneButtonColor}
                      variant="soft"
                      tone="raised"
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
              --profile-pic-size: 22rem;
              font-size: 2rem;
              z-index: 10;
              @media (max-width: ${mobileMaxWidth}) {
                --profile-pic-size: 10rem;
              }
            `}
            userId={profile.id}
            onClick={
              userId === profile.id
                ? () => setProfilePicModalShown(true)
                : profilePicUrl
                ? () => setImageModalShown(true)
                : undefined
            }
            profilePicUrl={profilePicUrl}
            online={chatStatus[profile.id]?.isOnline}
            isBusy={chatStatus[profile.id]?.isBusy}
            isAway={chatStatus[profile.id]?.isAway}
            large
            statusShown
            statusSize={coverStatusSize}
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
        {profilePicModalShown && (
          <ProfilePicModal
            currentPicUrl={
              profilePicUrl ? `${cloudFrontURL}${profilePicUrl}` : undefined
            }
            onHide={() => setProfilePicModalShown(false)}
            onSelectImage={(selectedImageUri) => {
              setProfilePicModalShown(false);
              setImageUri(selectedImageUri);
              setImageEditModalShown(true);
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
        {wallpaperPickerShown && (
          <WallpaperPickerModal
            currentBuildId={featuredBuildId || null}
            onSetWallpaper={handleSetWallpaper}
            onHide={() => setWallpaperPickerShown(false)}
          />
        )}
      </ScopedTheme>
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

  async function handleSetWallpaper(buildId: number | null) {
    await setFeaturedBuild({ buildId });
    onSetUserState({
      userId,
      newState: { featuredBuildId: buildId }
    });
    setWallpaperPickerShown(false);
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

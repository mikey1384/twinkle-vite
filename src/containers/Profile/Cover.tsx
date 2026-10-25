import React, { useEffect, useRef, useState } from 'react';
import { releaseScrollAnchorTopPin } from '~/helpers/scrollAnchorRestorationCoordinator';
import ProfilePic from '~/components/ProfilePic';
import ColorSelector from '~/components/ColorSelector';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import AlertModal from '~/components/Modals/AlertModal';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import ReportMessageModal from '~/components/ChatSafety/ReportMessageModal';
import ImageModal from '~/components/Modals/ImageModal';
import ImageEditModal from '~/components/Modals/ImageEditModal';
import ProfilePicModal from '~/components/Modals/ProfilePicModal';
import ErrorBoundary from '~/components/ErrorBoundary';
import ShareButton from '~/components/Buttons/ShareButton';
import UserTitle from '~/components/Texts/UserTitle';
import AchievementBadges from '~/components/AchievementBadges';
import ChessLevelBadge from '~/components/ChessLevelBadge';
import BroughtFriendsBadge from '~/components/BroughtFriendsBadge';
import {
  BROUGHT_FRIENDS_ANCHOR_ID,
  readReferrals
} from '~/components/BroughtFriendsBadge/tiers';
import UsernameHistoryModal from '~/components/Modals/UsernameHistoryModal';
import { css, cx } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import {
  cloudFrontURL,
  MAX_PROFILE_PIC_SIZE,
  MIKEY_USER_ID
} from '~/constants/defaultValues';
import { isMobile } from '~/helpers';
import { useAppContext, useKeyContext, useChatContext } from '~/contexts';
import ScopedTheme from '~/theme/ScopedTheme';
import { useThemeTokens } from '~/theme/hooks/useThemeTokens';
import { getCanonicalProfilePictureUrl } from '~/helpers/profileCanonicalState';
import { getStoredItem, setStoredItem } from '~/helpers/userDataHelpers';
import PlatinumSurface from '~/components/PlatinumSurface';
import {
  photoInkShadow,
  platinumEmboss,
  platinumInk
} from '~/components/PlatinumSurface/styles';
import {
  PLATINUM_THEME,
  PROFILE_THEME_LADDER,
  PROFILE_THEME_XP,
  platinumCoverOf
} from '~/constants/profileThemes';
import CoverControls from './CoverControls';
import usePlatinumCover from './usePlatinumCover';

const deviceIsMobile = isMobile(navigator);
const THEME_LADDER_COLORS = PROFILE_THEME_LADDER.map((t) => t.theme);
const platinumSeenKey = (userId: number) => `platinum-unlock-seen:${userId}`;

export default function Cover({
  onSelectTheme,
  onSetTheme,
  profile,
  selectedTheme
}: {
  onSelectTheme: (theme: string) => void;
  onSetTheme: () => Promise<void>;
  profile: any;
  selectedTheme: string;
}) {
  const profileId = profile.id;
  const profileChatStatus = useChatContext(
    (v) => v.state.chatStatus[profileId]
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const loadUserReferrals = useAppContext(
    (v) => v.requestHelpers.loadUserReferrals
  );
  const userId = useKeyContext((v) => v.myState.userId);
  const removeMemberProfileCover = useAppContext(
    (v) => v.requestHelpers.removeMemberProfileCover
  );
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
  // platinum stays marked New inside the panel that announced it
  const [platinumNewInPanel, setPlatinumNewInPanel] = useState(false);
  const [imageModalShown, setImageModalShown] = useState(false);
  const [imageEditModalShown, setImageEditModalShown] = useState(false);
  const [profilePicModalShown, setProfilePicModalShown] = useState(false);
  const [themeSubmitting, setThemeSubmitting] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  // dragging the platinum cover photo into place: the focal point in percent
  const [reposition, setReposition] = useState<{ x: number; y: number } | null>(
    null
  );
  const dragRef = useRef<{ x: number; y: number; px: number; py: number } | null>(
    null
  );
  // Mikey taking down a member's cover photo; anyone else reporting it
  const [coverTakedownShown, setCoverTakedownShown] = useState(false);
  // the cover key on screen when the report form opened
  const [coverReportKey, setCoverReportKey] = useState<string | null>(null);
  const [coverTakedownError, setCoverTakedownError] = useState('');
  const [platinumSeen, setPlatinumSeen] = useState(
    () => !!getStoredItem(platinumSeenKey(userId))
  );
  const platinumCover = usePlatinumCover(profile);
  // keyboard repositioning: arrow keys nudge the photo, Enter saves, Escape cancels
  useEffect(() => {
    if (!reposition) return;
    function handleKey(event: KeyboardEvent) {
      const step = event.shiftKey ? 10 : 2;
      const moves: Record<string, [number, number]> = {
        ArrowLeft: [step, 0],
        ArrowRight: [-step, 0],
        ArrowUp: [0, step],
        ArrowDown: [0, -step]
      };
      if (event.key === 'Escape') return setReposition(null);
      if (event.key === 'Enter') return void handleSavePosition();
      const move = moves[event.key];
      if (!move) return;
      event.preventDefault();
      setReposition((current) =>
        current
          ? {
              x: Math.min(100, Math.max(0, current.x + move[0])),
              y: Math.min(100, Math.max(0, current.y + move[1]))
            }
          : current
      );
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // handleSavePosition reads the latest reposition through state each render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reposition]);
  const FileInputRef: React.RefObject<any> = useRef(null);
  const referrals = readReferrals(profile.referrals);
  const referralsLoaded = !!referrals;
  const referralCount = referrals?.count || 0;
  // a phone cover fits about ten badges at full size beside the picture
  const coverBadgeCount =
    (unlockedAchievementIds?.length || 0) + (referralCount > 0 ? 1 : 0);
  const coverBadgeSize = deviceIsMobile
    ? coverBadgeCount > 10
      ? '2rem'
      : '2.4rem'
    : '3rem';

  useEffect(() => {
    onSelectTheme(profileTheme || 'logoBlue');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // the profile payload carries referrals; a profile first loaded elsewhere
    // (a username hover, a popup) doesn't, so ask for them once
    if (!profileId || referralsLoaded) return;
    let cancelled = false;
    loadReferrals();
    async function loadReferrals() {
      try {
        const data = await loadUserReferrals(profileId);
        if (cancelled || !readReferrals(data)) return;
        onSetUserState({ userId: profileId, newState: { referrals: data } });
      } catch (error) {
        console.error(error);
      }
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, referralsLoaded]);

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

  const isOwner = profile.id === userId;
  const cover = platinumCoverOf(profile, themeName);
  const coverPhoto = cover.photoUrl;
  const coverPosition = reposition
    ? `${reposition.x},${reposition.y}`
    : cover.position;
  const platinumUnlocked =
    Number(twinkleXP || 0) >= PROFILE_THEME_XP[PLATINUM_THEME];
  const platinumToolsShown =
    isOwner &&
    platinumUnlocked &&
    profileTheme === PLATINUM_THEME &&
    themeName === PLATINUM_THEME;
  // someone else's cover photo: only Mikey can take it down (the server
  // checks too); every other signed-in member can report it
  const othersCoverPhotoShown =
    !isOwner && !!userId && cover.isPlatinum && !!profile.profileCoverUrl;
  const mikeyCanRemoveCover =
    othersCoverPhotoShown && Number(userId) === MIKEY_USER_ID;
  const platinumIsNew =
    isOwner &&
    platinumUnlocked &&
    profileTheme !== PLATINUM_THEME &&
    !platinumSeen;

  const coverBackgroundVar = `var(--role-cover-color, ${coverBackground})`;
  const coverTextColorVar = cover.isPlatinum
    ? coverPhoto
      ? '#f7f8fa'
      : platinumInk
    : `var(--role-coverText-color, ${coverTextColor})`;
  const coverTextShadowVar = coverTextShadowColor
    ? `var(--role-coverText-shadow, ${coverTextShadowColor})`
    : 'var(--role-coverText-shadow, transparent)';
  const platinumShadow = coverPhoto ? photoInkShadow : platinumEmboss;
  const coverShadowLarge = cover.isPlatinum
    ? platinumShadow
    : coverTextShadowColor
      ? `2px 2px ${coverTextShadowVar}`
      : 'none';
  const coverShadowSmall = cover.isPlatinum
    ? platinumShadow
    : coverTextShadowColor
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
            overflow: ${colorSelectorShown ? 'visible' : 'hidden'};
            cursor: ${reposition ? 'grab' : 'auto'};
            touch-action: ${reposition ? 'none' : 'auto'};
            /* dragging the photo must never select the name or badges */
            user-select: ${reposition ? 'none' : 'auto'};
            -webkit-user-select: ${reposition ? 'none' : 'auto'};
            &:active {
              cursor: ${reposition ? 'grabbing' : 'auto'};
            }
            @media (max-width: ${mobileMaxWidth}) {
              height: 13rem;
              margin-top: 0;
              overflow: visible;
            }
          `}
          onPointerDown={reposition ? handleDragStart : undefined}
          onPointerMove={reposition ? handleDragMove : undefined}
          onPointerUp={reposition ? handleDragEnd : undefined}
          onPointerCancel={reposition ? handleDragEnd : undefined}
        >
          {cover.isPlatinum ? (
            <PlatinumSurface
              size="cover"
              photoUrl={coverPhoto}
              photoPosition={coverPosition}
              shine={cover.shine && !reposition}
              style={{ position: 'absolute', inset: 0, zIndex: 1 }}
            />
          ) : (
            // every other theme: a soft light from above and a little depth below
            <div
              aria-hidden="true"
              className={css`
                position: absolute;
                inset: 0;
                z-index: 1;
                pointer-events: none;
                background:
                  radial-gradient(120% 90% at 20% 0%, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0) 60%),
                  linear-gradient(180deg, rgba(0, 0, 0, 0) 55%, rgba(0, 0, 0, 0.14) 100%);
              `}
            />
          )}
          {reposition && (
            <div
              className={css`
                position: absolute;
                top: 1rem;
                left: 50%;
                transform: translateX(-50%);
                z-index: 20;
                display: flex;
                align-items: center;
                gap: 0.8rem;
                padding: 0.6rem 0.6rem 0.6rem 1.4rem;
                border-radius: 999px;
                background: rgba(38, 42, 49, 0.82);
                color: #fff;
                font-size: 1.3rem;
                font-weight: 700;
                white-space: nowrap;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
              `}
              onPointerDown={(event) => event.stopPropagation()}
            >
              Drag the photo (or use the arrow keys) to reposition
              <button
                type="button"
                className={repositionButtonClass}
                onClick={() => setReposition(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${repositionButtonClass} ${repositionSaveClass}`}
                disabled={platinumCover.saving}
                onClick={handleSavePosition}
              >
                {platinumCover.saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
          <div
            style={{ position: 'relative', zIndex: 5 }}
            className={css`
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: flex-end;
              margin-left: 29rem;
              font-weight: bold;
              overflow: hidden;
              padding-bottom: 1.2rem;
              white-space: nowrap;
              text-overflow: ellipsis;
              text-shadow: ${coverShadowLarge};
              @media (max-width: ${mobileMaxWidth}) {
                height: 100%;
                justify-content: center;
                margin-left: 15rem;
                overflow: visible;
                padding: 0.6rem 0;
                text-shadow: ${coverShadowSmall};
              }
            `}
          >
            <div
              className={css`
                display: flex;
                justify-content: flex-start;
                margin-bottom: 1rem;
                min-height: 3rem;

                @media (max-width: ${mobileMaxWidth}) {
                  align-items: center;
                  margin-bottom: 0.3rem;
                  min-height: 2.4rem;
                  overflow: visible;
                }
              `}
            >
              {referralCount > 0 && (
                <BroughtFriendsBadge
                  count={referralCount}
                  thumbSize={coverBadgeSize}
                  style={{ marginRight: deviceIsMobile ? '0.8rem' : '1rem' }}
                  onClick={handleBroughtFriendsClick}
                />
              )}
              <AchievementBadges
                thumbSize={coverBadgeSize}
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
                margin-bottom: 0;
                margin-top: 0.5rem;
                font-size: 1.7rem;
                line-height: 1.15;
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1.1rem;
                  margin-bottom: 0;
                  margin-top: 0.25rem;
                }
              `}
            >
              ({realName})
            </div>
            <ChessLevelBadge
              className={css`
                margin-bottom: 0;
                margin-top: 1.2rem;

                @media (max-width: ${mobileMaxWidth}) {
                  margin-bottom: 0;
                  margin-top: 0.45rem;
                }
              `}
              user={profile}
              size="lg"
              style={{
                width: 'fit-content'
              }}
            />
          </div>
          {!colorSelectorShown && !reposition && (
            <ShareButton
              variant="full"
              buttonVariant="solid"
              color="black"
              linkPath={`/users/${username}`}
              style={{
                position: 'absolute',
                bottom: profile.id === userId ? '5.5rem' : '1rem',
                right: '1rem',
                zIndex: 15
              }}
            />
          )}
          {othersCoverPhotoShown && !reposition && (
            // top-right: Share holds the bottom-right corner
            <div
              className={css`
                position: absolute;
                top: 1rem;
                right: 1rem;
                z-index: 15;
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                gap: 0.5rem;
                @media (max-width: ${mobileMaxWidth}) {
                  top: 0.6rem;
                  right: 0.6rem;
                }
              `}
            >
              {mikeyCanRemoveCover ? (
                <button
                  type="button"
                  className={staffChipClass}
                  onClick={() => {
                    setCoverTakedownError('');
                    setCoverTakedownShown(true);
                  }}
                >
                  <Icon icon="trash-alt" />
                  <span>Remove cover</span>
                </button>
              ) : (
                <button
                  type="button"
                  className={reportChipClass}
                  aria-label="Report cover photo"
                  onClick={() => setCoverReportKey(profile.profileCoverUrl)}
                >
                  <Icon icon="flag" />
                </button>
              )}
              {coverTakedownError && (
                <div role="alert" className={staffErrorClass}>
                  {coverTakedownError}
                </div>
              )}
            </div>
          )}
          {isOwner && !reposition && (
            <div
              className={cx(
                css`
                  position: absolute;
                  bottom: 1rem;
                  right: 1rem;
                  z-index: 15;
                  max-width: calc(100% - 2rem);
                  @media (max-width: ${mobileMaxWidth}) {
                    bottom: 0.6rem;
                    right: 0.6rem;
                    max-width: calc(100% - 1.2rem);
                  }
                `,
                // the theme panel drops down over the page, so it never runs
                // off the top of a short phone cover
                colorSelectorShown &&
                  css`
                    top: 1rem;
                    bottom: auto;
                    z-index: 30;
                    @media (max-width: ${mobileMaxWidth}) {
                      top: 0.6rem;
                      bottom: auto;
                    }
                  `
              )}
            >
              {!colorSelectorShown && (
                <CoverControls
                  isPlatinum={platinumToolsShown}
                  hasPhoto={!!profile.profileCoverUrl}
                  shine={cover.shine}
                  themeIsNew={platinumIsNew}
                  busy={platinumCover.saving}
                  uploading={platinumCover.uploading}
                  uploadProgress={platinumCover.uploadProgress}
                  onOpenThemes={handleOpenThemes}
                  onPickPhoto={handlePickCoverPhoto}
                  onReposition={handleStartReposition}
                  onRemovePhoto={() => platinumCover.removeCover()}
                  onToggleShine={() =>
                    platinumCover.saveSettings({ shine: !cover.shine })
                  }
                />
              )}
              {platinumCover.error && !colorSelectorShown && (
                <div
                  role="alert"
                  className={css`
                    margin-top: 0.6rem;
                    padding: 0.6rem 1rem;
                    border-radius: 10px;
                    background: rgba(255, 255, 255, 0.92);
                    color: #a3262a;
                    font-size: 1.2rem;
                    font-weight: 600;
                    text-align: right;
                  `}
                >
                  {platinumCover.error}
                </div>
              )}
              {colorSelectorShown && (
                <div
                  className={css`
                    width: 56rem;
                    max-width: 100%;
                    padding: 1.4rem;
                    border-radius: 16px;
                    background: #fff;
                    box-shadow: 0 10px 34px rgba(20, 24, 30, 0.22);
                  `}
                >
                  <ColorSelector
                    variant="ladder"
                    colors={THEME_LADDER_COLORS}
                    twinkleXP={twinkleXP || 0}
                    setColor={onSelectTheme}
                    selectedColor={themeName}
                    newThemes={platinumNewInPanel ? [PLATINUM_THEME] : []}
                  />
                  <div
                    style={{
                      display: 'flex',
                      marginTop: '1.2rem',
                      gap: '1rem',
                      justifyContent: 'flex-end'
                    }}
                  >
                    <Button
                      disabled={themeSubmitting}
                      style={{ fontSize: '1.2rem' }}
                      variant="solid"
                      tone="raised"
                      color="darkerGray"
                      onClick={handleColorSelectCancel}
                    >
                      Cancel
                    </Button>
                    <Button
                      loading={themeSubmitting}
                      style={{ fontSize: '1.2rem' }}
                      color={doneButtonColor}
                      variant="soft"
                      tone="raised"
                      onClick={handleSetTheme}
                    >
                      Apply theme
                    </Button>
                  </div>
                </div>
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
            online={profileChatStatus?.isOnline}
            isBusy={profileChatStatus?.isBusy}
            isAway={profileChatStatus?.isAway}
            large
            statusShown
            statusSize={coverStatusSize}
          />
        </div>
        {coverReportKey && (
          <ReportMessageModal
            subject="cover"
            coverKey={coverReportKey}
            reportedUser={{ id: profile.id, username }}
            onHide={() => setCoverReportKey(null)}
          />
        )}
        {coverTakedownShown && (
          <ConfirmModal
            title="Remove cover photo"
            description={`Take down ${username}'s cover photo? The image is kept for safety review, and they can add a new one.`}
            descriptionFontSize="1.7rem"
            confirmButtonLabel="Remove"
            confirmButtonColor="red"
            onHide={() => setCoverTakedownShown(false)}
            onConfirm={handleRemoveMemberCover}
          />
        )}
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
      </ScopedTheme>
    </ErrorBoundary>
  );

  function handleBroughtFriendsClick() {
    releaseScrollAnchorTopPin();
    document
      .getElementById(BROUGHT_FRIENDS_ANCHOR_ID)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function handleRemoveMemberCover() {
    try {
      const data = await removeMemberProfileCover(profile.id);
      onSetUserState({
        userId: profile.id,
        newState: {
          profileCoverUrl: data?.profileCoverUrl ?? null,
          profileCoverPosition: data?.profileCoverPosition ?? null
        }
      });
    } catch (error: any) {
      setCoverTakedownError(error?.message || 'The cover could not be removed.');
    } finally {
      setCoverTakedownShown(false);
    }
  }

  function handleOpenThemes() {
    setColorSelectorShown(true);
    setPlatinumNewInPanel(platinumIsNew);
    if (platinumIsNew) {
      setStoredItem(platinumSeenKey(userId), '1');
      setPlatinumSeen(true);
    }
  }

  async function handlePickCoverPhoto(file: File) {
    const saved = await platinumCover.uploadCover(file);
    // a new photo opens straight into positioning
    if (saved) setReposition({ x: 50, y: 50 });
  }

  function handleStartReposition() {
    const [x, y] = String(cover.position || '50,50').split(',').map(Number);
    setReposition({ x: Number.isFinite(x) ? x : 50, y: Number.isFinite(y) ? y : 50 });
  }

  function handleDragStart(event: React.PointerEvent<HTMLDivElement>) {
    if (!reposition) return;
    // no text selection or native image drag while moving the photo
    event.preventDefault();
    window.getSelection?.()?.removeAllRanges();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = { x: reposition.x, y: reposition.y, px: event.clientX, py: event.clientY };
  }

  function handleDragMove(event: React.PointerEvent<HTMLDivElement>) {
    const start = dragRef.current;
    if (!start) return;
    const rect = event.currentTarget.getBoundingClientRect();
    // dragging the picture right shows more of its left side: the focal
    // point moves the other way, scaled to the cover's size
    const clamp = (n: number) => Math.min(100, Math.max(0, Math.round(n * 10) / 10));
    setReposition({
      x: clamp(start.x - ((event.clientX - start.px) / rect.width) * 120),
      y: clamp(start.y - ((event.clientY - start.py) / rect.height) * 120)
    });
  }

  function handleDragEnd() {
    dragRef.current = null;
  }

  async function handleSavePosition() {
    if (!reposition) return;
    const saved = await platinumCover.saveSettings({
      position: `${reposition.x},${reposition.y}`
    });
    if (saved) setReposition(null);
  }

  function handleColorSelectCancel() {
    onSelectTheme(profileTheme || 'logoBlue');
    setColorSelectorShown(false);
  }

  function handleImageEditDone(data: unknown) {
    const canonicalPicture = getCanonicalProfilePictureUrl(data);
    onSetUserState({
      userId: canonicalPicture.userId,
      newState: { profilePicUrl: canonicalPicture.profilePicUrl }
    });
    setImageEditModalShown(false);
  }

  async function handleSetTheme() {
    if (themeSubmitting) return;
    setThemeSubmitting(true);
    try {
      await onSetTheme();
      setColorSelectorShown(false);
    } catch (error) {
      console.error(error);
    } finally {
      setThemeSubmitting(false);
    }
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

const repositionButtonClass = css`
  min-height: 3rem;
  padding: 0 1.3rem;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 999px;
  background: transparent;
  color: #fff;
  font-size: 1.25rem;
  font-weight: 700;
  cursor: pointer;
  &:hover {
    background: rgba(255, 255, 255, 0.12);
  }
  &:focus-visible {
    outline: 3px solid rgba(65, 140, 235, 0.7);
    outline-offset: 2px;
  }
  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;
const repositionSaveClass = css`
  border-color: #fff;
  background: #fff;
  color: #262a31;
  &:hover {
    background: #eef0f3;
  }
`;

const staffChipClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  min-height: 3.2rem;
  padding: 0 1.1rem;
  border: 1px solid rgba(163, 38, 42, 0.25);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  color: #a3262a;
  font-size: 1.25rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(20, 24, 30, 0.14);
  &:hover {
    background: #fff;
  }
  &:focus-visible {
    outline: 3px solid rgba(65, 140, 235, 0.7);
    outline-offset: 2px;
  }
`;
// quiet: a small glass flag, not a call to action
const reportChipClass = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 50%;
  background: rgba(20, 23, 28, 0.32);
  color: rgba(255, 255, 255, 0.88);
  font-size: 1.2rem;
  cursor: pointer;
  backdrop-filter: blur(6px);
  transition: background-color 160ms ease;
  &:hover {
    background: rgba(20, 23, 28, 0.55);
  }
  &:focus-visible {
    outline: 3px solid rgba(65, 140, 235, 0.7);
    outline-offset: 2px;
  }
`;
const staffErrorClass = css`
  padding: 0.6rem 1rem;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.92);
  color: #a3262a;
  font-size: 1.2rem;
  font-weight: 600;
`;

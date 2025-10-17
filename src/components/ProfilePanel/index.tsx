import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import ProfilePic from '~/components/ProfilePic';
import Button from '~/components/Button';
import UploadButton from '~/components/Buttons/UploadButton';
import ImageEditModal from '~/components/Modals/ImageEditModal';
import BioEditModal from '~/components/Modals/BioEditModal';
import AlertModal from '~/components/Modals/AlertModal';
import RankBar from '~/components/RankBar';
import Icon from '~/components/Icon';
import Comments from '~/components/Comments';
import Link from '~/components/Link';
import UserDetails from '~/components/UserDetails';
import Loading from '~/components/Loading';
import AchievementBadges from '~/components/AchievementBadges';
import { useNavigate } from 'react-router-dom';
import { placeholderHeights } from '~/constants/state';
import { MAX_PROFILE_PIC_SIZE } from '~/constants/defaultValues';
import {
  borderRadius,
  Color,
  getThemeStyles,
  mobileMaxWidth,
  wideBorderRadius
} from '~/constants/css';
import { css } from '@emotion/css';
import { timeSince } from '~/helpers/timeStampHelpers';
import { useContentState, useLazyLoad } from '~/helpers/hooks';
import { replaceFakeAtSymbol } from '~/helpers/stringHelpers';
import { useInView } from 'react-intersection-observer';
import {
  useAppContext,
  useChatContext,
  useContentContext,
  useKeyContext,
  useProfileContext
} from '~/contexts';
import localize from '~/constants/localize';
import MessagesButton from './MessagesButton';
import ScopedTheme from '~/theme/ScopedTheme';
import { getThemeRoles, ThemeName } from '~/theme/themes';
import { themedCardBase } from '~/theme/themedCard';

const chatLabel = localize('chat2');
const changePicLabel = localize('changePic');
const editBioLabel = localize('editBio');
const imageTooLarge10MBLabel = localize('imageTooLarge10MB');
const lastOnlineLabel = localize('lastOnline');
const pleaseSelectSmallerImageLabel = localize('pleaseSelectSmallerImage');
const profileLabel = localize('Profile');
const cardsLabel = 'Cards';

function blendWithWhite(color: string, weight: number) {
  const hex = color.trim().match(/^#?([0-9a-f]{6})$/i);
  if (hex) {
    const value = hex[1];
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    const w = Math.max(0, Math.min(1, weight));
    const mix = (channel: number) => Math.round(channel * (1 - w) + 255 * w);
    return `rgba(${mix(r)}, ${mix(g)}, ${mix(b)}, 1)`;
  }
  const match = color
    .replace(/\s+/g, '')
    .match(/rgba?\(([\d.]+),([\d.]+),([\d.]+)(?:,([\d.]+))?\)/i);
  if (!match) return '#f2f5ff';
  const [, r, g, b, a] = match;
  const w = Math.max(0, Math.min(1, weight));
  const mix = (channel: number) => Math.round(channel * (1 - w) + 255 * w);
  const alpha = a ? Number(a) : 1;
  return `rgba(${mix(Number(r))}, ${mix(Number(g))}, ${mix(
    Number(b)
  )}, ${alpha.toFixed(3)})`;
}

const actionButtonClass = css`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.65rem 1rem;
  min-width: 8rem;
  border-radius: 2.2rem;
  color: inherit;
  font-weight: 600;
  letter-spacing: 0.02em;
  transition: box-shadow 0.2s ease, filter 0.2s ease;
  box-shadow: 0 12px 26px -18px rgba(0, 0, 0, 0.55);
  cursor: pointer;
  text-decoration: none;
  font-size: 1.2rem;
  gap: 0.6rem;
  background: transparent;
  border: none;
  span {
    margin-left: 0.9rem;
    white-space: nowrap;
  }
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1rem;
    gap: 0.35rem;
    padding: 0.5rem 0.7rem;
    min-width: 0;
    width: 100%;
    span {
      margin-left: 0.5rem;
    }
  }
  span {
    white-space: nowrap;
  }
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.05rem;
    gap: 0.45rem;
    padding: 0.55rem 0.85rem;
    min-width: 0;
    width: 100%;
  }
  @media (hover: hover) and (pointer: fine) {
    &:hover {
      text-decoration: none;
      box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.35),
        0 16px 30px -18px rgba(0, 0, 0, 0.6);
      filter: brightness(1.06) saturate(1.03);
    }
  }
  &:active {
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.25),
      0 12px 26px -20px rgba(0, 0, 0, 0.58);
    filter: brightness(0.98);
  }
  &:disabled {
    opacity: 0.55;
    cursor: default;
    box-shadow: none;
    filter: none;
  }
`;

const actionButtonsLayoutClass = css`
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
  max-width: 32rem;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: ${mobileMaxWidth}) {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-areas:
      'profile cards chat'
      'message message message';
    gap: 0.5rem;
  }
`;

const profileButtonClass = css`
  @media (max-width: ${mobileMaxWidth}) {
    grid-area: profile;
  }
`;

const cardsButtonClass = css`
  @media (max-width: ${mobileMaxWidth}) {
    grid-area: cards;
  }
`;

const chatButtonClass = css`
  @media (max-width: ${mobileMaxWidth}) {
    grid-area: chat;
  }
`;

const messageButtonClass = css`
  @media (max-width: ${mobileMaxWidth}) {
    grid-area: message;
  }
`;

const panelContainerClass = css`
  ${themedCardBase};
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  padding: 2rem 2.3rem;
  border-radius: ${wideBorderRadius};
  content-visibility: auto;
  contain-intrinsic-size: 600px;
  font-size: 1.5rem;
  line-height: 2.3rem;
  position: relative;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.98) 0%,
    var(--themed-card-bg, #f7f9ff) 100%
  );
  @media (max-width: ${mobileMaxWidth}) {
    border-radius: 0;
    padding: 1.6rem 1.4rem;
  }
`;

const heroSectionClass = css`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 1.4rem;
  border-radius: calc(${wideBorderRadius} - 0.6rem);
  background: var(
    --profile-panel-hero-bg,
    linear-gradient(135deg, rgba(59, 130, 246, 0.65), rgba(59, 130, 246, 0.28))
  );
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.38),
    0 10px 32px -20px rgba(15, 23, 42, 0.55);
  @media (max-width: ${mobileMaxWidth}) {
    border-radius: ${borderRadius};
  }
`;

const heroBadgesClass = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0.9rem;
  width: 100%;
  min-height: 2.5rem;
`;

const profileContentClass = css`
  display: flex;
  gap: 2.4rem;
  flex-wrap: wrap;
  width: 100%;
  align-items: flex-start;
`;

const leftColumnClass = css`
  flex: 0 0 20rem;
  max-width: 22rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.4rem;
  @media (max-width: ${mobileMaxWidth}) {
    flex: 1 1 100%;
    max-width: unset;
  }
`;

const quickLinksClass = css`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  align-items: center;
  font-weight: 600;
`;

const quickLinkClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  cursor: pointer;
  transition: transform 0.25s ease, filter 0.25s ease;
  text-decoration: none;
  &:hover {
    transform: translateY(-2px);
    filter: brightness(1.05);
  }
  &:active {
    transform: translateY(0);
    filter: brightness(0.96);
  }
`;

const detailsColumnClass = css`
  flex: 1 1 24rem;
  min-width: 20rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  position: relative;
`;

const actionsContainerClass = css`
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
`;

function ProfilePanel({
  expandable,
  profileId,
  style
}: {
  expandable?: boolean;
  profileId: number;
  style?: React.CSSProperties;
}) {
  const chatStatus = useChatContext((v) => v.state.chatStatus);
  const [chatLoading, setChatLoading] = useState(false);
  const reportError = useAppContext((v) => v.requestHelpers.reportError);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const navigate = useNavigate();
  const profilePanelState = useContentState({
    contentType: 'user',
    contentId: profileId
  });
  const profile = useAppContext((v) => v.user.state.userObj[profileId]) || {};

  const {
    comments = [],
    commentsLoaded,
    commentsLoadMoreButton,
    commentsShown,
    previewLoaded
  } = profilePanelState;

  const {
    lastActive,
    loaded: profileLoaded,
    numMessages,
    username: profileName,
    twinkleXP,
    profileFirstRow,
    profileSecondRow,
    profileThirdRow,
    profilePicUrl,
    profileTheme,
    website,
    youtubeUrl
  } = profile;

  const onOpenNewChatTab = useChatContext((v) => v.actions.onOpenNewChatTab);
  const onUpdateSelectedChannelId = useChatContext(
    (v) => v.actions.onUpdateSelectedChannelId
  );
  const onDeleteComment = useContentContext((v) => v.actions.onDeleteComment);
  const onEditComment = useContentContext((v) => v.actions.onEditComment);
  const onEditRewardComment = useContentContext(
    (v) => v.actions.onEditRewardComment
  );
  const onInitContent = useContentContext((v) => v.actions.onInitContent);
  const onLikeComment = useContentContext((v) => v.actions.onLikeComment);
  const onLoadComments = useContentContext((v) => v.actions.onLoadComments);
  const onLoadMoreComments = useContentContext(
    (v) => v.actions.onLoadMoreComments
  );
  const onLoadMoreReplies = useContentContext(
    (v) => v.actions.onLoadMoreReplies
  );
  const onLoadRepliesOfReply = useContentContext(
    (v) => v.actions.onLoadRepliesOfReply
  );
  const onReloadContent = useContentContext((v) => v.actions.onReloadContent);
  const onSetCommentsShown = useContentContext(
    (v) => v.actions.onSetCommentsShown
  );
  const onUploadComment = useContentContext((v) => v.actions.onUploadComment);
  const onUploadReply = useContentContext((v) => v.actions.onUploadReply);

  const [ComponentRef, inView] = useInView();
  const PanelRef = useRef(null);
  const ContainerRef = useRef(null);
  const previousPlaceholderHeight = useMemo(
    () => placeholderHeights[`profile-${profileId}`],
    [profileId]
  );
  const [placeholderHeight, setPlaceholderHeight] = useState(
    previousPlaceholderHeight
  );
  const placeholderHeightRef = useRef(previousPlaceholderHeight);
  const [isVisible, setIsVisible] = useState(false);
  useLazyLoad({
    inView,
    PanelRef,
    onSetIsVisible: setIsVisible,
    onSetPlaceholderHeight: (height: number) => {
      setPlaceholderHeight(height);
      placeholderHeightRef.current = height;
    }
  });

  useEffect(() => {
    return function cleanUp() {
      placeholderHeights[`profile-${profileId}`] = placeholderHeightRef.current;
    };
  }, [profileId]);

  const loadDMChannel = useAppContext((v) => v.requestHelpers.loadDMChannel);
  const loadComments = useAppContext((v) => v.requestHelpers.loadComments);
  const loadProfile = useAppContext((v) => v.requestHelpers.loadProfile);
  const uploadBio = useAppContext((v) => v.requestHelpers.uploadBio);
  const onResetProfile = useProfileContext((v) => v.actions.onResetProfile);

  const userId = useKeyContext((v) => v.myState.userId);
  const username = useKeyContext((v) => v.myState.username);
  const banned = useKeyContext((v) => v.myState.banned);
  const themeName = useMemo<ThemeName>(
    () => (profileTheme || 'logoBlue') as ThemeName,
    [profileTheme]
  );
  const themeRoles = useMemo(() => getThemeRoles(themeName), [themeName]);
  const profilePanelFallbackColor = useMemo(() => {
    const role = themeRoles.profilePanel;
    if (!role?.color) {
      return Color.logoBlue();
    }
    const colorFn = Color[role.color as keyof typeof Color];
    if (colorFn) {
      return typeof role.opacity === 'number'
        ? colorFn(role.opacity)
        : colorFn();
    }
    return role.color;
  }, [themeRoles]);
  const themeStyles = useMemo(
    () => getThemeStyles(themeName, 0.16),
    [themeName]
  );
  const panelAccentColor = profilePanelFallbackColor;
  const panelBgTint = useMemo(
    () => blendWithWhite(panelAccentColor, 0.92),
    [panelAccentColor]
  );
  const heroBackground = useMemo(
    () =>
      `linear-gradient(135deg, ${panelAccentColor} 0%, ${blendWithWhite(
        panelAccentColor,
        0.55
      )} 100%)`,
    [panelAccentColor]
  );
  const panelStyleVars = useMemo(
    () =>
      ({
        ['--themed-card-bg' as const]: panelBgTint,
        ['--themed-card-border' as const]:
          themeStyles.border || Color.borderGray(0.45),
        ['--profile-panel-hero-bg' as const]: heroBackground,
        ['--profile-panel-accent' as const]: panelAccentColor
      } as React.CSSProperties),
    [heroBackground, panelAccentColor, panelBgTint, themeStyles.border]
  );

  const [bioEditModalShown, setBioEditModalShown] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [imageUri, setImageUri] = useState<any>(null);
  const [imageEditModalShown, setImageEditModalShown] = useState(false);
  const [alertModalShown, setAlertModalShown] = useState(false);
  const CommentInputAreaRef: React.RefObject<any> = useRef(null);
  const loading = useRef(false);

  useEffect(() => {
    if (!profileLoaded && !loading.current && profileId) {
      handleInitProfile();
    }
    if (!commentsLoaded && !previewLoaded) {
      handleLoadComments();
    }
    async function handleInitProfile() {
      loading.current = true;
      const data = await loadProfile(profileId);
      onInitContent({
        contentType: 'user',
        contentId: profileId,
        ...data
      });
      onSetUserState({
        userId: profileId,
        newState: { ...data, loaded: true }
      });
      loading.current = false;
    }
    async function handleLoadComments() {
      try {
        const data = await loadComments({
          contentId: profileId,
          contentType: 'user',
          isPreview: true,
          limit: 1
        });
        onLoadComments({
          ...data,
          contentId: profileId,
          contentType: 'user',
          isPreview: true
        });
      } catch (error) {
        console.error(error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, userId, profileLoaded, commentsLoaded, previewLoaded]);

  const canEdit = useMemo(() => userId === profileId, [profileId, userId]);
  const noBio = useMemo(
    () => !profileFirstRow && !profileSecondRow && !profileThirdRow,
    [profileFirstRow, profileSecondRow, profileThirdRow]
  );
  const profileUsername = useMemo(
    () => profileName || profile.username || '',
    [profile.username, profileName]
  );
  const contentShown = useMemo(
    () => !profileLoaded || inView || isVisible,
    [inView, isVisible, profileLoaded]
  );
  const profileStatus = chatStatus[profileId] || {};
  const { isOnline = false, isBusy = false, isAway = false } = profileStatus;

  const componentHeight = useMemo(() => {
    return placeholderHeight || '15rem';
  }, [placeholderHeight]);

  return (
    <div style={style} ref={ComponentRef} key={profileId}>
      <div
        ref={ContainerRef}
        style={{
          width: '100%'
        }}
      >
        {contentShown ? (
          <>
            <ScopedTheme theme={themeName} roles={['profilePanel']}>
              <div
                style={{
                  position: 'relative',
                  zIndex: 2,
                  overflow: 'visible'
                }}
              >
                <div
                  ref={PanelRef}
                  className={panelContainerClass}
                  style={panelStyleVars}
                >
                  <div className={`unselectable ${heroSectionClass}`}>
                    <div className={heroBadgesClass}>
                      <AchievementBadges
                        thumbSize="2.5rem"
                        unlockedAchievementIds={profile.unlockedAchievementIds}
                      />
                    </div>
                  </div>
                  {profileLoaded ? (
                    <>
                      <div className={profileContentClass}>
                        <div className={leftColumnClass}>
                          <div
                            className="unselectable"
                            style={{ width: '100%' }}
                          >
                            <Link
                              onClick={handleReloadProfile}
                              to={`/users/${profileName}`}
                              style={{ display: 'block', width: '100%' }}
                            >
                          <ProfilePic
                            style={{ cursor: 'pointer' }}
                            className={css`
                              margin: 0 auto;
                              display: block;
                              --profile-pic-size: min(16rem, 58vw);
                              @media (max-width: ${mobileMaxWidth}) {
                                --profile-pic-size: min(13rem, 72vw);
                              }
                            `}
                                userId={profileId}
                                profilePicUrl={profilePicUrl}
                                online={isOnline}
                                isBusy={isBusy}
                                isAway={isAway}
                                statusShown
                                large
                                statusSize="medium"
                              />
                            </Link>
                          </div>
                          <div className={quickLinksClass}>
                            <div
                              className={quickLinkClass}
                              style={{
                                color: panelAccentColor,
                                opacity: profileUsername ? 1 : 0.55,
                                pointerEvents: profileUsername ? 'auto' : 'none'
                              }}
                              onClick={() =>
                                profileUsername
                                  ? navigate(
                                      `/ai-cards/?search[owner]=${profile.username}`
                                    )
                                  : null
                              }
                            >
                              <Icon icon="cards-blank" />
                              <span>AI Cards</span>
                            </div>
                            {website && (
                              <div
                                className={quickLinkClass}
                                style={{ color: Color.green() }}
                                onClick={() => window.open(website)}
                              >
                                <Icon icon="globe" />
                                <span>Website</span>
                              </div>
                            )}
                            {youtubeUrl && (
                              <div
                                className={quickLinkClass}
                                style={{ color: '#e64959' }}
                                onClick={() => window.open(youtubeUrl)}
                              >
                                <Icon icon={['fab', 'youtube']} />
                                <span>YouTube</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={detailsColumnClass}>
                          <UserDetails
                            profile={profile}
                            removeStatusMsg={(userId: number) =>
                              onSetUserState({
                                userId,
                                newState: { statusMsg: '', statusColor: '' }
                              })
                            }
                            updateStatusMsg={(data: any) => {
                              if (banned?.posting) {
                                return;
                              }
                              onSetUserState({
                                userId: data.userId,
                                newState: data
                              });
                            }}
                            onSetBioEditModalShown={setBioEditModalShown}
                            userId={userId}
                          />
                          {canEdit && (
                            <div className={actionsContainerClass}>
                              <div
                                style={{
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  gap: '0.6rem',
                                  justifyContent: 'flex-start'
                                }}
                              >
                                <UploadButton
                                  onFileSelect={handlePicture}
                                  accept="image/*"
                                  icon="upload"
                                  text={changePicLabel}
                                  className={actionButtonClass}
                                  style={{ flex: '1 1 13rem' }}
                                  color="logoBlue"
                                  buttonProps={{
                                    variant: 'solid',
                                    tone: 'raised',
                                    uppercase: false
                                  }}
                                />
                                <Button
                                  onClick={() => {
                                    if (banned?.posting) {
                                      return;
                                    }
                                    setBioEditModalShown(true);
                                  }}
                                  className={actionButtonClass}
                                  variant="solid"
                                  tone="raised"
                                  color="purple"
                                  uppercase={false}
                                  style={{ flex: '1 1 9rem' }}
                                >
                                  {editBioLabel}
                                </Button>
                                {profileId === userId && (
                                  <MessagesButton
                                    commentsShown={commentsShown}
                                    loading={loadingComments}
                                    profileId={profileId}
                                    myId={userId}
                                    onMessagesButtonClick={
                                      onMessagesButtonClick
                                    }
                                    numMessages={numMessages}
                                    className={`${actionButtonClass} ${messageButtonClass}`}
                                    style={{
                                      flex: '1 0 100%',
                                      minWidth: '18rem'
                                    }}
                                    iconColor="rgba(255,255,255,0.92)"
                                    textColor="rgba(255,255,255,0.95)"
                                    buttonColor="orange"
                                    buttonVariant="solid"
                                    buttonTone="raised"
                                  />
                                )}
                              </div>
                            </div>
                          )}
                          {expandable && userId !== profileId && (
                            <div
                              className={actionButtonsLayoutClass}
                              style={{ marginTop: noBio ? '2rem' : '1rem' }}
                            >
                              <Button
                                className={`${actionButtonClass} ${profileButtonClass}`}
                                variant="solid"
                                tone="raised"
                                color="logoBlue"
                                uppercase={false}
                                style={{ flex: '1 1 9rem' }}
                                disabled={!profileUsername}
                                onClick={() =>
                                  profileUsername
                                    ? navigate(`/users/${profileUsername}`)
                                    : null
                                }
                              >
                                <Icon
                                  icon="user"
                                  color="rgba(255,255,255,0.92)"
                                />
                                <span style={{ marginLeft: '0.7rem' }}>
                                  {profileLabel}
                                </span>
                              </Button>
                              <Button
                                className={`${actionButtonClass} ${cardsButtonClass}`}
                                variant="solid"
                                tone="raised"
                                color="purple"
                                uppercase={false}
                                style={{ flex: '1 1 9rem' }}
                                disabled={!profileUsername}
                                onClick={() =>
                                  profileUsername
                                    ? navigate(
                                        `/ai-cards/?search[owner]=${profileUsername}`
                                      )
                                    : null
                                }
                              >
                                <Icon
                                  icon="cards-blank"
                                  color="rgba(255,255,255,0.92)"
                                />
                                <span style={{ marginLeft: '0.7rem' }}>
                                  {cardsLabel}
                                </span>
                              </Button>
                              <Button
                                className={`${actionButtonClass} ${chatButtonClass}`}
                                variant="solid"
                                tone="raised"
                                color="green"
                                uppercase={false}
                                style={{ flex: '1 1 9rem' }}
                                loading={chatLoading}
                                disabled={chatLoading || !profileUsername}
                                onClick={handleTalkClick}
                              >
                                <Icon
                                  icon="comments"
                                  color="rgba(255,255,255,0.92)"
                                />
                                <span style={{ marginLeft: '0.7rem' }}>
                                  {chatLabel}
                                </span>
                              </Button>
                              <MessagesButton
                                className={`${actionButtonClass} ${messageButtonClass}`}
                                style={{
                                  flex: '1 0 100%',
                                  minWidth: '18rem'
                                }}
                                commentsShown={commentsShown}
                                loading={loadingComments}
                                profileId={profileId}
                                myId={userId}
                                onMessagesButtonClick={onMessagesButtonClick}
                                numMessages={numMessages}
                                iconColor="rgba(255,255,255,0.92)"
                                textColor="rgba(255,255,255,0.95)"
                                buttonColor="orange"
                                buttonVariant="solid"
                                buttonTone="raised"
                              />
                            </div>
                          )}
                          {lastActive && !isOnline && profileId !== userId && (
                            <div
                              style={{
                                marginTop: '1rem',
                                fontSize: '1.5rem',
                                color: Color.gray()
                              }}
                            >
                              <p>
                                {lastOnlineLabel} {timeSince(lastActive)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      {bioEditModalShown && (
                        <BioEditModal
                          firstLine={replaceFakeAtSymbol(profileFirstRow || '')}
                          secondLine={replaceFakeAtSymbol(
                            profileSecondRow || ''
                          )}
                          thirdLine={replaceFakeAtSymbol(profileThirdRow || '')}
                          onSubmit={handleUploadBio}
                          onHide={() => setBioEditModalShown(false)}
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
                    </>
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        padding: '2rem 0'
                      }}
                    >
                      <Loading />
                    </div>
                  )}
                  {profileLoaded && (
                    <Comments
                      comments={comments}
                      commentsLoadLimit={5}
                      commentsShown={commentsShown}
                      inputAreaInnerRef={CommentInputAreaRef}
                      inputTypeLabel={`message${
                        userId === profileId ? '' : ` to ${profileName}`
                      }`}
                      isLoading={loadingComments}
                      loadMoreButton={commentsLoadMoreButton}
                      numPreviews={1}
                      onCommentSubmit={onUploadComment}
                      onDelete={onDeleteComment}
                      onEditDone={onEditComment}
                      onLikeClick={onLikeComment}
                      onLoadMoreComments={onLoadMoreComments}
                      onLoadMoreReplies={onLoadMoreReplies}
                      onLoadRepliesOfReply={onLoadRepliesOfReply}
                      onPreviewClick={onExpandComments}
                      onReplySubmit={onUploadReply}
                      onRewardCommentEdit={onEditRewardComment}
                      parent={{
                        ...profile,
                        ...profilePanelState,
                        contentType: 'user'
                      }}
                      style={{ marginTop: '0.6rem' }}
                      userId={userId}
                    />
                  )}
                </div>
              </div>
              {alertModalShown && (
                <AlertModal
                  title={imageTooLarge10MBLabel}
                  content={pleaseSelectSmallerImageLabel}
                  onHide={() => setAlertModalShown(false)}
                />
              )}
            </ScopedTheme>
            {!!twinkleXP && profileLoaded && (
              <div
                style={{
                  marginTop: '-1.6rem',
                  width: '100%',
                  position: 'relative',
                  zIndex: 0
                }}
              >
                <RankBar profile={profile} />
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              width: '100%',
              height: componentHeight
            }}
          />
        )}
      </div>
    </div>
  );

  function handleImageEditDone({
    pictures,
    filePath
  }: {
    pictures?: any[];
    filePath?: string;
  }) {
    if (pictures && filePath) {
      onSetUserState({
        userId,
        newState: { profilePicUrl: `/profile/${filePath}` }
      });
    }
    setImageEditModalShown(false);
  }

  function handlePicture(file: File) {
    const reader = new FileReader();
    if (file.size / 1000 > MAX_PROFILE_PIC_SIZE) {
      return setAlertModalShown(true);
    }
    reader.onload = (upload) => {
      setImageEditModalShown(true);
      setImageUri(upload.target?.result);
    };
    reader.readAsDataURL(file);
  }

  function handleReloadProfile() {
    onReloadContent({
      contentId: profileId,
      contentType: 'user'
    });
    onResetProfile(username);
  }

  async function handleTalkClick() {
    setChatLoading(true);
    const { channelId, pathId } = await loadDMChannel({ recipient: profile });
    if (!pathId) {
      if (!profile?.id) {
        return reportError({
          componentPath: 'ProfilePanel/index',
          message: `handleTalkClick: recipient userId is null. recipient: ${JSON.stringify(
            profile
          )}`
        });
      }
      onOpenNewChatTab({
        user: { username, id: userId, profilePicUrl },
        recipient: {
          username: profile.username,
          id: profile.id,
          profilePicUrl: profile.profilePicUrl
        }
      });
    }
    onUpdateSelectedChannelId(channelId);
    setTimeout(() => navigate(pathId ? `/chat/${pathId}` : `/chat/new`), 0);
    setChatLoading(false);
  }

  async function onExpandComments() {
    if (!commentsShown) {
      setLoadingComments(true);
      const { comments, loadMoreButton } = await loadComments({
        contentId: profileId,
        contentType: 'user',
        limit: 5
      });
      onLoadComments({
        comments,
        contentId: profileId,
        contentType: 'user',
        loadMoreButton
      });
      onSetCommentsShown({ contentId: profileId, contentType: 'user' });
      setLoadingComments(false);
    }
  }

  async function onMessagesButtonClick() {
    await onExpandComments();
    if (profileId !== userId) CommentInputAreaRef.current?.focus?.();
  }

  async function handleUploadBio(params: object) {
    const data = await uploadBio(params);
    onSetUserState({ userId: data.userId, newState: data.bio });
    setBioEditModalShown(false);
  }
}

export default memo(ProfilePanel);

import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import ProfilePic from '~/components/ProfilePic';
import Button from '~/components/Button';
import ImageEditModal from '~/components/Modals/ImageEditModal';
import BioEditModal from '~/components/Modals/BioEditModal';
import AlertModal from '~/components/Modals/AlertModal';
import ProfilePicModal from '~/components/Modals/ProfilePicModal';
import RankBar from '~/components/RankBar';
import Icon from '~/components/Icon';
import Comments from '~/components/Comments';
import Link from '~/components/Link';
import UserDetails from '~/components/UserDetails';
import Loading from '~/components/Loading';
import AchievementBadges from '~/components/AchievementBadges';
import { useNavigate } from 'react-router-dom';
import { placeholderHeights } from '~/constants/state';
import { cloudFrontURL } from '~/constants/defaultValues';
import { Color, tabletMaxWidth, borderRadius } from '~/constants/css';
import { css, cx } from '@emotion/css';
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
} from '~/contexts';import MessagesButton from './MessagesButton';
import ScopedTheme from '~/theme/ScopedTheme';
import { ThemeName } from '~/theme';
import { themedCardBase } from '~/theme/themedCard';
import { useThemedCardVars } from '~/theme/useThemedCardVars';

const chatLabel = 'Chat';
const changePicLabel = 'Change Pic';
const editBioLabel = 'Edit Bio';
const imageTooLarge10MBLabel = 'Image is too large (limit: 10mb)';
const lastOnlineLabel = 'Last online';
const pleaseSelectSmallerImageLabel = 'Please select a smaller image';
const profileLabel = 'Profile';
const cardsLabel = 'Cards';

const quickLinkThemes = {
  aiCards: {
    background: 'rgba(152, 28, 235, 0.08)',
    text: Color.darkBluerGray(),
    icon: Color.purple(),
    fillBg: Color.purple(0.92),
    fillFg: '#fff',
    fillIcon: '#fff',
    fillBorder: 'rgba(152, 28, 235, 0.45)',
    border: 'rgba(152, 28, 235, 0.18)',
    shadow: `0 8px 18px -16px ${Color.purple(0.28)}`
  },
  website: {
    background: 'rgba(40, 182, 44, 0.08)',
    text: Color.darkBlueGray(),
    icon: Color.green(),
    fillBg: Color.green(0.92),
    fillFg: '#fff',
    fillIcon: '#fff',
    fillBorder: 'rgba(40, 182, 44, 0.45)',
    border: 'rgba(40, 182, 44, 0.18)',
    shadow: `0 8px 18px -16px ${Color.green(0.26)}`
  },
  youtube: {
    background: 'rgba(255, 82, 82, 0.08)',
    text: Color.darkBluerGray(),
    icon: Color.red(),
    fillBg: Color.red(0.92),
    fillFg: '#fff',
    fillIcon: '#fff',
    fillBorder: 'rgba(255, 82, 82, 0.48)',
    border: 'rgba(255, 82, 82, 0.2)',
    shadow: `0 8px 18px -16px ${Color.red(0.26)}`
  }
} as const;

const actionButtonClass = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  text-decoration: none;
  gap: 0.6rem;
  span {
    white-space: nowrap;
  }
  @media (max-width: ${tabletMaxWidth}) {
    gap: 0.45rem;
    width: 100%;
  }
`;

const actionButtonFlexLargeClass = css`
  flex: 1 1 13rem;
`;

const actionButtonFlexMediumClass = css`
  flex: 1 1 9rem;
`;

const actionButtonFullWidthClass = css`
  flex: 1 0 100%;
  min-width: 18rem;
  @media (max-width: ${tabletMaxWidth}) {
    min-width: 0;
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

  @media (max-width: ${tabletMaxWidth}) {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-areas:
      'profile cards chat'
      'message message message';
    gap: 0.5rem;
  }
`;

const profileButtonClass = css`
  @media (max-width: ${tabletMaxWidth}) {
    grid-area: profile;
  }
`;

const cardsButtonClass = css`
  @media (max-width: ${tabletMaxWidth}) {
    grid-area: cards;
  }
`;

const chatButtonClass = css`
  @media (max-width: ${tabletMaxWidth}) {
    grid-area: chat;
  }
`;

const messageButtonClass = css`
  @media (max-width: ${tabletMaxWidth}) {
    grid-area: message;
  }
`;

const rankBarWrapperClass = css`
  margin-top: -1.6rem;
  width: 100%;
  position: relative;
  z-index: 0;
  @media (max-width: ${tabletMaxWidth}) {
    margin-top: 0;
  }
`;

const panelContainerClass = css`
  ${themedCardBase};
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  padding: 2rem 2.3rem;
  border-radius: ${borderRadius};
  content-visibility: auto;
  contain-intrinsic-size: 600px;
  font-size: 1.5rem;
  line-height: 2.3rem;
  position: relative;
  background: #fff;
  border-color: var(--themed-card-border, var(--ui-border));
  box-shadow: none;
  @media (max-width: ${tabletMaxWidth}) {
    border-radius: 0;
    padding: 1.6rem 1.4rem;
  }
`;

const heroSectionClass = css`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 1.4rem;
  border-radius: calc(${borderRadius} - 0.6rem);
  background: var(--profile-panel-hero-bg, rgba(59, 130, 246, 0.65));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.38),
    0 10px 32px -20px rgba(15, 23, 42, 0.55);
  @media (max-width: ${tabletMaxWidth}) {
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
  @media (max-width: ${tabletMaxWidth}) {
    flex: 1 1 100%;
    max-width: unset;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 1rem;
  }
`;

const quickLinksClass = css`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  align-items: center;
  font-weight: 600;
  @media (max-width: ${tabletMaxWidth}) {
    width: auto;
    align-items: flex-end;
    gap: 0.6rem;
    grid-column: 3;
    justify-self: end;
    text-align: right;
  }
`;

const quickLinkClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: background-color 0.18s ease, border-color 0.18s ease,
    color 0.18s ease, box-shadow 0.22s ease, transform 0.2s ease,
    filter 0.2s ease;
  text-decoration: none;
  padding: 0.55rem 0.8rem;
  border-radius: 0.6rem;
  justify-content: center;
  min-width: 0;
  width: fit-content;
  font-size: 1.2rem;
  background: var(--quick-link-bg, rgba(248, 249, 255, 0.94));
  color: var(--quick-link-fg, ${Color.darkBlueGray()});
  box-shadow: var(--quick-link-shadow, 0 8px 18px -16px rgba(15, 23, 42, 0.28));
  border: 1px solid var(--quick-link-border, rgba(15, 23, 42, 0.08));
  letter-spacing: 0.002em;
  svg {
    color: var(--quick-link-icon-color, currentColor);
    transition: color 0.18s ease;
  }
  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: var(--quick-link-bg-hover, rgba(248, 249, 255, 0.98));
      color: var(--quick-link-fg-hover, ${Color.darkBlueGray()});
      border-color: var(--quick-link-border-hover, rgba(15, 23, 42, 0.14));
      box-shadow: var(
        --quick-link-shadow-hover,
        0 12px 24px -16px rgba(15, 23, 42, 0.32)
      );
      filter: brightness(1.03);
      svg {
        color: var(--quick-link-icon-color-hover, currentColor);
      }
    }
  }
  &:active {
    transform: translateY(0);
    filter: brightness(0.97);
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

const profilePicWrapperClass = css`
  width: 100%;
  @media (max-width: ${tabletMaxWidth}) {
    width: auto;
    grid-column: 2;
    justify-self: center;
  }
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
  const {
    accentColor: panelAccentColor,
    cardBg,
    cardVars
  } = useThemedCardVars({
    role: 'profilePanel',
    intensity: 0.05,
    themeName,
    borderFallback: 'var(--ui-border)',
    fallbackColor: 'logoBlue'
  });
  const heroBackground = useMemo(() => panelAccentColor, [panelAccentColor]);
  const panelStyleVars = useMemo(
    () =>
      ({
        ...cardVars,
        ['--themed-card-bg' as const]: cardBg,
        ['--themed-card-border' as const]: 'var(--ui-border)',
        ['--profile-panel-hero-bg' as const]: heroBackground,
        ['--profile-panel-accent' as const]: panelAccentColor
      } as React.CSSProperties),
    [cardBg, cardVars, heroBackground, panelAccentColor]
  );

  const [bioEditModalShown, setBioEditModalShown] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [imageUri, setImageUri] = useState<any>(null);
  const [imageEditModalShown, setImageEditModalShown] = useState(false);
  const [profilePicModalShown, setProfilePicModalShown] = useState(false);
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
        <div style={{ width: '100%' }} ref={PanelRef}>
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
                  <div className={panelContainerClass} style={panelStyleVars}>
                    <div className={`unselectable ${heroSectionClass}`}>
                      <div className={heroBadgesClass}>
                        <AchievementBadges
                          thumbSize="2.5rem"
                          unlockedAchievementIds={
                            profile.unlockedAchievementIds
                          }
                        />
                      </div>
                    </div>
                    {profileLoaded ? (
                      <>
                        <div className={profileContentClass}>
                          <div className={leftColumnClass}>
                            <div
                              className={`unselectable ${profilePicWrapperClass}`}
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
                                    @media (max-width: ${tabletMaxWidth}) {
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
                                style={
                                  {
                                    ['--quick-link-bg' as const]:
                                      quickLinkThemes.aiCards.background,
                                    ['--quick-link-fg' as const]:
                                      quickLinkThemes.aiCards.text,
                                    ['--quick-link-shadow' as const]:
                                      quickLinkThemes.aiCards.shadow,
                                    ['--quick-link-border' as const]:
                                      quickLinkThemes.aiCards.border,
                                    ['--quick-link-bg-hover' as const]:
                                      quickLinkThemes.aiCards.fillBg,
                                    ['--quick-link-fg-hover' as const]:
                                      quickLinkThemes.aiCards.fillFg,
                                    ['--quick-link-border-hover' as const]:
                                      quickLinkThemes.aiCards.fillBorder,
                                    ['--quick-link-icon-color' as const]:
                                      quickLinkThemes.aiCards.icon,
                                    ['--quick-link-icon-color-hover' as const]:
                                      quickLinkThemes.aiCards.fillIcon,
                                    opacity: profileUsername ? 1 : 0.55,
                                    pointerEvents: profileUsername
                                      ? 'auto'
                                      : 'none'
                                  } as React.CSSProperties
                                }
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
                                  style={
                                    {
                                      ['--quick-link-bg' as const]:
                                        quickLinkThemes.website.background,
                                      ['--quick-link-fg' as const]:
                                        quickLinkThemes.website.text,
                                      ['--quick-link-shadow' as const]:
                                        quickLinkThemes.website.shadow,
                                      ['--quick-link-border' as const]:
                                        quickLinkThemes.website.border,
                                      ['--quick-link-bg-hover' as const]:
                                        quickLinkThemes.website.fillBg,
                                      ['--quick-link-fg-hover' as const]:
                                        quickLinkThemes.website.fillFg,
                                      ['--quick-link-border-hover' as const]:
                                        quickLinkThemes.website.fillBorder,
                                      ['--quick-link-icon-color' as const]:
                                        quickLinkThemes.website.icon,
                                      ['--quick-link-icon-color-hover' as const]:
                                        quickLinkThemes.website.fillIcon
                                    } as React.CSSProperties
                                  }
                                  onClick={() => window.open(website)}
                                >
                                  <Icon icon="globe" />
                                  <span>Website</span>
                                </div>
                              )}
                              {youtubeUrl && (
                                <div
                                  className={quickLinkClass}
                                  style={
                                    {
                                      ['--quick-link-bg' as const]:
                                        quickLinkThemes.youtube.background,
                                      ['--quick-link-fg' as const]:
                                        quickLinkThemes.youtube.text,
                                      ['--quick-link-shadow' as const]:
                                        quickLinkThemes.youtube.shadow,
                                      ['--quick-link-border' as const]:
                                        quickLinkThemes.youtube.border,
                                      ['--quick-link-bg-hover' as const]:
                                        quickLinkThemes.youtube.fillBg,
                                      ['--quick-link-fg-hover' as const]:
                                        quickLinkThemes.youtube.fillFg,
                                      ['--quick-link-border-hover' as const]:
                                        quickLinkThemes.youtube.fillBorder,
                                      ['--quick-link-icon-color' as const]:
                                        quickLinkThemes.youtube.icon,
                                      ['--quick-link-icon-color-hover' as const]:
                                        quickLinkThemes.youtube.fillIcon
                                    } as React.CSSProperties
                                  }
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
                                  <Button
                                    onClick={() => setProfilePicModalShown(true)}
                                    className={cx(
                                      actionButtonClass,
                                      actionButtonFlexLargeClass
                                    )}
                                    color="logoBlue"
                                    hoverColor="mediumBlue"
                                    variant="solid"
                                    tone="raised"
                                    uppercase={false}
                                  >
                                    <Icon icon="camera" />
                                    <span>{changePicLabel}</span>
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      if (banned?.posting) {
                                        return;
                                      }
                                      setBioEditModalShown(true);
                                    }}
                                    className={cx(
                                      actionButtonClass,
                                      actionButtonFlexMediumClass
                                    )}
                                    variant="solid"
                                    tone="raised"
                                    color="purple"
                                    hoverColor="mediumPurple"
                                    uppercase={false}
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
                                      className={cx(
                                        actionButtonClass,
                                        messageButtonClass,
                                        actionButtonFullWidthClass
                                      )}
                                      iconColor="rgba(255,255,255,0.92)"
                                      textColor="rgba(255,255,255,0.95)"
                                      buttonColor="orange"
                                      buttonHoverColor="mediumOrange"
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
                                  className={cx(
                                    actionButtonClass,
                                    profileButtonClass,
                                    actionButtonFlexMediumClass
                                  )}
                                  variant="solid"
                                  tone="raised"
                                  color="logoBlue"
                                  hoverColor="mediumBlue"
                                  uppercase={false}
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
                                  <span>{profileLabel}</span>
                                </Button>
                                <Button
                                  className={cx(
                                    actionButtonClass,
                                    cardsButtonClass,
                                    actionButtonFlexMediumClass
                                  )}
                                  variant="solid"
                                  tone="raised"
                                  color="purple"
                                  hoverColor="mediumPurple"
                                  uppercase={false}
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
                                  <span>{cardsLabel}</span>
                                </Button>
                                <Button
                                  className={cx(
                                    actionButtonClass,
                                    chatButtonClass,
                                    actionButtonFlexMediumClass
                                  )}
                                  variant="solid"
                                  tone="raised"
                                  color="green"
                                  hoverColor="lightGreen"
                                  uppercase={false}
                                  loading={chatLoading}
                                  disabled={chatLoading || !profileUsername}
                                  onClick={handleTalkClick}
                                >
                                  <Icon
                                    icon="comments"
                                    color="rgba(255,255,255,0.92)"
                                  />
                                  <span>{chatLabel}</span>
                                </Button>
                                <MessagesButton
                                  className={cx(
                                    actionButtonClass,
                                    messageButtonClass,
                                    actionButtonFullWidthClass
                                  )}
                                  commentsShown={commentsShown}
                                  loading={loadingComments}
                                  profileId={profileId}
                                  myId={userId}
                                  onMessagesButtonClick={onMessagesButtonClick}
                                  numMessages={numMessages}
                                  iconColor="rgba(255,255,255,0.92)"
                                  textColor="rgba(255,255,255,0.95)"
                                  buttonColor="orange"
                                  buttonHoverColor="mediumOrange"
                                  buttonVariant="solid"
                                  buttonTone="raised"
                                />
                              </div>
                            )}
                            {lastActive &&
                              !isOnline &&
                              profileId !== userId && (
                                <div
                                  className={css`
                                    margin-top: 1rem;
                                    font-size: 1.5rem;
                                    color: ${Color.gray()};
                                    @media (max-width: ${tabletMaxWidth}) {
                                      text-align: center;
                                    }
                                  `}
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
                            firstLine={replaceFakeAtSymbol(
                              profileFirstRow || ''
                            )}
                            secondLine={replaceFakeAtSymbol(
                              profileSecondRow || ''
                            )}
                            thirdLine={replaceFakeAtSymbol(
                              profileThirdRow || ''
                            )}
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
                        {profilePicModalShown && (
                          <ProfilePicModal
                            currentPicUrl={
                              profilePicUrl
                                ? `${cloudFrontURL}${profilePicUrl}`
                                : undefined
                            }
                            onHide={() => setProfilePicModalShown(false)}
                            onSelectImage={(selectedImageUri) => {
                              setProfilePicModalShown(false);
                              setImageUri(selectedImageUri);
                              setImageEditModalShown(true);
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
                        theme={themeName}
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
                <div className={rankBarWrapperClass}>
                  <ScopedTheme theme={themeName as any}>
                    <RankBar profile={profile} />
                  </ScopedTheme>
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

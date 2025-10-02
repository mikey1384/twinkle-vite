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
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { timeSince } from '~/helpers/timeStampHelpers';
import { useContentState, useLazyLoad } from '~/helpers/hooks';
import { returnTheme } from '~/helpers';
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

const chatLabel = localize('chat2');
const changePicLabel = localize('changePic');
const editBioLabel = localize('editBio');
const imageTooLarge10MBLabel = localize('imageTooLarge10MB');
const lastOnlineLabel = localize('lastOnline');
const pleaseSelectSmallerImageLabel = localize('pleaseSelectSmallerImage');
const profileLabel = localize('Profile');
const cardsLabel = 'Cards';

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
  const {
    profilePanel: { color: profilePanelColor }
  } = useMemo(() => returnTheme(profileTheme || 'logoBlue'), [profileTheme]);

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
          <div
            ref={PanelRef}
            className={css`
              content-visibility: auto;
              contain-intrinsic-size: 600px;
              background: #fff;
              width: 100%;
              line-height: 2.3rem;
              font-size: 1.5rem;
              position: relative;
            `}
          >
            <div
              className={`unselectable ${css`
                background: ${Color[profilePanelColor]()};
                border-top-right-radius: ${borderRadius};
                border-top-left-radius: ${borderRadius};
                border-bottom: none;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                @media (max-width: ${mobileMaxWidth}) {
                  border-radius: 0;
                  border-left: none;
                  border-right: none;
                }
              `}`}
              style={{ minHeight: '2.5rem', padding: '0.7rem' }}
            >
              <AchievementBadges
                thumbSize="2.5rem"
                unlockedAchievementIds={profile.unlockedAchievementIds}
              />
            </div>
            <div
              className={css`
                display: flex;
                flex-direction: column;
                padding: 1rem;
                border: ${Color.borderGray()} 1px solid;
                ${twinkleXP
                  ? 'border-bottom: none;'
                  : `
                  border-bottom-left-radius: ${borderRadius};
                  border-bottom-right-radius: ${borderRadius};
                `};
                border-top: none;
                @media (max-width: ${mobileMaxWidth}) {
                  border-radius: 0;
                  border-left: none;
                  border-right: none;
                }
              `}
            >
              {profileLoaded ? (
                <div
                  style={{
                    display: 'flex',
                    height: '100%',
                    marginTop: '1rem'
                  }}
                >
                  <div
                    style={{
                      width: '20rem',
                      display: 'flex',
                      alignItems: 'center',
                      flexDirection: 'column'
                    }}
                  >
                    <div
                      className="unselectable"
                      style={{ width: 'CALC(100% - 2rem)' }}
                    >
                      <Link
                        onClick={handleReloadProfile}
                        to={`/users/${profileName}`}
                      >
                        <div>
                          <ProfilePic
                            style={{
                              width: '100%',
                              cursor: 'pointer'
                            }}
                            userId={profileId}
                            profilePicUrl={profilePicUrl}
                            online={isOnline}
                            isBusy={isBusy}
                            isAway={isAway}
                            statusShown
                            large
                            statusSize="medium"
                          />
                        </div>
                      </Link>
                    </div>
                    <div
                      className={css`
                        font-family: 'Poppins', sans-serif;
                        font-weight: bold;
                        gap: 0.5rem;
                        display: flex;
                        justify-content: center;
                        flex-direction: column;
                        align-items: center;
                        margin-top: 2rem;
                      `}
                    >
                      <div
                        className={css`
                          color: #2c8cdb;
                          cursor: pointer;
                          transition: transform 0.3s ease;

                          &:hover {
                            transform: translateY(-2px);
                          }
                        `}
                        onClick={() =>
                          navigate(
                            `/ai-cards/?search[owner]=${profile.username}`
                          )
                        }
                      >
                        <Icon icon="cards-blank" />
                        <span style={{ marginLeft: '0.7rem' }}>AI Cards</span>
                      </div>
                      {website && (
                        <div
                          className={css`
                            color: ${Color.green()};
                            cursor: pointer;
                            transition: transform 0.3s ease;

                            &:hover {
                              transform: translateY(-2px);
                            }
                          `}
                          onClick={() => window.open(website)}
                        >
                          <Icon icon="globe" />
                          <span style={{ marginLeft: '0.7rem' }}>Website</span>
                        </div>
                      )}
                      {youtubeUrl && (
                        <div
                          className={css`
                            color: #e64959;
                            cursor: pointer;
                            transition: transform 0.3s ease;

                            &:hover {
                              transform: translateY(-2px);
                            }
                          `}
                          onClick={() => window.open(youtubeUrl)}
                        >
                          <Icon icon={['fab', 'youtube']} />
                          <span style={{ marginLeft: '0.7rem' }}>YouTube</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      marginLeft: '2rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      width: 'CALC(100% - 19rem)'
                    }}
                  >
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
                      <div
                        style={{
                          marginTop: '1rem',
                          zIndex: 1,
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        <div style={{ display: 'flex' }}>
                          <UploadButton
                            skeuomorphic={false}
                            onFileSelect={handlePicture}
                            accept="image/*"
                            icon="upload"
                            color="black"
                            transparent
                            text={changePicLabel}
                          />
                          <Button
                            transparent
                            onClick={() => {
                              if (banned?.posting) {
                                return;
                              }
                              setBioEditModalShown(true);
                            }}
                            style={{ marginLeft: '0.5rem' }}
                          >
                            {editBioLabel}
                          </Button>
                          {profileId === userId && (
                            <MessagesButton
                              commentsShown={commentsShown}
                              loading={loadingComments}
                              profileId={profileId}
                              myId={userId}
                              onMessagesButtonClick={onMessagesButtonClick}
                              numMessages={numMessages}
                              style={{ marginLeft: '1rem' }}
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
                        <Link
                          className={`${actionButtonClass} ${profileButtonClass}`}
                          style={{
                            flex: '1 1 9rem',
                            pointerEvents: profileUsername ? 'auto' : 'none',
                            opacity: profileUsername ? 1 : 0.55,
                            background: `linear-gradient(135deg, ${Color.logoBlue()} 0%, ${Color.skyBlue()} 100%)`,
                            color: '#fff',
                            boxShadow: `0 16px 30px -18px ${Color.logoBlue(0.65)}`
                          }}
                          to={
                            profileUsername
                              ? `/users/${profileUsername}`
                              : '#'
                          }
                        >
                          <Icon icon="user" color="rgba(255,255,255,0.92)" />
                          <span>{profileLabel}</span>
                        </Link>
                        <Link
                          className={`${actionButtonClass} ${cardsButtonClass}`}
                          style={{
                            flex: '1 1 9rem',
                            pointerEvents: profileUsername ? 'auto' : 'none',
                            opacity: profileUsername ? 1 : 0.55,
                            background: `linear-gradient(135deg, ${Color.purple()} 0%, ${Color.lightPurple()} 100%)`,
                            color: '#fff',
                            boxShadow: `0 16px 30px -18px ${Color.purple(0.6)}`
                          }}
                          to={
                            profileUsername
                              ? `/ai-cards/?search[owner]=${profileUsername}`
                              : '#'
                          }
                        >
                          <Icon
                            icon="cards-blank"
                            color="rgba(255,255,255,0.92)"
                          />
                          <span>{cardsLabel}</span>
                        </Link>
                        <button
                          type="button"
                          className={`${actionButtonClass} ${chatButtonClass}`}
                          style={{
                            flex: '1 1 9rem',
                            background: `linear-gradient(135deg, ${Color.green()} 0%, ${Color.limeGreen()} 100%)`,
                            color: '#fff',
                            boxShadow: `0 16px 30px -18px ${Color.green(0.55)}`
                          }}
                          onClick={handleTalkClick}
                          disabled={chatLoading || !profileUsername}
                        >
                          {chatLoading ? (
                            <Icon
                              icon="spinner"
                              pulse
                              color="rgba(255,255,255,0.9)"
                            />
                          ) : (
                            <Icon
                              icon="comments"
                              color="rgba(255,255,255,0.92)"
                            />
                          )}
                          <span>{chatLabel}</span>
                        </button>
                        <MessagesButton
                          variant="action"
                          className={`${actionButtonClass} ${messageButtonClass}`}
                          style={{
                            flex: '1 1 9rem',
                            background: `linear-gradient(135deg, ${Color.orange()} 0%, ${Color.lightOrange()} 100%)`,
                            color: '#fff',
                            boxShadow: `0 16px 30px -18px ${Color.orange(0.5)}`
                          }}
                          loading={loadingComments}
                          commentsShown={commentsShown}
                          profileId={profileId}
                          myId={userId}
                          onMessagesButtonClick={onMessagesButtonClick}
                          numMessages={numMessages}
                          iconColor="rgba(255,255,255,0.92)"
                          textColor="rgba(255,255,255,0.95)"
                        />
                      </div>
                    )}
                    {lastActive &&
                      !isOnline &&
                      profileId !== userId && (
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
                  {bioEditModalShown && (
                    <BioEditModal
                      firstLine={replaceFakeAtSymbol(profileFirstRow || '')}
                      secondLine={replaceFakeAtSymbol(profileSecondRow || '')}
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
                </div>
              ) : (
                <Loading />
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
                  style={{ marginTop: '1rem' }}
                  userId={userId}
                />
              )}
            </div>
            {!!twinkleXP && profileLoaded && <RankBar profile={profile} />}
            {alertModalShown && (
              <AlertModal
                title={imageTooLarge10MBLabel}
                content={pleaseSelectSmallerImageLabel}
                onHide={() => setAlertModalShown(false)}
              />
            )}
          </div>
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

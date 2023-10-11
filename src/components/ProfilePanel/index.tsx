import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import ProfilePic from '~/components/ProfilePic';
import Button from '~/components/Button';
import ImageEditModal from '~/components/Modals/ImageEditModal';
import BioEditModal from '~/components/Modals/BioEditModal';
import AlertModal from '~/components/Modals/AlertModal';
import RankBar from '~/components/RankBar';
import Icon from '~/components/Icon';
import Comments from '~/components/Comments';
import Link from '~/components/Link';
import UserDetails from '~/components/UserDetails';
import Loading from '~/components/Loading';
import UserTitle from '~/components/Texts/UserTitle';
import AchievementBadges from './AchievementBadges';
import { useNavigate } from 'react-router-dom';
import { MAX_PROFILE_PIC_SIZE } from '~/constants/defaultValues';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { timeSince } from '~/helpers/timeStampHelpers';
import { useContentState, useLazyLoad, useTheme } from '~/helpers/hooks';
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
const viewProfileLabel = localize('viewProfile');
const visitWebsiteLabel = localize('visitWebsite');
const visitYoutubeLabel = localize('visitYoutube');

ProfilePanel.propTypes = {
  expandable: PropTypes.bool,
  profileId: PropTypes.number.isRequired,
  style: PropTypes.object
};
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
  const profile = useAppContext((v) => v.user.state.userObj[profileId] || {});

  const {
    comments = [],
    commentsLoaded,
    commentsLoadMoreButton,
    commentsShown,
    visible: previousVisible,
    placeholderHeight: previousPlaceholderHeight,
    previewLoaded
  } = profilePanelState;

  const {
    lastActive,
    level,
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
  const onSetPlaceholderHeight = useContentContext(
    (v) => v.actions.onSetPlaceholderHeight
  );
  const onSetVisible = useContentContext((v) => v.actions.onSetVisible);

  const [ComponentRef, inView] = useInView({
    rootMargin: '50px 0px 0px 0px',
    threshold: 0
  });
  const PanelRef = useRef(null);
  const ContainerRef = useRef(null);
  const visibleRef = useRef(previousVisible);
  const [visible, setVisible] = useState(previousVisible);
  const [placeholderHeight, setPlaceholderHeight] = useState(
    previousPlaceholderHeight
  );
  const placeholderHeightRef = useRef(previousPlaceholderHeight);
  useLazyLoad({
    PanelRef,
    inView,
    onSetPlaceholderHeight: (height: number) => {
      setPlaceholderHeight(height);
      placeholderHeightRef.current = height;
    },
    onSetVisible: (visible: boolean) => {
      setVisible(visible);
      visibleRef.current = visible;
    },
    delay: 1000
  });

  useEffect(() => {
    return function cleanUp() {
      onSetPlaceholderHeight({
        contentType: 'user',
        contentId: profileId,
        height: placeholderHeightRef.current
      });
      onSetVisible({
        contentType: 'user',
        contentId: profileId,
        visible: visibleRef.current
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDMChannel = useAppContext((v) => v.requestHelpers.loadDMChannel);
  const loadComments = useAppContext((v) => v.requestHelpers.loadComments);
  const loadProfile = useAppContext((v) => v.requestHelpers.loadProfile);
  const uploadBio = useAppContext((v) => v.requestHelpers.uploadBio);
  const onResetProfile = useProfileContext((v) => v.actions.onResetProfile);

  const { userId, username, banned } = useKeyContext((v) => v.myState);
  const {
    profilePanel: { color: profilePanelColor },
    coverText: { color: coverTextColor, shadow: coverTextShadowColor }
  } = useTheme(profileTheme || 'logoBlue');

  const [bioEditModalShown, setBioEditModalShown] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [imageUri, setImageUri] = useState<any>(null);
  const [imageEditModalShown, setImageEditModalShown] = useState(false);
  const [mouseEnteredProfile, setMouseEnteredProfile] = useState(false);
  const [alertModalShown, setAlertModalShown] = useState(false);
  const CommentInputAreaRef: React.RefObject<any> = useRef(null);
  const FileInputRef: React.RefObject<any> = useRef(null);
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
  const heightNotSet = useMemo(
    () => !placeholderHeight && !previousPlaceholderHeight,
    [placeholderHeight, previousPlaceholderHeight]
  );
  const contentShown = useMemo(
    () => !profileLoaded || heightNotSet || visible || inView,
    [heightNotSet, inView, profileLoaded, visible]
  );

  return (
    <div style={style} ref={ComponentRef} key={profileId}>
      <div
        ref={ContainerRef}
        style={{
          width: '100%',
          height: contentShown ? 'auto' : placeholderHeight || '15rem'
        }}
      >
        {contentShown && (
          <div
            ref={PanelRef}
            className={`unselectable ${css`
              background: #fff;
              width: 100%;
              line-height: 2.3rem;
              font-size: 1.5rem;
              position: relative;
            `}`}
          >
            <div
              className={css`
                background: ${Color[profilePanelColor]()};
                min-height: 2.5rem;
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
              `}
              style={{ padding: level > 1 ? '0.5rem' : '' }}
            >
              <UserTitle
                user={profile}
                style={{
                  display: 'inline',
                  fontSize: '2.2rem',
                  color: Color[coverTextColor](),
                  textShadow: coverTextShadowColor
                    ? `1px 1px ${Color[coverTextShadowColor]()}`
                    : 'none'
                }}
              />
              <AchievementBadges
                style={{ marginTop: '0.7rem' }}
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
                  style={{ display: 'flex', height: '100%', marginTop: '1rem' }}
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
                      style={{ width: 'CALC(100% - 2rem)' }}
                      onMouseEnter={() => setMouseEnteredProfile(true)}
                      onMouseLeave={() => setMouseEnteredProfile(false)}
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
                            online={chatStatus[profile.id]?.isOnline}
                            statusShown
                            large
                          />
                        </div>
                      </Link>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginTop: '1.5rem'
                      }}
                    >
                      <Button
                        color="orange"
                        transparent
                        style={{
                          color: mouseEnteredProfile ? Color.orange() : '',
                          padding: '0.5rem'
                        }}
                        onClick={() => navigate(`/users/${profileName}`)}
                      >
                        {viewProfileLabel}
                      </Button>
                    </div>
                    {youtubeUrl && (
                      <Button
                        color="red"
                        transparent
                        style={{ padding: '0.5rem' }}
                        onClick={() => window.open(youtubeUrl)}
                      >
                        {visitYoutubeLabel}
                      </Button>
                    )}
                    {website && (
                      <Button
                        color="blue"
                        transparent
                        style={{ padding: '0.5rem' }}
                        onClick={() => window.open(website)}
                      >
                        {visitWebsiteLabel}
                      </Button>
                    )}
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
                        onSetUserState({ userId: data.userId, newState: data });
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
                          <Button
                            transparent
                            onClick={onChangeProfilePictureClick}
                          >
                            {changePicLabel}
                          </Button>
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
                          {profileId === userId && comments.length > 0 && (
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
                        style={{
                          marginTop: noBio ? '2rem' : '1rem',
                          display: 'flex'
                        }}
                      >
                        <Button
                          loading={chatLoading}
                          color="green"
                          onClick={handleTalkClick}
                        >
                          <Icon icon="comments" />
                          <span style={{ marginLeft: '0.7rem' }}>
                            {chatLabel}
                          </span>
                        </Button>
                        <MessagesButton
                          loading={loadingComments}
                          commentsShown={commentsShown}
                          profileId={profileId}
                          myId={userId}
                          onMessagesButtonClick={onMessagesButtonClick}
                          numMessages={numMessages}
                          style={{ marginLeft: '1rem' }}
                        />
                      </div>
                    )}
                    {lastActive &&
                      !chatStatus[profile.id]?.isOnline &&
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
                  <input
                    ref={FileInputRef}
                    style={{ display: 'none' }}
                    type="file"
                    onChange={handlePicture}
                    accept="image/*"
                  />
                  {bioEditModalShown && (
                    <BioEditModal
                      firstLine={profileFirstRow}
                      secondLine={profileSecondRow}
                      thirdLine={profileThirdRow}
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
                  inputTypeLabel={`message to ${profileName}`}
                  isLoading={loadingComments}
                  loadMoreButton={commentsLoadMoreButton}
                  noInput={profileId === userId}
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
            {!!twinkleXP && <RankBar profile={profile} />}
            {alertModalShown && (
              <AlertModal
                title={imageTooLarge10MBLabel}
                content={pleaseSelectSmallerImageLabel}
                onHide={() => setAlertModalShown(false)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );

  function handleImageEditDone({ filePath }: { filePath: string }) {
    onSetUserState({
      userId,
      newState: { profilePicUrl: `/profile/${filePath}` }
    });
    setImageEditModalShown(false);
  }

  function handlePicture(event: any) {
    const reader = new FileReader();
    const file = event.target.files[0];
    if (file.size / 1000 > MAX_PROFILE_PIC_SIZE) {
      return setAlertModalShown(true);
    }
    reader.onload = (upload) => {
      setImageEditModalShown(true);
      setImageUri(upload.target?.result);
    };
    reader.readAsDataURL(file);
    event.target.value = null;
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

  function onChangeProfilePictureClick() {
    FileInputRef.current.click();
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
    const data = await uploadBio({
      ...params,
      profileId
    });
    onSetUserState({ userId: data.userId, newState: data.bio });
    setBioEditModalShown(false);
  }
}

export default memo(ProfilePanel);

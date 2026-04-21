import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { placeholderHeights } from '~/constants/state';
import { useContentState, useLazyLoad } from '~/helpers/hooks';
import { useInView } from 'react-intersection-observer';
import {
  useAppContext,
  useChatContext,
  useContentContext,
  useKeyContext,
  useProfileContext
} from '~/contexts';
import { ThemeName } from '~/theme';
import { useThemedCardVars } from '~/theme/useThemedCardVars';
import Content from './Content';

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
    profileTheme
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
  const previousPlaceholderHeight = useMemo(
    () => placeholderHeights[`profile-${profileId}`],
    [profileId]
  );
  const [placeholderHeight, setPlaceholderHeight] = useState(
    previousPlaceholderHeight
  );
  const placeholderHeightRef = useRef(previousPlaceholderHeight);
  const isVisible = useLazyLoad({
    id: `profile-${profileId}`,
    inView,
    PanelRef,
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
  const panelContainerStyle = useMemo(
    () =>
      ({
        ...panelStyleVars,
        ...(commentsShown
          ? ({
              contentVisibility: 'visible',
              containIntrinsicSize: 'auto'
            } as React.CSSProperties)
          : {})
      } as React.CSSProperties),
    [commentsShown, panelStyleVars]
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
  const componentHeight = useMemo(
    () => placeholderHeight || '15rem',
    [placeholderHeight]
  );

  return (
    <div style={style} ref={ComponentRef} key={profileId}>
      <div style={{ width: '100%' }}>
        <div style={{ width: '100%' }} ref={PanelRef}>
          {contentShown ? (
            <Content
              alertModalShown={alertModalShown}
              banned={banned}
              bioEditModalShown={bioEditModalShown}
              canEdit={canEdit}
              chatLoading={chatLoading}
              commentInputAreaRef={CommentInputAreaRef}
              commentParent={{
                ...profile,
                ...profilePanelState,
                contentType: 'user'
              }}
              comments={comments}
              commentsLoadMoreButton={commentsLoadMoreButton}
              commentsShown={commentsShown}
              expandable={expandable}
              imageEditModalShown={imageEditModalShown}
              imageUri={imageUri}
              isAway={isAway}
              isBusy={isBusy}
              isOnline={isOnline}
              lastActive={lastActive}
              loadingComments={loadingComments}
              noBio={noBio}
              numMessages={numMessages}
              onDeleteComment={onDeleteComment}
              onEditComment={onEditComment}
              onEditRewardComment={onEditRewardComment}
              onExpandComments={onExpandComments}
              onHideAlert={() => setAlertModalShown(false)}
              onHideBioEditModal={() => setBioEditModalShown(false)}
              onHideImageEditModal={handleHideImageEditModal}
              onHideProfilePicModal={() => setProfilePicModalShown(false)}
              onImageEditDone={handleImageEditDone}
              onLikeComment={onLikeComment}
              onLoadMoreComments={onLoadMoreComments}
              onLoadMoreReplies={onLoadMoreReplies}
              onLoadRepliesOfReply={onLoadRepliesOfReply}
              onMessagesButtonClick={onMessagesButtonClick}
              onOpenBioEditModal={() => setBioEditModalShown(true)}
              onOpenCards={handleCardsClick}
              onOpenProfile={handleProfileClick}
              onOpenProfilePicModal={() => setProfilePicModalShown(true)}
              onReloadProfile={handleReloadProfile}
              onRemoveStatusMsg={handleRemoveStatusMsg}
              onSelectProfileImage={handleProfilePicSelect}
              onSubmitBio={handleUploadBio}
              onTalkClick={handleTalkClick}
              onUpdateStatusMsg={handleUpdateStatusMsg}
              onUploadComment={onUploadComment}
              onUploadReply={onUploadReply}
              panelContainerStyle={panelContainerStyle}
              profile={profile}
              profileFirstRow={profileFirstRow}
              profileId={profileId}
              profileLoaded={profileLoaded}
              profileName={profileName}
              profilePicModalShown={profilePicModalShown}
              profilePicUrl={profilePicUrl}
              profileSecondRow={profileSecondRow}
              profileThirdRow={profileThirdRow}
              profileUsername={profileUsername}
              themeName={themeName}
              twinkleXP={twinkleXP}
              userId={userId}
            />
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

  function handleHideImageEditModal() {
    setImageUri(null);
    setImageEditModalShown(false);
  }

  function handleProfilePicSelect(selectedImageUri: any) {
    setProfilePicModalShown(false);
    setImageUri(selectedImageUri);
    setImageEditModalShown(true);
  }

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

  function handleRemoveStatusMsg(userId: number) {
    onSetUserState({
      userId,
      newState: { statusMsg: '', statusColor: '' }
    });
  }

  function handleUpdateStatusMsg(data: any) {
    if (banned?.posting) {
      return;
    }
    onSetUserState({
      userId: data.userId,
      newState: data
    });
  }

  function handleProfileClick() {
    if (profileUsername) {
      navigate(`/users/${profileUsername}`);
    }
  }

  function handleCardsClick() {
    if (profileUsername) {
      navigate(`/ai-cards/?search[owner]=${profileUsername}`);
    }
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
    if (profileId !== userId) {
      CommentInputAreaRef.current?.focus?.();
    }
  }

  async function handleUploadBio(params: object) {
    const data = await uploadBio(params);
    onSetUserState({ userId: data.userId, newState: data.bio });
    setBioEditModalShown(false);
  }
}

export default memo(ProfilePanel);

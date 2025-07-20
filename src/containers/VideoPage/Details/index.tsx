import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback
} from 'react';
import DropdownButton from '~/components/Buttons/DropdownButton';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import XPRewardInterface from '~/components/XPRewardInterface';
import RewardButton from '~/components/Buttons/RewardButton';
import AlreadyPosted from '~/components/AlreadyPosted';
import BasicInfos from './BasicInfos';
import SideButtons from './SideButtons';
import Description from './Description';
import RecommendationInterface from '~/components/RecommendationInterface';
import RecommendationStatus from '~/components/RecommendationStatus';
import TagStatus from '~/components/TagStatus';
import ErrorBoundary from '~/components/ErrorBoundary';
import {
  isMobile,
  determineUserCanRewardThis,
  determineXpButtonDisabled,
  textIsOverflown
} from '~/helpers';
import { Color, mobileMaxWidth } from '~/constants/css';
import {
  addCommasToNumber,
  addEmoji,
  exceedsCharLimit,
  stringIsEmpty,
  finalizeEmoji,
  isValidYoutubeUrl,
  replaceFakeAtSymbol
} from '~/helpers/stringHelpers';
import { useContentState, useMyLevel } from '~/helpers/hooks';
import {
  useContentContext,
  useExploreContext,
  useInputContext,
  useKeyContext
} from '~/contexts';
import { css } from '@emotion/css';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import localize from '~/constants/localize';

const deleteLabel = localize('delete');
const editLabel = localize('edit');
const editOrDeleteLabel = localize('editOrDelete');
const deviceIsMobile = isMobile(navigator);

export default function Details({
  addTags,
  byUser,
  changeByUserStatus,
  changingPage,
  content,
  rewardLevel,
  userId,
  uploader,
  title,
  description = '',
  likes,
  recommendations,
  onDelete,
  onEditFinish,
  tags = [],
  onSetRewardLevel,
  rewards = [],
  timeStamp,
  videoId,
  videoViews
}: {
  addTags: (tags: string[]) => void;
  changeByUserStatus: (status: string) => void;
  byUser: boolean;
  changingPage: boolean;
  content: string;
  description: string;
  rewardLevel: number;
  likes: any[];
  recommendations: any[];
  onDelete: () => void;
  onEditFinish: (params: any) => void;
  tags: string[];
  onSetRewardLevel: (level: number) => void;
  rewards: any[];
  timeStamp: number;
  title: string;
  uploader: any;
  userId: number;
  videoId: number;
  videoViews: number;
}) {
  const rewardColor = useKeyContext((v) => v.theme.reward.color);
  const banned = useKeyContext((v) => v.myState.banned);
  const myLevel = useKeyContext((v) => v.myState.level);
  const twinkleCoins = useKeyContext((v) => v.myState.twinkleCoins);

  const { canDelete, canEdit, canEditPlaylists, canReward } = useMyLevel();

  const onSetIsEditing = useContentContext((v) => v.actions.onSetIsEditing);
  const onSetXpRewardInterfaceShown = useContentContext(
    (v) => v.actions.onSetXpRewardInterfaceShown
  );
  const editState = useInputContext((v) => v.state['edit' + 'video' + videoId]);
  const onSetEditForm = useInputContext((v) => v.actions.onSetEditForm);
  const onLikeVideo = useExploreContext((v) => v.actions.onLikeVideo);

  const { isEditing, xpRewardInterfaceShown } = useContentState({
    contentType: 'video',
    contentId: videoId
  });

  const [recommendationInterfaceShown, setRecommendationInterfaceShown] =
    useState(false);
  const [titleHovered, setTitleHovered] = useState(false);

  const titleRef = useRef<HTMLDivElement>(null);
  const rewardInterfaceRef = useRef<HTMLDivElement>(null);

  const defaultUrl = useMemo(
    () => `https://www.youtube.com/watch?v=${content}`,
    [content]
  );

  const {
    editedTitle: prevEditedTitle = title,
    editedDescription: prevEditedDescription = description,
    editedUrl: prevEditedUrl = defaultUrl
  } = editState || {};

  const [editedTitle, setEditedTitle] = useState(prevEditedTitle);
  const [editedDescription, setEditedDescription] = useState(
    prevEditedDescription
  );
  const [editedUrl, setEditedUrl] = useState(prevEditedUrl);

  const userIsUploader = useMemo(
    () => uploader?.id === userId,
    [uploader?.id, userId]
  );

  const isRecommendedByUser = useMemo(
    () => recommendations.some((rec) => rec.userId === userId),
    [recommendations, userId]
  );

  const isRewardedByUser = useMemo(
    () => rewards.some((reward) => reward.rewarderId === userId),
    [rewards, userId]
  );

  const editButtonShown = useMemo(() => {
    const userCanEditThis = (canEdit || canDelete) && myLevel > uploader?.level;
    return userIsUploader || userCanEditThis;
  }, [canEdit, canDelete, myLevel, uploader?.level, userIsUploader]);

  const userCanRewardThis = useMemo(
    () =>
      determineUserCanRewardThis({
        userLevel: myLevel,
        canReward,
        recommendations,
        uploader,
        userId
      }),
    [myLevel, canReward, recommendations, uploader, userId]
  );

  const rewardButtonShown = useMemo(
    () => !isEditing && userCanRewardThis,
    [isEditing, userCanRewardThis]
  );

  const xpButtonDisabled = useMemo(
    () =>
      determineXpButtonDisabled({
        rewardLevel: byUser ? 5 : 0,
        myId: userId,
        xpRewardInterfaceShown,
        rewards
      }),
    [byUser, rewards, userId, xpRewardInterfaceShown]
  );

  const editMenuItems = useMemo(() => {
    const items = [];
    if (userIsUploader || canEdit) {
      items.push({
        label: (
          <>
            <Icon icon="pencil-alt" />
            <span style={{ marginLeft: '1rem' }}>{editLabel}</span>
          </>
        ),
        onClick: () =>
          onSetIsEditing({
            contentId: videoId,
            contentType: 'video',
            isEditing: true
          })
      });
    }
    if (userIsUploader || canDelete) {
      items.push({
        label: (
          <>
            <Icon icon="trash-alt" />
            <span style={{ marginLeft: '1rem' }}>{deleteLabel}</span>
          </>
        ),
        onClick: onDelete
      });
    }
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canDelete, canEdit, userIsUploader, videoId]);

  const viewsLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return <>조회수 {addCommasToNumber(videoViews)}회</>;
    }
    return (
      <>
        {addCommasToNumber(videoViews)} view{videoViews !== 1 ? 's' : ''}
      </>
    );
  }, [videoViews]);

  const descriptionExceedsCharLimit = useCallback(
    (text: string) =>
      exceedsCharLimit({
        contentType: 'video',
        inputType: 'description',
        text
      }),
    []
  );

  const titleExceedsCharLimit = useCallback(
    (text: string) =>
      exceedsCharLimit({
        contentType: 'video',
        inputType: 'title',
        text
      }),
    []
  );

  const urlExceedsCharLimit = useCallback(
    (text: string) =>
      exceedsCharLimit({
        contentType: 'video',
        inputType: 'url',
        text
      }),
    []
  );

  const determineEditButtonDoneStatus = useCallback(() => {
    const urlIsInvalid = !isValidYoutubeUrl(editedUrl);
    const titleIsEmpty = stringIsEmpty(editedTitle);
    const titleChanged = editedTitle !== title;
    const urlChanged = editedUrl !== defaultUrl;
    const descriptionChanged = editedDescription !== description;
    if (urlIsInvalid || titleIsEmpty) return true;
    if (!titleChanged && !descriptionChanged && !urlChanged) return true;
    if (urlExceedsCharLimit(editedUrl)) return true;
    if (titleExceedsCharLimit(editedTitle)) return true;
    if (descriptionExceedsCharLimit(editedDescription)) return true;
    return false;
  }, [
    editedUrl,
    editedTitle,
    editedDescription,
    title,
    defaultUrl,
    description,
    urlExceedsCharLimit,
    titleExceedsCharLimit,
    descriptionExceedsCharLimit
  ]);

  const handleTitleChange = useCallback((text: string) => {
    setEditedTitle(text);
  }, []);

  const handleUrlChange = useCallback((text: string) => {
    setEditedUrl(text.trim());
  }, []);

  useEffect(() => {
    if (!editState) {
      onSetEditForm({
        contentId: videoId,
        contentType: 'video',
        form: {
          editedDescription: replaceFakeAtSymbol(description),
          editedTitle: title,
          editedUrl: defaultUrl
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editState, videoId, description, title, defaultUrl]);

  useEffect(() => {
    const shouldShow =
      xpRewardInterfaceShown &&
      canReward &&
      myLevel > uploader?.level &&
      !userIsUploader;
    if (xpRewardInterfaceShown !== shouldShow) {
      onSetXpRewardInterfaceShown({
        contentId: videoId,
        contentType: 'video',
        shown: shouldShow
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canReward, myLevel, uploader?.level, userIsUploader, videoId]);

  useEffect(() => {
    return () => {
      onSetEditForm({
        contentId: videoId,
        contentType: 'video',
        form: {
          editedDescription,
          editedTitle,
          editedUrl
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editedDescription, editedTitle, editedUrl, videoId]);

  return (
    <ErrorBoundary componentPath="VideoPage/Details">
      <div style={{ width: '100%' }}>
        <AlreadyPosted
          changingPage={changingPage}
          style={{ marginBottom: '1rem' }}
          contentId={Number(videoId)}
          contentType="video"
          url={content}
          uploaderId={uploader?.id}
          videoCode={content}
        />
        <TagStatus
          style={{ fontSize: '1.5rem' }}
          onAddTags={addTags}
          tags={tags}
          contentId={Number(videoId)}
        />
        <div style={{ padding: '0 1rem 1rem 1rem', width: '100%' }}>
          <div
            style={{ display: 'flex', flexDirection: 'column', width: '100%' }}
          >
            <div
              style={{
                display: 'flex',
                width: '100%',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '1.5rem'
              }}
            >
              <BasicInfos
                className={css`
                  width: calc(100% - 25rem);
                  @media (max-width: ${mobileMaxWidth}) {
                    width: calc(100% - ${canReward ? '15rem' : '12rem'});
                  }
                `}
                style={{
                  marginRight: '1rem',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                editedUrl={editedUrl}
                editedTitle={editedTitle}
                onTitleChange={handleTitleChange}
                innerRef={titleRef}
                onTitleKeyUp={handleTitleKeyUp}
                onUrlChange={handleUrlChange}
                onEdit={isEditing}
                onMouseLeave={() => setTitleHovered(false)}
                onMouseOver={handleMouseOver}
                onTitleClick={handleTitleClick}
                title={title}
                titleExceedsCharLimit={titleExceedsCharLimit}
                titleHovered={titleHovered}
                timeStamp={timeStamp}
                uploader={uploader}
                urlExceedsCharLimit={urlExceedsCharLimit}
              />
              <SideButtons
                className={css`
                  width: 25rem;
                  @media (max-width: ${mobileMaxWidth}) {
                    width: ${canReward ? '15rem' : '12rem'};
                  }
                `}
                style={{
                  marginTop: canEditPlaylists ? 0 : '1rem',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                byUser={byUser}
                changeByUserStatus={changeByUserStatus}
                rewardLevel={rewardLevel}
                likes={likes}
                onLikeVideo={handleLikeVideo}
                onSetRewardLevel={onSetRewardLevel}
                uploader={uploader}
                userId={userId}
                videoId={videoId}
              />
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
              marginTop: '1rem',
              position: 'relative'
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%'
              }}
            >
              <Description
                onChange={(event) => setEditedDescription(event.target.value)}
                onEdit={isEditing}
                onEditCancel={handleEditCancel}
                onEditFinish={handleEditFinish}
                onKeyUp={handleDescriptionKeyUp}
                description={description}
                editedDescription={editedDescription}
                descriptionExceedsCharLimit={descriptionExceedsCharLimit}
                determineEditButtonDoneStatus={determineEditButtonDoneStatus}
              />
              {!isEditing && videoViews > 10 && (
                <div
                  style={{
                    padding: '1rem 0',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: Color.darkerGray()
                  }}
                >
                  {viewsLabel}
                </div>
              )}
              <div style={{ display: 'flex', marginTop: '1rem' }}>
                {editButtonShown && !isEditing && (
                  <DropdownButton
                    skeuomorphic
                    icon="pencil-alt"
                    color="darkerGray"
                    style={{ marginRight: '1rem' }}
                    text={editOrDeleteLabel}
                    menuProps={editMenuItems}
                  />
                )}
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: 0, right: 0 }}>
              <div style={{ display: 'flex' }}>
                {rewardButtonShown && (
                  <RewardButton
                    skeuomorphic
                    contentId={videoId}
                    contentType="video"
                    disableReason={xpButtonDisabled}
                  />
                )}
                <Button
                  color={rewardColor}
                  style={{ marginLeft: '1rem' }}
                  skeuomorphic
                  filled={isRecommendedByUser}
                  disabled={recommendationInterfaceShown}
                  onClick={() => setRecommendationInterfaceShown(true)}
                >
                  <Icon icon="heart" />
                </Button>
              </div>
            </div>
          </div>
          <RecommendationStatus
            style={{
              marginTop: '1rem',
              marginBottom: 0,
              marginLeft: '-1rem',
              marginRight: '-1rem'
            }}
            contentType="video"
            recommendations={recommendations}
          />
          {recommendationInterfaceShown && (
            <div
              style={{
                marginTop: '1rem',
                fontSize: '1.7rem',
                marginBottom: 0,
                marginLeft: '-1rem',
                marginRight: '-1rem'
              }}
            >
              <RecommendationInterface
                contentId={videoId}
                contentType="video"
                onHide={() => setRecommendationInterfaceShown(false)}
                recommendations={recommendations}
                rewardLevel={byUser ? 5 : 0}
                content={description}
                uploaderId={uploader?.id}
              />
            </div>
          )}
          {xpRewardInterfaceShown && (
            <XPRewardInterface
              innerRef={rewardInterfaceRef}
              rewardLevel={byUser ? 5 : 0}
              rewards={rewards}
              contentType="video"
              contentId={Number(videoId)}
              noPadding
              onReward={() =>
                setRecommendationInterfaceShown(
                  !isRecommendedByUser && twinkleCoins > 0
                )
              }
              uploaderLevel={uploader?.level}
              uploaderId={uploader?.id}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );

  function handleEditCancel() {
    onSetEditForm({
      contentId: videoId,
      contentType: 'video',
      editForm: undefined
    });
    onSetIsEditing({
      contentId: videoId,
      contentType: 'video',
      isEditing: false
    });
  }

  async function handleEditFinish() {
    if (banned?.posting) return;
    try {
      const params = {
        contentId: videoId,
        contentType: 'video',
        editedUrl,
        videoId,
        editedTitle: finalizeEmoji(editedTitle),
        editedDescription: finalizeEmoji(editedDescription)
      };
      await onEditFinish(params);
    } catch (error) {
      console.error('Error in handleEditFinish:', error);
    } finally {
      onSetEditForm({
        contentId: videoId,
        contentType: 'video',
        editForm: undefined
      });
      onSetIsEditing({
        contentId: videoId,
        contentType: 'video',
        isEditing: false
      });
    }
  }

  function handleLikeVideo({
    likes: newLikes,
    isUnlike
  }: {
    likes: any[];
    isUnlike: boolean;
  }) {
    onLikeVideo({ likes: newLikes });
    if (!xpButtonDisabled && userCanRewardThis && !isRewardedByUser) {
      onSetXpRewardInterfaceShown({
        contentId: videoId,
        contentType: 'video',
        shown: !isUnlike
      });
    } else if (!isRecommendedByUser && !canReward) {
      setRecommendationInterfaceShown(!isUnlike);
    }
  }

  function handleMouseOver() {
    const titleElement = titleRef.current;
    if (!deviceIsMobile && titleElement && textIsOverflown(titleElement)) {
      setTitleHovered(true);
    }
  }

  function handleTitleClick() {
    const currentTitleRef = titleRef.current;
    if (currentTitleRef && textIsOverflown(currentTitleRef)) {
      setTitleHovered((prev) => !prev);
    }
  }

  function handleTitleKeyUp(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === ' ') {
      const target = event.target as HTMLInputElement;
      handleTitleChange(addEmoji(target.value));
    }
  }

  function handleDescriptionKeyUp(
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (event.key === ' ') {
      const target = event.target as HTMLTextAreaElement;
      setEditedDescription(addEmoji(target.value));
    }
  }
}

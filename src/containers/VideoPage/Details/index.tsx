import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
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

Details.propTypes = {
  addTags: PropTypes.func.isRequired,
  changeByUserStatus: PropTypes.func.isRequired,
  byUser: PropTypes.bool,
  changingPage: PropTypes.bool,
  content: PropTypes.string.isRequired,
  description: PropTypes.string,
  rewardLevel: PropTypes.number,
  likes: PropTypes.array.isRequired,
  onDelete: PropTypes.func.isRequired,
  onEditFinish: PropTypes.func.isRequired,
  onSetRewardLevel: PropTypes.func.isRequired,
  recommendations: PropTypes.array.isRequired,
  tags: PropTypes.array,
  rewards: PropTypes.array,
  timeStamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  title: PropTypes.string.isRequired,
  uploader: PropTypes.object.isRequired,
  userId: PropTypes.number,
  videoId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  videoViews: PropTypes.number.isRequired
};

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
  description,
  likes,
  recommendations,
  onDelete,
  onEditFinish,
  tags = [],
  onSetRewardLevel,
  rewards,
  timeStamp,
  videoId,
  videoViews
}: {
  addTags: (tags: string[]) => void;
  byUser: boolean;
  changeByUserStatus: (v: any) => void;
  changingPage: boolean;
  content: string;
  description: string;
  rewardLevel: number;
  likes: any[];
  onDelete: () => void;
  onEditFinish: (v: any) => void;
  onSetRewardLevel: (v: any) => void;
  recommendations: any[];
  tags: string[];
  rewards: any[];
  timeStamp: number;
  title: string;
  uploader: { id: number; username: string; level: number };
  userId: number;
  videoId: number;
  videoViews: number;
}) {
  const {
    reward: { color: rewardColor }
  } = useKeyContext((v) => v.theme);
  const { banned, level, twinkleCoins } = useKeyContext((v) => v.myState);

  const { canDelete, canEdit, canEditPlaylists, canReward } = useMyLevel();

  const onSetIsEditing = useContentContext((v) => v.actions.onSetIsEditing);
  const onSetXpRewardInterfaceShown = useContentContext(
    (v) => v.actions.onSetXpRewardInterfaceShown
  );
  const inputState = useInputContext((v) => v.state);
  const onSetEditForm = useInputContext((v) => v.actions.onSetEditForm);
  const onLikeVideo = useExploreContext((v) => v.actions.onLikeVideo);

  const { isEditing, xpRewardInterfaceShown } = useContentState({
    contentType: 'video',
    contentId: videoId
  });

  const [recommendationInterfaceShown, setRecommendationInterfaceShown] =
    useState(false);

  const [titleHovered, setTitleHovered] = useState(false);

  const TitleRef: React.RefObject<any> = useRef(null);
  const RewardInterfaceRef = useRef(null);

  const editState = useMemo(
    () => inputState['edit' + 'video' + videoId],
    [inputState, videoId]
  );

  useEffect(() => {
    if (!editState) {
      onSetEditForm({
        contentId: videoId,
        contentType: 'video',
        form: {
          editedDescription: replaceFakeAtSymbol(description || ''),
          editedTitle: title || '',
          editedUrl: `https://www.youtube.com/watch?v=${content}`
        }
      });
    }

    const shouldShow =
      xpRewardInterfaceShown &&
      canReward &&
      level > uploader?.level &&
      !userIsUploader;
    if (xpRewardInterfaceShown !== shouldShow) {
      onSetXpRewardInterfaceShown({
        contentId: videoId,
        contentType: 'video',
        shown: shouldShow
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editState, title, description, content, xpRewardInterfaceShown, userId]);

  const userIsUploader = useMemo(
    () => uploader?.id === userId,
    [uploader?.id, userId]
  );

  const isRecommendedByUser = useMemo(() => {
    return recommendations.some(
      (recommendation) => recommendation.userId === userId
    );
  }, [recommendations, userId]);

  const isRewardedByUser = useMemo(() => {
    return rewards.some((reward) => reward.rewarderId === userId);
  }, [rewards, userId]);

  const {
    editedTitle: prevEditedTitle = '',
    editedDescription: prevEditedDescription = '',
    editedUrl: prevEditedUrl = ''
  } = editState || {};

  const [editedTitle, setEditedTitle] = useState(prevEditedTitle || title);
  const editedTitleRef = useRef(editedTitle);

  const [editedDescription, setEditedDescription] = useState(
    prevEditedDescription || description
  );
  const editedDescriptionRef = useRef(editedDescription);

  const [editedUrl, setEditedUrl] = useState(
    prevEditedUrl || `https://www.youtube.com/watch?v=${content}`
  );
  const editedUrlRef = useRef(editedUrl);

  useEffect(() => {
    handleTitleChange(prevEditedTitle || title);
  }, [prevEditedTitle, title]);

  useEffect(() => {
    handleDescriptionChange(prevEditedDescription || description);
  }, [prevEditedDescription, description]);

  useEffect(() => {
    handleUrlChange(
      prevEditedUrl || `https://www.youtube.com/watch?v=${content}`
    );
  }, [prevEditedUrl, content]);

  const editButtonShown = useMemo(() => {
    const userCanEditThis = (canEdit || canDelete) && level > uploader?.level;
    return userIsUploader || userCanEditThis;
  }, [uploader?.level, canEdit, canDelete, level, userIsUploader]);

  const userCanRewardThis = useMemo(
    () =>
      determineUserCanRewardThis({
        userLevel: level,
        canReward,
        recommendations,
        uploader,
        userId
      }),
    [level, canReward, recommendations, uploader, userId]
  );

  const rewardButtonShown = useMemo(() => {
    return !isEditing && userCanRewardThis;
  }, [isEditing, userCanRewardThis]);

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
        onClick: handleEditStart
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

    function handleEditStart() {
      onSetIsEditing({
        contentId: videoId,
        contentType: 'video',
        isEditing: true
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canDelete, canEdit, userIsUploader, videoId]);

  useEffect(() => {
    return function onUnmount() {
      onSetEditForm({
        contentId: videoId,
        contentType: 'video',
        form: {
          editedDescription: editedDescriptionRef.current,
          editedTitle: editedTitleRef.current,
          editedUrl: editedUrlRef.current
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const viewsLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return <>조회수 {addCommasToNumber(videoViews)}회</>;
    }
    return (
      <>
        {addCommasToNumber(videoViews)} view
        {`${videoViews > 1 ? 's' : ''}`}
      </>
    );
  }, [videoViews]);

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
        <div
          style={{
            padding: '0 1rem 1rem 1rem',
            width: '100%'
          }}
        >
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
                  width: CALC(100% - 25rem);
                  @media (max-width: ${mobileMaxWidth}) {
                    width: CALC(100% - ${canReward ? '15rem' : '12rem'});
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
                innerRef={TitleRef}
                onTitleKeyUp={(event: any) => {
                  if (event.key === ' ') {
                    handleTitleChange(addEmoji(event.target.value));
                  }
                }}
                onUrlChange={handleUrlChange}
                onEdit={isEditing}
                onMouseLeave={() => setTitleHovered(false)}
                onMouseOver={onMouseOver}
                onTitleClick={() => {
                  if (textIsOverflown(TitleRef.current)) {
                    setTitleHovered((titleHovered) => !titleHovered);
                  }
                }}
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
                onChange={(event) =>
                  handleDescriptionChange(event.target.value)
                }
                onEdit={isEditing}
                onEditCancel={handleEditCancel}
                onEditFinish={handleEditFinish}
                onKeyUp={(event) => {
                  if (event.key === ' ') {
                    handleDescriptionChange(addEmoji(event.target.value));
                  }
                }}
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
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0
              }}
            >
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
          <div
            style={{
              marginTop: '1rem',
              fontSize: '1.7rem',
              marginBottom: 0,
              marginLeft: '-1rem',
              marginRight: '-1rem',
              display: recommendationInterfaceShown ? 'block' : 'none'
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

          <div
            style={{
              display: xpRewardInterfaceShown ? 'block' : 'none'
            }}
          >
            <XPRewardInterface
              innerRef={RewardInterfaceRef}
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
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );

  function determineEditButtonDoneStatus() {
    const urlIsInvalid = !isValidYoutubeUrl(editedUrl);
    const titleIsEmpty = stringIsEmpty(editedTitle);
    const titleChanged = editedTitle !== title;
    const urlChanged =
      editedUrl !== `https://www.youtube.com/watch?v=${content}`;
    const descriptionChanged = editedDescription !== description;
    if (urlIsInvalid) return true;
    if (titleIsEmpty) return true;
    if (!titleChanged && !descriptionChanged && !urlChanged) return true;
    if (urlExceedsCharLimit(editedUrl)) return true;
    if (titleExceedsCharLimit(editedTitle)) return true;
    if (descriptionExceedsCharLimit(editedDescription)) return true;
    return false;
  }

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
    try {
      if (banned?.posting) {
        return;
      }
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
    likes,
    isUnlike
  }: {
    likes: number;
    isUnlike: boolean;
  }) {
    onLikeVideo({ likes });
    if (!xpButtonDisabled && userCanRewardThis && !isRewardedByUser) {
      onSetXpRewardInterfaceShown({
        contentId: videoId,
        contentType: 'video',
        shown: !isUnlike
      });
    } else {
      if (!isRecommendedByUser && !canReward) {
        setRecommendationInterfaceShown(!isUnlike);
      }
    }
  }

  function handleTitleChange(text: string) {
    setEditedTitle(text);
    editedTitleRef.current = text;
  }

  function handleDescriptionChange(text: string) {
    setEditedDescription(text);
    editedDescriptionRef.current = text;
  }

  function handleUrlChange(text: string) {
    setEditedUrl(text.trim());
    editedUrlRef.current = text;
  }

  function onMouseOver() {
    if (!deviceIsMobile && textIsOverflown(TitleRef.current)) {
      setTitleHovered(true);
    }
  }

  function descriptionExceedsCharLimit(descText: string) {
    return exceedsCharLimit({
      contentType: 'video',
      inputType: 'description',
      text: descText
    });
  }

  function titleExceedsCharLimit(titleText: string) {
    return exceedsCharLimit({
      contentType: 'video',
      inputType: 'title',
      text: titleText
    });
  }

  function urlExceedsCharLimit(urlText: string) {
    return exceedsCharLimit({
      contentType: 'video',
      inputType: 'url',
      text: urlText
    });
  }
}

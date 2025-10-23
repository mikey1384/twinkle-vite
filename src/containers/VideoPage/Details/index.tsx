import React, { useEffect, useMemo, useRef, useState } from 'react';
import DropdownButton from '~/components/Buttons/DropdownButton';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import XPRewardInterface from '~/components/XPRewardInterface';
import RewardButton from '~/components/Buttons/RewardButton';
import AlreadyPosted from '~/components/AlreadyPosted';
import BasicInfos from './BasicInfos';
import LikeButton from '~/components/Buttons/LikeButton';
import StarButton from '~/components/Buttons/StarButton';
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
import { Color, mobileMaxWidth, borderRadius } from '~/constants/css';
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
import { useRoleColor } from '~/theme/useRoleColor';

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
  const { colorKey: rewardColor } = useRoleColor('reward', {
    fallback: 'pink'
  });
  const banned = useKeyContext((v) => v.myState.banned);
  const level = useKeyContext((v) => v.myState.level);
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

  const TitleRef: React.RefObject<any> = useRef(null);
  const RewardInterfaceRef = useRef(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editState, title, description, content]);

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
    return userCanRewardThis;
  }, [userCanRewardThis]);

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
        <div style={{ width: '100%' }}>
          <div
            className={css`
              display: grid;
              grid-template-columns: minmax(0, 3fr) minmax(220px, 1fr);
              grid-auto-rows: auto;
              column-gap: 1.25rem;
              row-gap: 1rem;
              width: 100%;
              margin-top: 1rem;
              background: #fff;
              border-radius: ${borderRadius};
              padding: 1.25rem;
              @media (max-width: ${mobileMaxWidth}) {
                grid-template-columns: 1fr;
                padding: 1rem;
              }
            `}
          >
            <div
              className={css`
                grid-column: 1 / -1;
              `}
            >
              <BasicInfos
                style={{
                  marginRight: 0,
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
            </div>
            {/* Left column: Description */}
            <div
              className={css`
                grid-column: 1;
              `}
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
            </div>
            {/* Right column: Actions stack */}
            <aside
              className={css`
                grid-column: 2;
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                row-gap: 0.75rem;
                @media (max-width: ${mobileMaxWidth}) {
                  align-items: flex-start;
                }
              `}
            >
              {/* Row 1: Like + Reward */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <LikeButton
                  contentType="video"
                  contentId={Number(videoId)}
                  likes={likes}
                  filled
                  style={{ fontSize: '1.8rem' }}
                  onClick={handleLikeVideo}
                />
                {rewardButtonShown && (
                  <div style={{ marginLeft: '1rem' }}>
                    <RewardButton
                      contentId={videoId}
                      contentType="video"
                      disableReason={xpButtonDisabled}
                    />
                  </div>
                )}
              </div>
              {/* Row 2: Star + Heart */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Button
                  color={rewardColor}
                  style={{}}
                  variant="soft"
                  tone="raised"
                  filled={isRecommendedByUser}
                  disabled={recommendationInterfaceShown}
                  onClick={() => setRecommendationInterfaceShown(true)}
                >
                  <Icon icon="heart" />
                </Button>
                <div
                  style={{
                    position: 'relative',
                    width: '3.6rem',
                    height: '3.6rem',
                    marginLeft: '1rem'
                  }}
                >
                  <StarButton
                    byUser={!!byUser}
                    contentId={Number(videoId)}
                    style={{ position: 'absolute', top: 0, left: 0 }}
                    contentType="video"
                    rewardLevel={rewardLevel}
                    onSetRewardLevel={onSetRewardLevel}
                    onToggleByUser={handleToggleByUser}
                    uploader={uploader}
                  />
                </div>
              </div>
              {/* Row 3: Views */}
              {videoViews > 10 && (
                <div
                  style={{
                    paddingTop: '0.25rem',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: Color.darkerGray(),
                    textAlign: 'right'
                  }}
                >
                  {viewsLabel}
                </div>
              )}
              {/* Row 4: Edit/Delete */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {editButtonShown && !isEditing && (
                  <DropdownButton
                    variant="solid"
                    tone="raised"
                    icon="pencil-alt"
                    color="darkerGray"
                    style={{}}
                    text={editOrDeleteLabel}
                    menuProps={editMenuItems}
                  />
                )}
              </div>
            </aside>
          </div>

          <RecommendationStatus
            style={{
              marginTop: '1rem',
              marginBottom: 0
            }}
            contentType="video"
            recommendations={recommendations}
          />
          <div
            style={{
              marginTop: '1rem',
              fontSize: '1.7rem',
              marginBottom: 0,
              display: recommendationInterfaceShown ? 'block' : 'none'
            }}
          >
            <RecommendationInterface
              key={`recommendation-interface-${videoId}`}
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
              key={`xp-reward-interface-${videoId}`}
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

  function handleToggleByUser(byUser: boolean) {
    changeByUserStatus({ byUser, contentId: videoId, contentType: 'video' });
  }

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

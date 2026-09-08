import React, { memo, useMemo, useRef, useState } from 'react';
import UsernameText from '~/components/Texts/UsernameText';
import Button from '~/components/Button';
import moment from 'moment';
import RichText from '~/components/Texts/RichText';
import Icon from '~/components/Icon';
import TopicSettingsModal from '../TopicSettingsModal';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import { useAppContext, useKeyContext, useChatContext } from '~/contexts';
import { socket } from '~/constants/sockets/api';
import { useNavigate } from 'react-router-dom';
import {
  chatTopicRowClass,
  chatTopicTitleClass,
  chatTopicMetadataClass,
  chatTopicActionsClass,
  chatTopicActionStyle,
  chatTopicThemeStyle
} from '../topicStyles';

function TopicItem({
  channelId,
  currentTopicId,
  displayedThemeColor,
  hideCurrentLabel = false,
  hideFeatureButton = false,
  onSelectTopic,
  id,
  isFeatured,
  isTwoPeopleChat = false,
  isAIChannel,
  isOwner,
  onEditTopic = () => {},
  onDeleteTopic = () => {},
  pinnedTopicIds,
  content,
  userId,
  username,
  timeStamp,
  settings,
  style,
  pathId
}: {
  channelId: number;
  currentTopicId: number;
  displayedThemeColor: string;
  hideCurrentLabel?: boolean;
  hideFeatureButton?: boolean;
  onSelectTopic: (id: number) => void;
  id: number;
  isFeatured: boolean;
  isTwoPeopleChat?: boolean;
  isAIChannel: boolean;
  isOwner: boolean;
  onEditTopic?: ({
    topicText,
    isOwnerPostingOnly,
    customInstructions,
    isSharedWithOtherUsers
  }: {
    topicText: string;
    isOwnerPostingOnly: boolean;
    customInstructions?: string;
    isSharedWithOtherUsers?: boolean;
  }) => void;
  onDeleteTopic?: (id: number) => void;
  pinnedTopicIds: number[];
  content: string;
  userId: number;
  username: string;
  timeStamp: number;
  settings: {
    customInstructions?: string;
    isOwnerPostingOnly?: boolean;
    isSharedWithOtherUsers?: boolean;
  };
  style?: React.CSSProperties;
  pathId: string;
}) {
  const navigate = useNavigate();
  const myId = useKeyContext((v) => v.myState.userId);
  const updateFeaturedTopic = useAppContext(
    (v) => v.requestHelpers.updateFeaturedTopic
  );
  const deleteTopic = useAppContext((v) => v.requestHelpers.deleteTopic);
  const loadChatChannel = useAppContext(
    (v) => v.requestHelpers.loadChatChannel
  );
  const isOwnerPostingOnly = settings?.isOwnerPostingOnly || false;
  const customInstructions = settings?.customInstructions || '';
  const isSharedWithOtherUsers = settings?.isSharedWithOtherUsers || false;
  const pinChatTopic = useAppContext((v) => v.requestHelpers.pinChatTopic);
  const onFeatureTopic = useChatContext((v) => v.actions.onFeatureTopic);
  const onEnterChannelWithId = useChatContext(
    (v) => v.actions.onEnterChannelWithId
  );
  const onPinTopic = useChatContext((v) => v.actions.onPinTopic);
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);
  const [selectButtonDisabled, setSelectButtonDisabled] = useState(false);
  const [deleteConfirmShown, setDeleteConfirmShown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [pendingAction, setPendingAction] = useState<'pin' | 'feature' | null>(null);
  const [actionError, setActionError] = useState('');
  const actionPendingRef = useRef(false);
  const SubjectTitleRef: React.RefObject<any> = useRef(0);

  const pinButtonShown = useMemo(() => {
    return (pinnedTopicIds || []).length < 5;
  }, [pinnedTopicIds]);

  const displayedTime = useMemo(
    () => moment.unix(timeStamp).format('lll'),
    [timeStamp]
  );

  const isBasicallyOwner = useMemo(() => {
    return isOwner || isAIChannel;
  }, [isAIChannel, isOwner]);

  const canEditTopic = useMemo(() => {
    if (isBasicallyOwner) {
      return true;
    }
    if (isTwoPeopleChat && Number(userId) === Number(myId)) {
      return true;
    }
  }, [isBasicallyOwner, isTwoPeopleChat, myId, userId]);

  const canDeleteHumanTopic = useMemo(() => {
    return !isAIChannel && (isOwner || Number(userId) === Number(myId));
  }, [isAIChannel, isOwner, myId, userId]);

  const directDeleteButtonShown = useMemo(() => {
    return canDeleteHumanTopic && !canEditTopic;
  }, [canDeleteHumanTopic, canEditTopic]);

  const isPinned = useMemo(
    () => (pinnedTopicIds || []).includes(id),
    [pinnedTopicIds, id]
  );

  return (
    <article
      data-chat-topic-row="topic"
      data-current={currentTopicId === id}
      style={{ ...chatTopicThemeStyle(displayedThemeColor), ...style }}
      className={chatTopicRowClass}
    >
      <div
        style={{
          minWidth: 0,
          whiteSpace: 'pre-wrap',
          overflowWrap: 'break-word',
          wordBreak: 'break-word'
        }}
      >
        <div ref={SubjectTitleRef}>
          {currentTopicId === id && !hideCurrentLabel && (
            <b
              style={{
                fontSize: '14px',
                color: '#334155'
              }}
            >
              Current:{' '}
            </b>
          )}
          <RichText className={chatTopicTitleClass} style={{ fontWeight: 600 }}>
            {content}
          </RichText>
          <div className={chatTopicMetadataClass}>
            <UsernameText
              color="#526176"
              textStyle={{ fontSize: '14px', fontWeight: 600 }}
              user={{
                id: userId,
                username: username
              }}
            />
            <small>{displayedTime}</small>
          </div>
        </div>
      </div>
      <div data-chat-topic-actions className={chatTopicActionsClass}>
        {canEditTopic && (
          <Button
            aria-label="Topic settings"
            color="pink"
            style={chatTopicActionStyle}
            variant="soft"
            onClick={() => setIsEditing(true)}
            disabled={selectButtonDisabled || !!pendingAction}
          >
            <Icon icon="sliders-h" />
            {(!isFeatured || !isBasicallyOwner || hideFeatureButton) &&
              currentTopicId === id && (
                <span style={{ marginLeft: '0.7rem' }}>Settings</span>
              )}
          </Button>
        )}
        {isBasicallyOwner &&
          !hideFeatureButton &&
          (isPinned || pinButtonShown) && (
            <Button
              aria-label={isPinned ? 'Unpin topic' : 'Pin topic'}
              aria-pressed={isPinned}
              color="blue"
              style={{ ...chatTopicActionStyle, color: isPinned ? '#fff' : '#334155' }}
              variant={isPinned ? 'solid' : 'soft'}
              onClick={handlePinTopic}
              disabled={selectButtonDisabled || !!pendingAction}
              loading={pendingAction === 'pin'}
            >
              <Icon icon="thumb-tack" />
            </Button>
          )}
        {isBasicallyOwner && !hideFeatureButton && (
          <Button
            aria-label={isFeatured ? 'Featured topic' : 'Feature topic'}
            color="gold"
            style={chatTopicActionStyle}
            disabledOpacity={1}
            variant="soft"
            disabled={isFeatured || selectButtonDisabled || !!pendingAction}
            loading={pendingAction === 'feature'}
            onClick={handleUpdateFeaturedTopic}
          >
            {isFeatured ? <span>Featured</span> : <Icon icon="star" />}
          </Button>
        )}
        {directDeleteButtonShown && (
          <Button
            aria-label="Delete topic"
            color="red"
            style={chatTopicActionStyle}
            variant="soft"
            onClick={() => setDeleteConfirmShown(true)}
            disabled={selectButtonDisabled || !!pendingAction}
          >
            <Icon icon="trash-alt" />
          </Button>
        )}
        {currentTopicId !== id && (
          <Button
            aria-label="Open topic"
            color="green"
            style={chatTopicActionStyle}
            variant="soft"
            onClick={handleSelectTopic}
            disabled={selectButtonDisabled || !!pendingAction}
          >
            <Icon icon="play" />
            {(!(isFeatured && isBasicallyOwner) || hideFeatureButton) && (
              <span style={{ marginLeft: '0.7rem' }}>Go</span>
            )}
          </Button>
        )}
      </div>
      {actionError && (
        <p role="alert" style={{ gridColumn: '1 / -1', margin: 0, fontSize: '14px', color: '#b42318' }}>
          {actionError}
        </p>
      )}
      {isEditing && (
        <TopicSettingsModal
          channelId={channelId}
          displayedThemeColor={displayedThemeColor}
          topicId={id}
          isOwnerPostingOnly={isOwnerPostingOnly}
          customInstructions={customInstructions}
          isTwoPeopleChat={isTwoPeopleChat}
          isAIChannel={isAIChannel}
          onHide={() => setIsEditing(false)}
          topicText={content}
          onEditTopic={onEditTopic}
          canDeleteTopic={canDeleteHumanTopic}
          currentTopicId={currentTopicId}
          onDeleteTopic={() => onDeleteTopic(id)}
          isSharedWithOtherUsers={isSharedWithOtherUsers}
          pathId={pathId}
        />
      )}
      {deleteConfirmShown && (
        <ConfirmModal
          modalOverModal
          onHide={() => setDeleteConfirmShown(false)}
          title="Delete Topic"
          descriptionFontSize="1.7rem"
          description="Remove this topic?"
          onConfirm={handleDeleteTopic}
        />
      )}
    </article>
  );

  async function handleUpdateFeaturedTopic() {
    if (isFeatured || actionPendingRef.current) return;
    actionPendingRef.current = true;
    setPendingAction('feature');
    setActionError('');
    try {
      const result = await updateFeaturedTopic({ topicId: id, channelId });
      if (result.isSuccess) {
        onFeatureTopic({ channelId, topic: result.topic });
      } else {
        setActionError("Couldn't feature this topic. Please try again.");
      }
    } catch (error) {
      console.error(error);
      setActionError("Couldn't feature this topic. Please try again.");
    } finally {
      actionPendingRef.current = false;
      setPendingAction(null);
    }
  }

  async function handlePinTopic() {
    if (actionPendingRef.current) return;
    actionPendingRef.current = true;
    setPendingAction('pin');
    setActionError('');
    try {
      const pinnedTopicIds = await pinChatTopic({ topicId: id, channelId });
      onPinTopic({ channelId, topicId: id, pinnedTopicIds });
      socket.emit('pin_topic', { channelId });
    } catch (error) {
      console.error(error);
      setActionError("Couldn't update this topic's pin. Please try again.");
    } finally {
      actionPendingRef.current = false;
      setPendingAction(null);
    }
  }

  function handleSelectTopic() {
    setSelectButtonDisabled(true);
    onSelectTopic(id);
  }

  async function handleDeleteTopic() {
    try {
      setSelectButtonDisabled(true);
      await deleteTopic({ topicId: id, channelId });
      const data = await loadChatChannel({
        channelId,
        hydrateMessages: true,
        fromWriter: true
      });
      onEnterChannelWithId({ data, userId: myId });
      const canonicalChannel = data?.channel || {};
      const deletedTopicIsActive = Number(currentTopicId) === Number(id);
      onSetChannelState({
        channelId,
        newState: {
          featuredTopicId: canonicalChannel.featuredTopicId || null,
          lastTopicId: canonicalChannel.lastTopicId || null,
          pinnedTopicIds: canonicalChannel.pinnedTopicIds || [],
          topicObj: canonicalChannel.topicObj || {},
          ...(deletedTopicIsActive
            ? {
                selectedTab: 'all',
                selectedTopicId: null,
                topicHistory: [],
                currentTopicIndex: -1
              }
            : {})
        }
      });
      if (deletedTopicIsActive) {
        navigate(`/chat/${pathId}`);
      }
      onDeleteTopic(id);
      setDeleteConfirmShown(false);
    } catch (error) {
      console.error(error);
    } finally {
      setSelectButtonDisabled(false);
    }
  }
}

export default memo(TopicItem);

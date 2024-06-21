import React, { memo, useMemo, useRef, useState } from 'react';
import UsernameText from '~/components/Texts/UsernameText';
import Button from '~/components/Button';
import moment from 'moment';
import RichText from '~/components/Texts/RichText';
import Icon from '~/components/Icon';
import EditModal from './EditModal';
import { useAppContext, useKeyContext, useChatContext } from '~/contexts';
import { socket } from '~/constants/io';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';

function TopicItem({
  channelId,
  currentTopicId,
  displayedThemeColor,
  hideCurrentLabel = false,
  hideFeatureButton = false,
  onSelectTopic,
  id,
  isFeatured,
  isTwoPeopleChat,
  isOwner,
  onEditTopic,
  pinnedTopicIds,
  content,
  userId,
  username,
  timeStamp,
  style
}: {
  channelId: number;
  currentTopicId: number;
  displayedThemeColor: string;
  hideCurrentLabel?: boolean;
  hideFeatureButton?: boolean;
  onSelectTopic: (id: number) => void;
  id: number;
  isFeatured: boolean;
  isTwoPeopleChat: boolean;
  isOwner: boolean;
  onEditTopic: (text: string) => void;
  pinnedTopicIds: number[];
  content: string;
  userId: number;
  username: string;
  timeStamp: number;
  style?: React.CSSProperties;
}) {
  const { userId: myId } = useKeyContext((v) => v.myState);
  const updateFeaturedTopic = useAppContext(
    (v) => v.requestHelpers.updateFeaturedTopic
  );
  const pinChatTopic = useAppContext((v) => v.requestHelpers.pinChatTopic);
  const onFeatureTopic = useChatContext((v) => v.actions.onFeatureTopic);
  const onPinTopic = useChatContext((v) => v.actions.onPinTopic);
  const [selectButtonDisabled, setSelectButtonDisabled] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const SubjectTitleRef: React.RefObject<any> = useRef(0);

  const pinButtonShown = useMemo(() => {
    return pinnedTopicIds.length < 5;
  }, [pinnedTopicIds]);

  const displayedTime = useMemo(
    () => moment.unix(timeStamp).format('lll'),
    [timeStamp]
  );

  const canEditTopic = useMemo(() => {
    if (isOwner) {
      return true;
    }
    if (isTwoPeopleChat && userId === myId) {
      return true;
    }
  }, [isOwner, isTwoPeopleChat, myId, userId]);

  const isPinned = useMemo(
    () => pinnedTopicIds.includes(id),
    [pinnedTopicIds, id]
  );

  return (
    <div
      style={{
        display: 'flex',
        height: 'auto',
        alignItems: 'center',
        width: '100%',
        ...style
      }}
      className={css`
        padding: 0 1rem;
        &:hover {
          background-color: ${Color.highlightGray()};
        }
      `}
    >
      <div
        style={{
          width: '100%',
          whiteSpace: 'pre-wrap',
          overflowWrap: 'break-word',
          wordBreak: 'break-word'
        }}
      >
        <div ref={SubjectTitleRef}>
          {currentTopicId === id && !hideCurrentLabel && (
            <b
              style={{
                fontSize: '1.5rem',
                color: Color[displayedThemeColor]()
              }}
            >
              Current:{' '}
            </b>
          )}
          <RichText style={{ fontWeight: 'bold' }}>{content}</RichText>
          <div>
            <UsernameText
              color={Color.darkerGray()}
              user={{
                id: userId,
                username: username
              }}
            />{' '}
            <small>{displayedTime}</small>
          </div>
        </div>
      </div>
      {canEditTopic && (
        <Button
          color="pink"
          style={{
            maxHeight: '3.5rem'
          }}
          filled
          opacity={0.5}
          onClick={() => setIsEditing(true)}
          disabled={selectButtonDisabled}
        >
          <Icon icon="sliders-h" />
          {(!isFeatured || !isOwner || hideFeatureButton) &&
            currentTopicId === id && (
              <span style={{ marginLeft: '0.7rem' }}>Settings</span>
            )}
        </Button>
      )}
      {isOwner &&
        !hideFeatureButton &&
        !isFeatured &&
        (isPinned || pinButtonShown) && (
          <Button
            color="blue"
            style={{
              maxHeight: '3.5rem',
              marginLeft: canEditTopic ? '0.5rem' : 0
            }}
            filled
            opacity={isPinned ? 1 : 0.5}
            onClick={handlePinTopic}
            disabled={selectButtonDisabled}
          >
            <Icon icon="thumb-tack" />
          </Button>
        )}
      {isOwner && !hideFeatureButton && (
        <Button
          color="gold"
          style={{
            maxHeight: '3.5rem',
            marginLeft: '0.5rem'
          }}
          disabledOpacity={1}
          filled
          disabled={isFeatured}
          opacity={0.5}
          onClick={handleUpdateFeaturedTopic}
        >
          {isFeatured ? <span>Featured</span> : <Icon icon="star" />}
        </Button>
      )}
      {currentTopicId !== id && (
        <Button
          color="green"
          style={{ maxHeight: '3.5rem', marginLeft: '0.5rem' }}
          filled
          opacity={0.5}
          onClick={handleSelectTopic}
          disabled={selectButtonDisabled}
        >
          <Icon icon="play" />
          {(!isFeatured || hideFeatureButton) && (
            <span style={{ marginLeft: '0.7rem' }}>Go</span>
          )}
        </Button>
      )}
      {isEditing && (
        <EditModal
          channelId={channelId}
          topicId={id}
          onHide={() => setIsEditing(false)}
          topicText={content}
          onEditTopic={onEditTopic}
        />
      )}
    </div>
  );

  async function handleUpdateFeaturedTopic() {
    if (isFeatured) {
      return;
    }
    const isSuccess = await updateFeaturedTopic({ topicId: id, channelId });
    if (isSuccess) {
      const topic = { id, content, timeStamp, userId, username };
      socket.emit('feature_topic', { channelId, topic });
      onFeatureTopic({
        channelId,
        topic
      });
    }
  }

  async function handlePinTopic() {
    const pinnedTopicIds = await pinChatTopic({ topicId: id, channelId });
    onPinTopic({ channelId, topicId: id, pinnedTopicIds });
    socket.emit('pin_topic', { channelId });
  }

  function handleSelectTopic() {
    setSelectButtonDisabled(true);
    onSelectTopic(id);
  }
}

export default memo(TopicItem);

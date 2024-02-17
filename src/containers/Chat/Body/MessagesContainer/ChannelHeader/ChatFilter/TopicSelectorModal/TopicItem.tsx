import React, { memo, useMemo, useRef, useState } from 'react';
import UsernameText from '~/components/Texts/UsernameText';
import Button from '~/components/Button';
import moment from 'moment';
import RichText from '~/components/Texts/RichText';
import { useAppContext, useChatContext } from '~/contexts';
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
  isOwner,
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
  isOwner: boolean;
  content: string;
  userId: number;
  username: string;
  timeStamp: number;
  style?: React.CSSProperties;
}) {
  const updateFeaturedTopic = useAppContext(
    (v) => v.requestHelpers.updateFeaturedTopic
  );
  const onFeatureTopic = useChatContext((v) => v.actions.onFeatureTopic);
  const [selectButtonDisabled, setSelectButtonDisabled] = useState(false);
  const SubjectTitleRef: React.RefObject<any> = useRef(0);

  const displayedTime = useMemo(
    () => moment.unix(timeStamp).format('lll'),
    [timeStamp]
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
      {isOwner && !hideFeatureButton && (
        <Button
          color="blue"
          style={{
            maxHeight: '3.5rem',
            marginRight: currentTopicId === id ? 0 : '1rem'
          }}
          filled
          disabled={isFeatured}
          opacity={0.5}
          onClick={handleUpdateFeaturedTopic}
        >
          Feature{isFeatured ? 'd' : ''}
        </Button>
      )}
      {currentTopicId !== id && (
        <Button
          color="green"
          style={{ maxHeight: '3.5rem' }}
          filled
          opacity={0.5}
          onClick={handleSelectTopic}
          disabled={selectButtonDisabled}
        >
          Select
        </Button>
      )}
    </div>
  );

  async function handleUpdateFeaturedTopic() {
    if (isFeatured) {
      return;
    }
    const isSuccess = await updateFeaturedTopic({ topicId: id, channelId });
    if (isSuccess) {
      onFeatureTopic({
        channelId,
        topic: { id, content, timeStamp, userId, username }
      });
    }
  }

  function handleSelectTopic() {
    setSelectButtonDisabled(true);
    onSelectTopic(id);
  }
}

export default memo(TopicItem);

import React, { memo, useMemo, useRef, useState } from 'react';
import UsernameText from '~/components/Texts/UsernameText';
import Button from '~/components/Button';
import moment from 'moment';
import RichText from '~/components/Texts/RichText';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';

function TopicItem({
  currentTopicId,
  displayedThemeColor,
  hideCurrentLabel = false,
  onSelectTopic,
  id,
  isOwner,
  content,
  userId,
  username,
  timeStamp,
  style
}: {
  currentTopicId: number;
  displayedThemeColor: string;
  hideCurrentLabel?: boolean;
  onSelectTopic: (id: number) => void;
  id: number;
  isOwner: boolean;
  content: string;
  userId: number;
  username: string;
  timeStamp: number;
  style?: React.CSSProperties;
}) {
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
      {isOwner && (
        <Button
          color="blue"
          style={{
            maxHeight: '3.5rem',
            marginRight: currentTopicId === id ? 0 : '1rem'
          }}
          filled
          opacity={0.5}
          onClick={() => console.log('is featured')}
        >
          Feature
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

  function handleSelectTopic() {
    setSelectButtonDisabled(true);
    onSelectTopic(id);
  }
}

export default memo(TopicItem);

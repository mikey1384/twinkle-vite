import React, { useEffect, useMemo, useRef, useState } from 'react';
import UsernameText from '~/components/Texts/UsernameText';
import ButtonGroup from '~/components/Buttons/ButtonGroup';
import moment from 'moment';
import { Color } from '~/constants/css';

const marginHeight = 1;
const topicTitleHeight = 24;

export default function TopicItem({
  currentTopicId,
  displayedThemeColor,
  onSelectTopic,
  id,
  content,
  userId,
  username,
  timeStamp,
  style
}: {
  currentTopicId: number;
  displayedThemeColor: string;
  onSelectTopic: (id: number) => void;
  id: number;
  content: string;
  userId: number;
  username: string;
  timeStamp: number;
  style?: React.CSSProperties;
}) {
  const [marginBottom, setMarginBottom] = useState(`${marginHeight}rem`);
  const [selectButtonDisabled, setSelectButtonDisabled] = useState(false);
  const SubjectTitleRef: React.RefObject<any> = useRef(null);

  useEffect(() => {
    const numLines = SubjectTitleRef.current.clientHeight / topicTitleHeight;
    setMarginBottom(`${numLines * marginHeight}rem`);
  }, []);

  const displayedTime = useMemo(
    () => moment.unix(timeStamp).format('lll'),
    [timeStamp]
  );

  const buttons = useMemo(() => {
    const result = [];
    if (currentTopicId !== id) {
      result.push({
        color: 'green',
        opacity: 0.5,
        onClick: handleSelectSubject,
        disabled: selectButtonDisabled,
        label: 'Select'
      });
    }
    return result;

    function handleSelectSubject() {
      setSelectButtonDisabled(true);
      onSelectTopic(id);
    }
  }, [currentTopicId, id, selectButtonDisabled, onSelectTopic]);

  return (
    <div
      style={{
        minHeight: '50px',
        height: 'auto',
        width: '100%',
        ...style
      }}
    >
      <ButtonGroup
        style={{ position: 'absolute', right: '1.5rem' }}
        buttons={buttons}
      />
      <div
        style={{
          width: '100%',
          whiteSpace: 'pre-wrap',
          overflowWrap: 'break-word',
          wordBreak: 'break-word'
        }}
      >
        <div ref={SubjectTitleRef} style={{ marginBottom }}>
          {currentTopicId === id && (
            <b
              style={{
                fontSize: '1.5rem',
                color: Color[displayedThemeColor]()
              }}
            >
              Current:{' '}
            </b>
          )}
          <span
            style={{
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
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
    </div>
  );
}

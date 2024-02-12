import React, { memo, useMemo, useRef, useState } from 'react';
import UsernameText from '~/components/Texts/UsernameText';
import ButtonGroup from '~/components/Buttons/ButtonGroup';
import moment from 'moment';
import RichText from '~/components/Texts/RichText';
import { Color } from '~/constants/css';

function TopicItem({
  currentTopicId,
  displayedThemeColor,
  hideCurrentLabel = false,
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
  hideCurrentLabel?: boolean;
  onSelectTopic: (id: number) => void;
  id: number;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTopicId, id, selectButtonDisabled]);

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
    </div>
  );
}

export default memo(TopicItem);

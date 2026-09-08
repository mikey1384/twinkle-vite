import React, { useId, useMemo, useState } from 'react';
import StartTopicButton from './StartTopicButton';
import Input from '~/components/Texts/Input';
import { exceedsCharLimit } from '~/helpers/stringHelpers';
import { charLimit } from '~/constants/defaultValues';

export default function NoTopicPosted({
  canAddTopic,
  channelId,
  displayedThemeColor,
  onHide,
  pathId
}: {
  canAddTopic: boolean;
  channelId: number;
  displayedThemeColor: string;
  onHide: () => void;
  pathId: string;
}) {
  const [topicTitle, setTopicTitle] = useState('');
  const inputId = useId();
  const maxLength = useMemo(() => {
    return charLimit?.chat?.topic || 0;
  }, []);
  const titleExceedsCharLimit = useMemo(
    () =>
      exceedsCharLimit({
        contentType: 'chat',
        inputType: 'topic',
        text: topicTitle
      }),
    [topicTitle]
  );

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px 0',
        gap: 12,
        fontSize: '16px',
        color: '#334155'
      }}
    >
      <p style={{ margin: 0, textAlign: 'center' }}>
        {canAddTopic ? 'Start the first topic for this chat.' : 'No topics have been posted yet.'}
      </p>
      {canAddTopic && <>
        <div style={{ width: '100%', maxWidth: 480 }}>
          <label htmlFor={inputId} style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
            Topic title
          </label>
          <Input
            id={inputId}
            aria-describedby={`${inputId}-count`}
            aria-invalid={!!titleExceedsCharLimit}
            onChange={setTopicTitle}
            placeholder="Enter Topic"
            value={topicTitle}
            style={titleExceedsCharLimit?.style}
          />
          <small
            id={`${inputId}-count`}
            style={{
              display: 'block',
              marginTop: 6,
              fontSize: '13px',
              color: titleExceedsCharLimit ? '#b42318' : '#526176'
            }}
          >
            {topicTitle.length}/{maxLength} Characters
            {titleExceedsCharLimit && ' — shorten the title to start this topic.'}
          </small>
        </div>
        <StartTopicButton
          channelId={channelId}
          onStartTopic={onHide}
          topicTitle={topicTitle}
          themeColor={displayedThemeColor}
          pathId={pathId}
        />
      </>}
    </div>
  );
}

import React, { useMemo, useState } from 'react';
import StartTopicButton from '../StartTopicButton';
import Input from '~/components/Texts/Input';
import { exceedsCharLimit } from '~/helpers/stringHelpers';

export default function NoTopicPosted({
  channelId,
  channelName,
  displayedThemeColor,
  onHide,
  pathId
}: {
  channelId: number;
  channelName: string;
  displayedThemeColor: string;
  onHide: () => void;
  pathId: string;
}) {
  const [topicTitle, setTopicTitle] = useState('');
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
        height: '15rem',
        fontSize: '1.5rem',
        fontWeight: 'bold'
      }}
    >
      <div>
        <Input
          onChange={setTopicTitle}
          placeholder="Enter Topic"
          value={topicTitle}
          style={titleExceedsCharLimit?.style}
        />
      </div>
      <StartTopicButton
        channelId={channelId}
        channelName={channelName}
        onStartTopic={onHide}
        topicTitle={topicTitle}
        themeColor={displayedThemeColor}
        pathId={pathId}
      />
    </div>
  );
}

import React from 'react';
import Icon from '~/components/Icon';
import { truncateTopic } from '~/helpers/stringHelpers';
import { Color } from '~/constants/css';

export default function AIStoryDetails({
  isListening,
  story,
  topic
}: {
  isListening?: boolean;
  story: string;
  topic: string;
}) {
  return (
    <>
      <div className="title">
        <p>{truncateTopic(topic)}</p>
      </div>
      {isListening ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Icon
            style={{ marginTop: '3rem', color: Color.darkerGray() }}
            size="3x"
            icon="volume"
          />
        </div>
      ) : (
        <div className="description">{story}</div>
      )}
    </>
  );
}

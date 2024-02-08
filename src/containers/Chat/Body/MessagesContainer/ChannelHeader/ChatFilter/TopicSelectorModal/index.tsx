import React, { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import TopicInput from './TopicInput';
import Main from './Main';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

export default function TopicSelectorModal({
  channelId,
  currentTopicId,
  displayedThemeColor,
  onHide,
  onSelectTopic
}: {
  channelId: number;
  currentTopicId: number;
  displayedThemeColor: string;
  onHide: () => void;
  onSelectTopic: (v: number) => void;
}) {
  const [topicSearchText, setTopicSearchText] = useState('');

  return (
    <Modal wrapped onHide={onHide}>
      <header>Topics</header>
      <main>
        <div style={{ width: '100%' }}>
          <h3
            className={css`
              margin-bottom: 1rem;
              color: ${Color[displayedThemeColor]()};
            `}
          >
            Search / Start a Topic
          </h3>
        </div>
        <TopicInput
          topicSearchText={topicSearchText}
          onSetTopicSearchText={setTopicSearchText}
        />
        <Main
          channelId={channelId}
          currentTopicId={currentTopicId}
          displayedThemeColor={displayedThemeColor}
          onSelectTopic={onSelectTopic}
        />
      </main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );
}

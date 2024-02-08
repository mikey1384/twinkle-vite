import React, { useContext, useEffect, useMemo, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import TopicInput from './TopicInput';
import Main from './Main';
import Search from './Search';
import LocalContext from '../../../../../Context';
import { stringIsEmpty } from '~/helpers/stringHelpers';
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
  const {
    requests: { searchChatSubject }
  } = useContext(LocalContext);
  const [topicSearchText, setTopicSearchText] = useState('');
  const [searchedTopics, setSearchedTopics] = useState([]);
  const topicSearchTextIsEmpty = useMemo(
    () => stringIsEmpty(topicSearchText),
    [topicSearchText]
  );

  useEffect(() => {
    const debounceTimeout = setTimeout(async () => {
      if (!stringIsEmpty(topicSearchText)) {
        const result = await searchChatSubject({
          text: topicSearchText,
          channelId
        });
        setSearchedTopics(result);
      } else {
        setSearchedTopics([]);
      }
    }, 500);

    return () => clearTimeout(debounceTimeout);
  }, [channelId, searchChatSubject, topicSearchText]);

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
        {topicSearchTextIsEmpty ? (
          <Main
            channelId={channelId}
            currentTopicId={currentTopicId}
            displayedThemeColor={displayedThemeColor}
            onSelectTopic={onSelectTopic}
          />
        ) : (
          <Search searchedTopics={searchedTopics} />
        )}
      </main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );
}

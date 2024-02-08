import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
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
  const [searched, setSearched] = useState(false);
  const searchVersionRef = useRef(0);

  const mainSectionShown = useMemo(
    () => stringIsEmpty(topicSearchText) || topicSearchText.length < 2,
    [topicSearchText]
  );

  useEffect(() => {
    setSearched(false);
    const currentSearchVersion = ++searchVersionRef.current;
    const debounceTimeout = setTimeout(async () => {
      setSearchedTopics([]);
      try {
        if (!stringIsEmpty(topicSearchText) && topicSearchText.length > 1) {
          const result = await searchChatSubject({
            text: topicSearchText,
            channelId
          });
          if (currentSearchVersion === searchVersionRef.current) {
            setSearchedTopics(result);
          }
        } else {
          setSearchedTopics([]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (currentSearchVersion === searchVersionRef.current) {
          setSearched(true);
        }
      }
    }, 500);

    return () => clearTimeout(debounceTimeout);
  }, [channelId, searchChatSubject, topicSearchText]);

  useEffect(() => {
    if (!mainSectionShown) {
      setSearchedTopics([]);
    }
  }, [mainSectionShown]);

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
        {mainSectionShown ? (
          <Main
            channelId={channelId}
            currentTopicId={currentTopicId}
            displayedThemeColor={displayedThemeColor}
            onSelectTopic={onSelectTopic}
          />
        ) : (
          <Search
            currentTopicId={currentTopicId}
            displayedThemeColor={displayedThemeColor}
            searchedTopics={searchedTopics}
            onSelectTopic={onSelectTopic}
            searched={searched}
          />
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

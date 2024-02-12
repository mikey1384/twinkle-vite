import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import TopicInput from './TopicInput';
import Main from './Main';
import Search from './Search';
import LocalContext from '../../../../../Context';
import { useKeyContext } from '~/contexts';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

const maxTopicLength = 100;

export default function TopicSelectorModal({
  channelId,
  channelName,
  creatorId,
  currentTopic,
  displayedThemeColor,
  canChangeSubject,
  featuredTopic,
  onHide,
  onSelectTopic,
  pathId
}: {
  channelId: number;
  channelName: string;
  creatorId: number;
  currentTopic: any;
  displayedThemeColor: string;
  canChangeSubject: string;
  featuredTopic: any;
  onHide: () => void;
  onSelectTopic: (v: number) => void;
  pathId: string;
}) {
  const {
    requests: { searchChatSubject }
  } = useContext(LocalContext);
  const { userId } = useKeyContext((v) => v.myState);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, topicSearchText]);

  useEffect(() => {
    if (!mainSectionShown) {
      setSearchedTopics([]);
    }
  }, [mainSectionShown]);

  const canAddTopic = useMemo(() => {
    if (userId === creatorId) {
      return true;
    }
    return canChangeSubject === 'all';
  }, [canChangeSubject, creatorId, userId]);

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
            Search{canAddTopic ? ' / Start a' : ''} Topic
          </h3>
        </div>
        <TopicInput
          maxTopicLength={maxTopicLength}
          topicSearchText={topicSearchText}
          onSetTopicSearchText={setTopicSearchText}
        />
        {mainSectionShown ? (
          <Main
            channelId={channelId}
            currentTopic={currentTopic}
            featuredTopic={featuredTopic}
            displayedThemeColor={displayedThemeColor}
            onSelectTopic={onSelectTopic}
          />
        ) : (
          <Search
            canAddTopic={canAddTopic}
            channelId={channelId}
            channelName={channelName}
            currentTopicId={currentTopic.id}
            displayedThemeColor={displayedThemeColor}
            maxTopicLength={maxTopicLength}
            searchedTopics={searchedTopics}
            onHide={onHide}
            onSelectTopic={onSelectTopic}
            pathId={pathId}
            searched={searched}
            searchText={topicSearchText}
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

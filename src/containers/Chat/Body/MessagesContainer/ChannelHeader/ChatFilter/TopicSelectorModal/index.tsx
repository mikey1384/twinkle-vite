import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import TopicInput from './TopicInput';
import Main from './Main';
import Search from './Search';
import NoTopicPosted from './NoTopicPosted';
import LocalContext from '../../../../../Context';
import { useAppContext, useKeyContext } from '~/contexts';
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
  isTwoPeopleChat,
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
  isTwoPeopleChat: boolean;
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
  const loadChatSubjects = useAppContext(
    (v) => v.requestHelpers.loadChatSubjects
  );
  const [topicSearchText, setTopicSearchText] = useState('');
  const [searchedTopics, setSearchedTopics] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [searched, setSearched] = useState(false);
  const [myTopicObj, setMyTopicObj] = useState({
    subjects: [],
    loadMoreButton: false,
    loading: false
  });
  const [allTopicObj, setAllTopicObj] = useState({
    subjects: [],
    loadMoreButton: false,
    loading: false
  });
  const searchVersionRef = useRef(0);

  const isOwner = useMemo(
    () => userId === creatorId && !isTwoPeopleChat,
    [creatorId, isTwoPeopleChat, userId]
  );

  const mainSectionShown = useMemo(
    () => stringIsEmpty(topicSearchText) || topicSearchText.length < 2,
    [topicSearchText]
  );

  useEffect(() => {
    handleLoadSubjects();
    async function handleLoadSubjects() {
      try {
        const { mySubjects, allSubjects } = await loadChatSubjects({
          channelId
        });
        setMyTopicObj(mySubjects);
        setAllTopicObj(allSubjects);
        setLoaded(true);
      } catch (error: any) {
        console.error(error.response || error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const noTopicPostedYet = useMemo(() => {
    return !allTopicObj?.subjects?.length && loaded;
  }, [allTopicObj?.subjects?.length, loaded]);

  const canAddTopic = useMemo(() => {
    if (userId === creatorId || isTwoPeopleChat) {
      return true;
    }
    return canChangeSubject === 'all';
  }, [canChangeSubject, creatorId, isTwoPeopleChat, userId]);

  return (
    <Modal wrapped onHide={onHide}>
      <header>Topics</header>
      <main>
        {loaded && !noTopicPostedYet && (
          <div style={{ width: '100%' }}>
            <h3
              className={css`
                margin-bottom: 1rem;
                color: ${Color[displayedThemeColor]()};
              `}
            >
              Search{canAddTopic ? ' / Start a' : ''} Topic
            </h3>
            <TopicInput
              maxTopicLength={maxTopicLength}
              topicSearchText={topicSearchText}
              onSetTopicSearchText={setTopicSearchText}
            />
          </div>
        )}
        {noTopicPostedYet ? (
          <NoTopicPosted
            channelId={channelId}
            channelName={channelName}
            displayedThemeColor={displayedThemeColor}
            onHide={onHide}
            pathId={pathId}
          />
        ) : mainSectionShown ? (
          <Main
            canAddTopic={canAddTopic}
            channelId={channelId}
            currentTopic={currentTopic}
            featuredTopic={featuredTopic}
            isOwner={isOwner}
            isTwoPeopleChat={isTwoPeopleChat}
            displayedThemeColor={displayedThemeColor}
            isLoaded={loaded}
            allTopicObj={allTopicObj}
            myTopicObj={myTopicObj}
            onSelectTopic={onSelectTopic}
            onSetAllTopicObj={setAllTopicObj}
            onSetMyTopicObj={setMyTopicObj}
          />
        ) : (
          <Search
            canAddTopic={canAddTopic}
            channelId={channelId}
            channelName={channelName}
            currentTopicId={currentTopic.id}
            displayedThemeColor={displayedThemeColor}
            isOwner={isOwner}
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

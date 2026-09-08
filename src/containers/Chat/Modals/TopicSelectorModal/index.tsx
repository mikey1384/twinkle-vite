import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import TopicInput from './TopicInput';
import Main from './Main';
import Search from './Search';
import NoTopicPosted from './NoTopicPosted';
import LocalContext from '../../Context';
import { useAppContext, useKeyContext } from '~/contexts';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { charLimit } from '~/constants/defaultValues';
import TopicRequestStatus from '../TopicRequestStatus';
import { chatTopicActionStyle, chatTopicModalClass, chatTopicSectionClass, chatTopicThemeStyle } from '../topicStyles';

const maxTopicLength = charLimit.chat.topic;

export default function TopicSelectorModal({
  channelId,
  channelName,
  creatorId,
  currentTopic,
  displayedThemeColor,
  isTwoPeopleChat,
  isAIChannel,
  canChangeSubject,
  featuredTopic,
  onHide,
  onSelectTopic,
  pinnedTopicIds,
  pathId
}: {
  channelId: number;
  channelName: string;
  creatorId: number;
  currentTopic: any;
  displayedThemeColor: string;
  isTwoPeopleChat: boolean;
  isAIChannel: boolean;
  canChangeSubject: string;
  featuredTopic?: any;
  onHide: () => void;
  onSelectTopic: (v: number) => void;
  pinnedTopicIds: number[];
  pathId: string;
}) {
  const {
    requests: { searchChatSubject }
  } = useContext(LocalContext);
  const userId = useKeyContext((v) => v.myState.userId);
  const loadChatSubjects = useAppContext(
    (v) => v.requestHelpers.loadChatSubjects
  );
  const loadOtherUserTopics = useAppContext(
    (v) => v.requestHelpers.loadOtherUserTopics
  );
  const [topicSearchText, setTopicSearchText] = useState('');
  const [searchedTopics, setSearchedTopics] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [searched, setSearched] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [searchRetryCount, setSearchRetryCount] = useState(0);
  const [sharedRetryCount, setSharedRetryCount] = useState(0);
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
  const [sharedTopicObj, setSharedTopicObj] = useState({
    subjects: [],
    loadMoreButton: false,
    loading: false,
    error: ''
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
    let ignore = false;
    setLoaded(false);
    setLoadError(false);
    handleLoadSubjects();
    async function handleLoadSubjects() {
      try {
        const { mySubjects, allSubjects } = await loadChatSubjects({
          channelId
        });
        if (ignore) return;
        setMyTopicObj(mySubjects);
        setAllTopicObj(allSubjects);
        setLoaded(true);
      } catch (error: any) {
        if (ignore) return;
        setLoadError(true);
        console.error(error.response || error);
      }
    }
    return () => { ignore = true; };
  }, [channelId, loadChatSubjects, retryCount]);

  useEffect(() => {
    let ignore = false;
    async function loadSharedTopics() {
      if (!isAIChannel) {
        setSharedTopicObj({
          subjects: [],
          loadMoreButton: false,
          loading: false,
          error: ''
        });
        return;
      }
      setSharedTopicObj((prev) => ({ ...prev, loading: true, error: '' }));
      try {
        const { subjects, loadMoreButton } = await loadOtherUserTopics();
        if (ignore) return;
        setSharedTopicObj({
          subjects,
          loadMoreButton,
          loading: false,
          error: ''
        });
      } catch (error) {
        console.error(error);
        if (ignore) return;
        setSharedTopicObj({
          subjects: [],
          loadMoreButton: false,
          loading: false,
          error: "Couldn't load shared topics. Please try again."
        });
      }
    }
    loadSharedTopics();
    return () => {
      ignore = true;
    };
  }, [channelId, isAIChannel, loadOtherUserTopics, sharedRetryCount]);

  useEffect(() => {
    setSearched(false);
    setSearchError(false);
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
        if (currentSearchVersion === searchVersionRef.current) setSearchError(true);
        console.error(error);
      } finally {
        if (currentSearchVersion === searchVersionRef.current) {
          setSearched(true);
        }
      }
    }, 500);

    return () => {
      clearTimeout(debounceTimeout);
      searchVersionRef.current = currentSearchVersion + 1;
    };
  }, [channelId, topicSearchText, searchChatSubject, searchRetryCount]);

  useEffect(() => {
    if (!mainSectionShown) {
      setSearchedTopics([]);
    }
  }, [mainSectionShown]);

  const noTopicPostedYet = useMemo(() => {
    if (isAIChannel) {
      return (
        !allTopicObj?.subjects?.length &&
        !sharedTopicObj.subjects.length &&
        loaded &&
        !sharedTopicObj.loading &&
        !sharedTopicObj.error
      );
    }
    return !allTopicObj?.subjects?.length && loaded;
  }, [
    allTopicObj?.subjects?.length,
    isAIChannel,
    loaded,
    sharedTopicObj.loading,
    sharedTopicObj.error,
    sharedTopicObj.subjects.length
  ]);

  const canAddTopic = useMemo(() => {
    if (userId === creatorId || isTwoPeopleChat) {
      return true;
    }
    return canChangeSubject === 'all';
  }, [canChangeSubject, creatorId, isTwoPeopleChat, userId]);

  return (
    <Modal
      modalKey="TopicSelectorModal"
      aria-label="Topics"
      className={chatTopicModalClass}
      isOpen
      onClose={onHide}
      title="Topics"
      size="md"
      footer={
        <Button variant="ghost" style={chatTopicActionStyle} onClick={onHide}>
          Close
        </Button>
      }
    >
      <div style={{ width: '100%', fontSize: '16px', ...chatTopicThemeStyle(displayedThemeColor) }}>
        {loaded && !noTopicPostedYet && (
          <div style={{ width: '100%' }}>
            <h3 className={chatTopicSectionClass}>
              Search{canAddTopic ? ' / Start a' : ''} Topic
            </h3>
            <TopicInput
              maxTopicLength={maxTopicLength}
              topicSearchText={topicSearchText}
              onSetTopicSearchText={setTopicSearchText}
            />
          </div>
        )}
        {loadError ? (
          <TopicRequestStatus message="Couldn't load topics. Please try again." onRetry={() => setRetryCount(count => count + 1)} />
        ) : noTopicPostedYet ? (
          <NoTopicPosted
            canAddTopic={canAddTopic}
            channelId={channelId}
            displayedThemeColor={displayedThemeColor}
            onHide={onHide}
            pathId={pathId}
          />
        ) : mainSectionShown ? (
          <Main
            canAddTopic={canAddTopic}
            channelId={channelId}
            channelName={channelName}
            currentTopic={currentTopic}
            featuredTopic={featuredTopic}
            isOwner={isOwner}
            isTwoPeopleChat={isTwoPeopleChat}
            isAIChannel={isAIChannel}
            displayedThemeColor={displayedThemeColor}
            isLoaded={loaded}
            allTopicObj={allTopicObj}
            myTopicObj={myTopicObj}
            sharedTopicObj={sharedTopicObj}
            onSelectTopic={onSelectTopic}
            onDeleteTopic={handleDeleteTopic}
            onSetAllTopicObj={setAllTopicObj}
            onSetMyTopicObj={setMyTopicObj}
            onSetSharedTopicObj={setSharedTopicObj}
            onRetrySharedTopics={() => setSharedRetryCount(count => count + 1)}
            pinnedTopicIds={pinnedTopicIds}
            pathId={pathId}
            onHide={onHide}
          />
        ) : (
          <Search
            canAddTopic={canAddTopic}
            channelId={channelId}
            currentTopicId={currentTopic?.id || 0}
            displayedThemeColor={displayedThemeColor}
            featuredTopicId={featuredTopic?.id}
            isOwner={isOwner}
            isAIChannel={isAIChannel}
            isTwoPeopleChat={isTwoPeopleChat}
            maxTopicLength={maxTopicLength}
            searchedTopics={searchedTopics}
            onHide={onHide}
            onSelectTopic={onSelectTopic}
            pinnedTopicIds={pinnedTopicIds}
            pathId={pathId}
            searched={searched}
            searchError={searchError}
            onRetry={() => setSearchRetryCount(count => count + 1)}
            searchText={topicSearchText}
          />
        )}
      </div>
    </Modal>
  );

  function handleDeleteTopic(topicId: number) {
    setAllTopicObj(prev => ({ ...prev, subjects: prev.subjects.filter((subject: { id: number }) => subject.id !== topicId) }));
    setMyTopicObj(prev => ({ ...prev, subjects: prev.subjects.filter((subject: { id: number }) => subject.id !== topicId) }));
  }
}

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Input from './Input';
import Loading from '~/components/Loading';
import FeedsContainer from './FeedsContainer';
import VocabularyWidget from './VocabularyWidget';
import FilterBar from '~/components/FilterBar';
import { useNavigate } from 'react-router-dom';
import { Color } from '~/constants/css';
import {
  useAppContext,
  useChatContext,
  useInputContext,
  useNotiContext,
  useKeyContext
} from '~/contexts';
import {
  SELECTED_LANGUAGE,
  VOCAB_CHAT_TYPE,
  AI_CARD_CHAT_TYPE
} from '~/constants/defaultValues';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { css } from '@emotion/css';

export default function Vocabulary({
  loadingVocabulary
}: {
  loadingVocabulary: boolean;
}) {
  const navigate = useNavigate();
  const [searchedWord, setSearchedWord] = useState<any>({});
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const lookUpWord = useAppContext((v) => v.requestHelpers.lookUpWord);
  const registerWord = useAppContext((v) => v.requestHelpers.registerWord);
  const onUpdateNumWordsCollected = useAppContext(
    (v) => v.user.actions.onUpdateNumWordsCollected
  );
  const vocabErrorMessage = useChatContext((v) => v.state.vocabErrorMessage);
  const wordRegisterStatus = useChatContext((v) => v.state.wordRegisterStatus);
  const onPostVocabFeed = useChatContext((v) => v.actions.onPostVocabFeed);
  const onSetCollectType = useAppContext(
    (v) => v.user.actions.onSetCollectType
  );
  const onSetWordRegisterStatus = useChatContext(
    (v) => v.actions.onSetWordRegisterStatus
  );
  const onSetWordsObj = useChatContext((v) => v.actions.onSetWordsObj);
  const onUpdateCollectorsRankings = useChatContext(
    (v) => v.actions.onUpdateCollectorsRankings
  );
  const state = useInputContext((v) => v.state);
  const onEnterComment = useInputContext((v) => v.actions.onEnterComment);
  const socketConnected = useNotiContext((v) => v.state.socketConnected);
  const { userId } = useKeyContext((v) => v.myState);
  const inputText = state[VOCAB_CHAT_TYPE]?.text?.trim?.() || '';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scrollAtBottom, setScrollAtBottom] = useState(false);
  const feedsContainerRef = useRef<any>(null);
  const feedsContentRef = useRef<any>(null);

  const text = useRef(null);
  const inputRef = useRef(null);
  const timerRef: React.MutableRefObject<any> = useRef(null);

  const inputTextIsEmpty = useMemo(() => stringIsEmpty(inputText), [inputText]);

  useEffect(() => {
    text.current = inputText;
    setSearchedWord(null);
    if (!inputTextIsEmpty) {
      clearTimeout(timerRef.current);
      if (socketConnected) {
        timerRef.current = setTimeout(() => changeInput(inputText), 1000);
      }
    }
    async function changeInput(input: string) {
      const word = await lookUpWord(input);
      if (word.notFound || (word.content && word.content === text.current)) {
        onSetWordsObj(word);
        setSearchedWord(word);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputText, socketConnected]);

  const widgetHeight = useMemo(() => {
    return '10rem';
  }, []);

  const containerHeight = useMemo(() => {
    return `CALC(100% - ${widgetHeight} - 6.5rem)`;
  }, [widgetHeight]);

  const notRegistered = useMemo(
    () => searchedWord?.isNew && !inputTextIsEmpty && socketConnected,
    [inputTextIsEmpty, searchedWord, socketConnected]
  );

  const alreadyRegistered = useMemo(
    () => !!searchedWord?.content && !searchedWord?.isNew && !inputTextIsEmpty,
    [searchedWord?.content, searchedWord?.isNew, inputTextIsEmpty]
  );

  const wordLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return /\s/.test(searchedWord?.content) ? '숙어' : '단어';
    }
    return /\s/.test(searchedWord?.content) ? 'term' : 'word';
  }, [searchedWord?.content]);

  const notDiscoveredYetLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return `이 ${wordLabel}는 아직 수집되지 않은 상태입니다. 수집하시면 XP가 올라갑니다!`;
    }
    return `This ${wordLabel} has not been discovered yet!`;
  }, [wordLabel]);

  const alreadyDiscoveredLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return `이 ${wordLabel}는 이미 수집된 상태입니다`;
    }
    return `This ${wordLabel} has already been discovered`;
  }, [wordLabel]);

  const notFoundLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return `찾을 수 없었습니다: ${`"${inputText}"`}`;
    }
    return `${`"${inputText}"`} was not found`;
  }, [inputText]);

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        flexDirection: 'column'
      }}
    >
      <div
        className={css`
          z-index: 100;
          box-shadow: 0 3px 5px -3px ${Color.black(0.6)};
          width: 100%;
        `}
      >
        <FilterBar
          style={{
            height: '4.5rem',
            fontSize: '1.6rem',
            marginBottom: 0
          }}
        >
          <nav className="active">Vocabulary</nav>
          <nav onClick={handleFilterClick}>AI Cards</nav>
        </FilterBar>
      </div>
      {loadingVocabulary ? (
        <div style={{ height: containerHeight }}>
          <Loading style={{ height: '50%' }} text="Loading Vocabulary" />
        </div>
      ) : (
        <FeedsContainer
          containerRef={feedsContainerRef}
          contentRef={feedsContentRef}
          onSetScrollToBottom={handleSetScrollToBottom}
          scrollAtBottom={scrollAtBottom}
          onSetScrollAtBottom={setScrollAtBottom}
          style={{
            width: '100%',
            overflow: 'scroll',
            height: containerHeight
          }}
        />
      )}
      <VocabularyWidget
        widgetHeight={widgetHeight}
        wordRegisterStatus={wordRegisterStatus}
        inputTextIsEmpty={inputTextIsEmpty}
        searchedWord={searchedWord}
        socketConnected={socketConnected}
        notFoundLabel={notFoundLabel}
        notRegistered={notRegistered}
        alreadyRegistered={alreadyRegistered}
        vocabErrorMessage={vocabErrorMessage}
        isSubmitting={isSubmitting}
        notDiscoveredYetLabel={notDiscoveredYetLabel}
        alreadyDiscoveredLabel={alreadyDiscoveredLabel}
      />
      <div
        style={{
          height: '6.5rem',
          background: Color.inputGray(),
          padding: '1rem',
          borderTop: `1px solid ${Color.borderGray()}`
        }}
      >
        <Input
          onInput={() => {
            if (isSubmitting) {
              setIsSubmitting(false);
            }
          }}
          onSubmit={handleSubmit}
          innerRef={inputRef}
          registerButtonShown={notRegistered}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );

  function handleFilterClick() {
    onSetCollectType(AI_CARD_CHAT_TYPE);
    navigate(`/chat/${AI_CARD_CHAT_TYPE}`);
  }

  function handleSetScrollToBottom() {
    feedsContainerRef.current.scrollTop =
      feedsContentRef.current?.offsetHeight || 0;
    setTimeout(
      () =>
        ((feedsContainerRef.current || {}).scrollTop =
          feedsContentRef.current?.offsetHeight || 0),
      100
    );
    if (feedsContentRef.current?.offsetHeight) {
      setScrollAtBottom(true);
      return true;
    }
    return false;
  }

  async function handleSubmit() {
    const { isNew, ...definitions } = searchedWord;
    delete definitions.deletedDefIds;
    if (isNew && !isSubmitting) {
      setIsSubmitting(true);
      try {
        const { coins, numWordsCollected, xp, rank, feed, rankings } =
          await registerWord(definitions);
        onSetUserState({
          userId,
          newState: { twinkleXP: xp, twinkleCoins: coins, rank }
        });
        onUpdateNumWordsCollected(numWordsCollected);
        onPostVocabFeed(feed);
        onUpdateCollectorsRankings({ rankings });
        onSetWordRegisterStatus(searchedWord);
        setSearchedWord(null);
        onEnterComment({
          contentType: VOCAB_CHAT_TYPE,
          text: ''
        });
        setIsSubmitting(false);
        handleSetScrollToBottom();
      } catch (error) {
        console.error(error);
        setIsSubmitting(false);
      }
    }
  }
}

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
import { VOCAB_CHAT_TYPE, AI_CARD_CHAT_TYPE } from '~/constants/defaultValues';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { css } from '@emotion/css';

export default function Vocabulary({
  loadingVocabulary
}: {
  loadingVocabulary: boolean;
}) {
  const navigate = useNavigate();
  const [searchedWord, setSearchedWord] = useState<any>(null);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const lookUpWord = useAppContext((v) => v.requestHelpers.lookUpWord);
  const collectVocabulary = useAppContext(
    (v) => v.requestHelpers.collectVocabulary
  );
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
  const feedsContentRef = useRef<any>(null);
  const text = useRef<string>('');
  const inputRef = useRef(null);
  const timerRef = useRef<any>(null);

  const inputTextIsEmpty = useMemo(() => stringIsEmpty(inputText), [inputText]);

  // Trigger "lookupWord" when user stops typing
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
      // Only set if still relevant
      if (word.notFound || (word.content && word.content === text.current)) {
        onSetWordsObj(word);
        setSearchedWord(word);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputText, socketConnected]);

  const widgetHeight = useMemo(() => '10rem', []);
  const containerHeight = useMemo(
    () => `CALC(100% - ${widgetHeight} - 6.5rem)`,
    [widgetHeight]
  );

  // isNew = true => brand-new word (has never been registered)
  // canHit = true => word is discovered but hasn't been hit this year
  const isNewWord = useMemo(() => searchedWord?.isNew === true, [searchedWord]);
  const canHit = useMemo(() => searchedWord?.canHit === true, [searchedWord]);

  // If the word is found in DB (or fetched from Words API) but not new, that means "already discovered"
  const wordIsAlreadyDiscovered = useMemo(
    () => !!searchedWord?.content && !searchedWord?.isNew,
    [searchedWord]
  );

  // Decide which "status message" to show in the widget
  const statusMessage = useMemo(() => {
    if (searchedWord?.notFound) {
      return `We couldn't find "${inputText}".`;
    }
    if (isNewWord) {
      return `This word is not yet discovered! Press REGISTER to be the first.`;
    }
    if (wordIsAlreadyDiscovered) {
      if (canHit) {
        return `This word exists in the database, but nobody has hit it this year yet. Press HIT!`;
      }
      return `This word exists and has already been hit this year. No more hits allowed.`;
    }
    return '';
  }, [searchedWord, inputText, isNewWord, wordIsAlreadyDiscovered, canHit]);

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
          <nav className="active">Word Master</nav>
          <nav onClick={handleFilterClick}>AI Cards</nav>
        </FilterBar>
      </div>
      {loadingVocabulary ? (
        <div style={{ height: containerHeight }}>
          <Loading style={{ height: '50%' }} text="Loading Word Master..." />
        </div>
      ) : (
        <FeedsContainer
          contentRef={feedsContentRef}
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
        vocabErrorMessage={vocabErrorMessage}
        isSubmitting={isSubmitting}
        statusMessage={statusMessage}
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
          registerButtonShown={isNewWord || canHit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );

  function handleFilterClick() {
    onSetCollectType(AI_CARD_CHAT_TYPE);
    navigate(`/chat/${AI_CARD_CHAT_TYPE}`);
  }

  async function handleSubmit() {
    // If no valid word or empty input, do nothing
    if (!searchedWord || inputTextIsEmpty) return;

    // "Register" or "Hit" share the same endpoint => collectVocabulary
    // The server decides which action to take (register or hit) by checking if the word is in DB
    // We only proceed if it's new or canHit is true
    if ((isNewWord || canHit) && !isSubmitting) {
      setIsSubmitting(true);
      try {
        // The server will respond with { feed, xp, coins, etc. } for "hit" or "register"
        const { coins, numWordsCollected, xp, rank, feed, rankings } =
          await collectVocabulary({ ...searchedWord });

        onSetUserState({
          userId,
          newState: { twinkleXP: xp, twinkleCoins: coins, rank }
        });
        onUpdateNumWordsCollected(numWordsCollected);
        onPostVocabFeed(feed);
        onUpdateCollectorsRankings({ rankings });
        onSetWordRegisterStatus(searchedWord);

        // Clear local states/input
        setSearchedWord(null);
        onEnterComment({ contentType: VOCAB_CHAT_TYPE, text: '' });
        setIsSubmitting(false);
      } catch (error) {
        console.error(error);
        setIsSubmitting(false);
      }
    }
  }
}

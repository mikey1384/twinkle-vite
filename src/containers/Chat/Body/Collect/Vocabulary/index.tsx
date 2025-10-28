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
  const [kbInset, setKbInset] = useState(0);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const lookUpWord = useAppContext((v) => v.requestHelpers.lookUpWord);
  const collectVocabulary = useAppContext(
    (v) => v.requestHelpers.collectVocabulary
  );
  const vocabErrorMessage = useChatContext((v) => v.state.vocabErrorMessage);
  const wordRegisterStatus = useChatContext((v) => v.state.wordRegisterStatus);
  const onSetCollectType = useAppContext(
    (v) => v.user.actions.onSetCollectType
  );
  const onSetWordRegisterStatus = useChatContext(
    (v) => v.actions.onSetWordRegisterStatus
  );
  const onSetWordsObj = useChatContext((v) => v.actions.onSetWordsObj);
  const inputText = useInputContext(
    (v) => v.state[VOCAB_CHAT_TYPE]?.text?.trim?.() || ''
  );
  const onEnterComment = useInputContext((v) => v.actions.onEnterComment);
  const socketConnected = useNotiContext((v) => v.state.socketConnected);
  const userId = useKeyContext((v) => v.myState.userId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const feedsContentRef = useRef<any>(null);
  const text = useRef<string>('');
  const inputRef = useRef(null);
  const timerRef = useRef<any>(null);

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

  const widgetHeight = useMemo(() => '10rem', []);
  const containerHeight = useMemo(
    () => `calc(100% - ${widgetHeight} - 6.5rem - ${kbInset}px)`,
    [widgetHeight, kbInset]
  );

  const isNewWord = useMemo(() => searchedWord?.isNew === true, [searchedWord]);
  const canHit = useMemo(() => searchedWord?.canHit === true, [searchedWord]);

  const wordIsAlreadyDiscovered = useMemo(
    () => !!searchedWord?.content && !searchedWord?.isNew,
    [searchedWord]
  );

  const isCensored = useMemo(() => !!searchedWord?.isCensored, [searchedWord]);

  const statusMessage = useMemo(() => {
    if (searchedWord?.notFound) return `No results for "${inputText}"`;
    if (isCensored)
      return 'This word has already been discovered and it is a type of word that cannot be collected';
    if (isNewWord) return 'New word discovered';
    if (canHit) return 'You can collect this word';
    if (wordIsAlreadyDiscovered)
      return 'Already discovered and already collected this year';
    return '';
  }, [
    searchedWord,
    inputText,
    isNewWord,
    canHit,
    wordIsAlreadyDiscovered,
    isCensored
  ]);

  useEffect(() => {
    const vv = (window as any).visualViewport;
    if (!vv) return;

    vv.addEventListener('resize', handleApply);
    vv.addEventListener('scroll', handleApply);
    return () => {
      vv.removeEventListener('resize', handleApply);
      vv.removeEventListener('scroll', handleApply);
    };

    function handleApply() {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKbInset(inset);
    }
  });

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
        canHit={canHit}
        isNewWord={isNewWord}
        isCensored={isCensored}
      />
      <div
        style={{
          height: '6.5rem',
          background: Color.inputGray(),
          padding: '1rem',
          borderTop: '1px solid var(--ui-border)',
          paddingBottom: kbInset ? kbInset : undefined
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
          registerButtonShown={(isNewWord || canHit) && !isCensored}
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
    if (!searchedWord || inputTextIsEmpty) return;
    if (isCensored) return;

    if ((isNewWord || canHit) && !isSubmitting) {
      setIsSubmitting(true);
      try {
        if (!searchedWord.content) {
          throw new Error('Word content is required');
        }

        const vocabPayload = buildVocabularyPayload(searchedWord);
        const { coins, xp, rank } = await collectVocabulary(vocabPayload);
        onSetUserState({
          userId,
          newState: { twinkleXP: xp, twinkleCoins: coins, rank }
        });
        onSetWordRegisterStatus(searchedWord);

        setSearchedWord(null);
        onEnterComment({ contentType: VOCAB_CHAT_TYPE, text: '' });
        setIsSubmitting(false);
      } catch (error) {
        console.error(error);
        setIsSubmitting(false);
      }
    }
  }

  function buildVocabularyPayload(searchedWord: any) {
    const recognizedPartsOfSpeech = [
      'noun',
      'verb',
      'adjective',
      'adverb',
      'preposition',
      'pronoun',
      'conjunction',
      'interjection',
      'phrase',
      'determiner',
      'other'
    ];

    const { content, frequency = 1, ...rest } = searchedWord || {};

    const payload: Record<string, any> = {
      content: content?.toLowerCase?.() || '',
      frequency
    };

    const otherDefinitions: { definition: string }[] = [];

    for (const [key, value] of Object.entries(rest)) {
      if (Array.isArray(value)) {
        if (recognizedPartsOfSpeech.includes(key)) {
          payload[key] = value.map((item: any) => {
            if (typeof item === 'object' && item.definition) {
              return { definition: item.definition };
            } else if (typeof item === 'string') {
              return { definition: item };
            } else {
              return { definition: String(item) };
            }
          });
        } else {
          for (const item of value) {
            if (typeof item === 'object' && item.definition) {
              otherDefinitions.push({ definition: item.definition });
            } else if (typeof item === 'string') {
              otherDefinitions.push({ definition: item });
            } else {
              otherDefinitions.push({ definition: String(item) });
            }
          }
        }
      }
    }

    if (otherDefinitions.length > 0) {
      payload.other = otherDefinitions;
    }

    return payload;
  }
}

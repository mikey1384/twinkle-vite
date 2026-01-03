import React, { useEffect, useMemo, useRef, useState } from 'react';
import Input from './Input';
import Loading from '~/components/Loading';
import FeedsContainer from './FeedsContainer';
import VocabularyWidget from './VocabularyWidget';
import WordMasterBreakModal from './WordMasterBreakModal';
import FilterBar from '~/components/FilterBar';
import { useNavigate } from 'react-router-dom';
import { Color } from '~/constants/css';
import {
  useAppContext,
  useChatContext,
  useHomeContext,
  useInputContext,
  useNotiContext,
  useKeyContext
} from '~/contexts';
import {
  VOCAB_CHAT_TYPE,
  AI_CARD_CHAT_TYPE,
  CHAT_ID_BASE_NUMBER,
  GENERAL_CHAT_ID,
  GENERAL_CHAT_PATH_ID,
  LAST_ONLINE_FILTER_LABEL
} from '~/constants/defaultValues';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { css } from '@emotion/css';

export default function Vocabulary({
  displayedThemeColor,
  loadingVocabulary
}: {
  displayedThemeColor: string;
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
  const loadDMChannel = useAppContext((v) => v.requestHelpers.loadDMChannel);
  const fetchWordMasterBreakStatus = useAppContext(
    (v) => v.requestHelpers.fetchWordMasterBreakStatus
  );
  const clearWordMasterBreak = useAppContext(
    (v) => v.requestHelpers.clearWordMasterBreak
  );
  const loadWordMasterQuizQuestion = useAppContext(
    (v) => v.requestHelpers.loadWordMasterQuizQuestion
  );
  const submitWordMasterQuizAnswer = useAppContext(
    (v) => v.requestHelpers.submitWordMasterQuizAnswer
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
  const onUpdateSelectedChannelId = useChatContext(
    (v) => v.actions.onUpdateSelectedChannelId
  );
  const onOpenNewChatTab = useChatContext((v) => v.actions.onOpenNewChatTab);
  const onSetWordleModalShown = useChatContext(
    (v) => v.actions.onSetWordleModalShown
  );
  const onSetOmokModalShown = useChatContext(
    (v) => v.actions.onSetOmokModalShown
  );
  const inputText = useInputContext(
    (v) => v.state[VOCAB_CHAT_TYPE]?.text?.trim?.() || ''
  );
  const onEnterComment = useInputContext((v) => v.actions.onEnterComment);
  const socketConnected = useNotiContext((v) => v.state.socketConnected);
  const userId = useKeyContext((v) => v.myState.userId);
  const username = useKeyContext((v) => v.myState.username);
  const profilePicUrl = useKeyContext((v) => v.myState.profilePicUrl);
  const onSetAIStoriesModalShown = useHomeContext(
    (v) => v.actions.onSetAIStoriesModalShown
  );
  const onSetGrammarGameModalShown = useHomeContext(
    (v) => v.actions.onSetGrammarGameModalShown
  );
  const onSetChessPuzzleModalShown = useHomeContext(
    (v) => v.actions.onSetChessPuzzleModalShown
  );
  const onSetDailyQuestionModalShown = useHomeContext(
    (v) => v.actions.onSetDailyQuestionModalShown
  );
  const onSetOrderUsersBy = useAppContext(
    (v) => v.user.actions.onSetOrderUsersBy
  );
  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wordMasterBreak, setWordMasterBreak] = useState<any>(null);
  const [wordMasterBreakLoading, setWordMasterBreakLoading] = useState(false);
  const [wordMasterBreakModalShown, setWordMasterBreakModalShown] =
    useState(false);
  const feedsContentRef = useRef<any>(null);
  const text = useRef<string>('');
  const inputRef = useRef(null);
  const timerRef = useRef<any>(null);
  const lastStrikeSyncRef = useRef(0);

  const inputTextIsEmpty = useMemo(() => stringIsEmpty(inputText), [inputText]);
  const wordMasterBlocked = useMemo(
    () => Boolean(wordMasterBreak?.blocked),
    [wordMasterBreak]
  );

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
      if (word?.wordMasterBreak) {
        handleWordMasterBreakUpdate(word.wordMasterBreak, false);
      }
      maybeSyncStrikeCount(word);
      if (word.notFound || (word.content && word.content === text.current)) {
        onSetWordsObj(word);
        setSearchedWord(word);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputText, socketConnected]);

  const widgetHeight = '10rem';
  const inputAreaHeight = '6.5rem';
  const containerHeight = `calc(100% - ${widgetHeight} - ${inputAreaHeight} - ${kbInset}px)`;

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

  useEffect(() => {
    refreshWordMasterBreakStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          displayedThemeColor={displayedThemeColor}
          wordMasterBlocked={wordMasterBlocked}
          onWordMasterBreak={handleWordMasterBreakUpdate}
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
        wordMasterBlocked={wordMasterBlocked}
        onWordMasterBreak={handleWordMasterBreakUpdate}
        wordMasterBreak={wordMasterBreak}
        wordMasterBreakLoading={wordMasterBreakLoading}
        onOpenBreaks={() => setWordMasterBreakModalShown(true)}
      />
      <div
        style={{
          height: inputAreaHeight,
          background: Color.inputGray(),
          padding: 'CALC(1rem - 2px) 1rem',
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
          registerButtonShown={(isNewWord || canHit) && !isCensored && !wordMasterBlocked}
          isSubmitting={isSubmitting}
        />
      </div>
      {wordMasterBreakModalShown && (
        <WordMasterBreakModal
          breakStatus={wordMasterBreak || {}}
          isOpen={wordMasterBreakModalShown}
          loading={wordMasterBreakLoading}
          onClose={() => setWordMasterBreakModalShown(false)}
          onRefresh={refreshWordMasterBreakStatus}
          onClearBreak={handleClearWordMasterBreak}
          onPayBreak={handlePayWordMasterBreak}
          onLoadQuizQuestion={handleLoadWordMasterQuizQuestion}
          onSubmitQuizAnswer={handleSubmitWordMasterQuizAnswer}
          onOpenWordle={() => {
            setWordMasterBreakModalShown(false);
            onUpdateSelectedChannelId(GENERAL_CHAT_ID);
            navigate(`/chat/${GENERAL_CHAT_PATH_ID}`);
            setTimeout(() => {
              onSetWordleModalShown(true);
            }, 300);
          }}
          onOpenGrammarGame={() => {
            setWordMasterBreakModalShown(false);
            navigate('/');
            onSetGrammarGameModalShown(true);
          }}
          onOpenAIStories={() => {
            setWordMasterBreakModalShown(false);
            navigate('/');
            onSetAIStoriesModalShown(true);
          }}
          onOpenDailyQuestion={handleOpenDailyQuestion}
          onOpenChessPuzzle={handleOpenChessPuzzle}
          onOpenPendingOmok={handleOpenPendingOmok}
          onOpenOmokStart={handleOpenOmokStart}
          onStartOmokWithUser={handleStartOmokWithUser}
        />
      )}
    </div>
  );

  function handleFilterClick() {
    onSetCollectType(AI_CARD_CHAT_TYPE);
    navigate(`/chat/${AI_CARD_CHAT_TYPE}`);
  }

  function handleOpenDailyQuestion() {
    setWordMasterBreakModalShown(false);
    navigate('/');
    onSetDailyQuestionModalShown(true);
  }

  function handleOpenChessPuzzle() {
    setWordMasterBreakModalShown(false);
    navigate('/');
    onSetChessPuzzleModalShown(true);
  }

  function handleOpenPendingOmok(channelId: number) {
    if (!channelId) return;
    setWordMasterBreakModalShown(false);
    onUpdateSelectedChannelId(channelId);
    onUpdateTodayStats({
      newStats: { unansweredOmokMsgChannelId: null }
    });
    navigate(`/chat/${Number(CHAT_ID_BASE_NUMBER) + Number(channelId)}`);
    setTimeout(() => {
      onSetOmokModalShown(true);
    }, 300);
  }

  function handleOpenOmokStart() {
    setWordMasterBreakModalShown(false);
    onSetOrderUsersBy(LAST_ONLINE_FILTER_LABEL);
    navigate('/users');
  }

  async function handleStartOmokWithUser(user: {
    id: number;
    username: string;
    profilePicUrl?: string;
  }) {
    if (!user?.id) return;
    setWordMasterBreakModalShown(false);
    try {
      const { channelId, pathId } = await loadDMChannel({ recipient: user });
      if (!pathId && userId) {
        onOpenNewChatTab({
          user: { username, id: userId, profilePicUrl },
          recipient: {
            username: user.username,
            id: user.id,
            profilePicUrl: user.profilePicUrl
          }
        });
      }
      onUpdateSelectedChannelId(channelId);
      setTimeout(() => {
        navigate(pathId ? `/chat/${pathId}` : `/chat/new`);
        setTimeout(() => {
          onSetOmokModalShown(true);
        }, 300);
      }, 0);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleSubmit() {
    if (!searchedWord || inputTextIsEmpty) return;
    if (isCensored) return;
    if (wordMasterBlocked) {
      setWordMasterBreakModalShown(true);
      return;
    }

    if ((isNewWord || canHit) && !isSubmitting) {
      setIsSubmitting(true);
      try {
        if (!searchedWord.content) {
          throw new Error('Word content is required');
        }

        const vocabPayload = buildVocabularyPayload(searchedWord);
        const result = await collectVocabulary(vocabPayload);
        if (result?.wordMasterBreak) {
          handleWordMasterBreakUpdate(result.wordMasterBreak);
          setIsSubmitting(false);
          return;
        }
        const { coins, xp, rank } = result;
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

  async function refreshWordMasterBreakStatus() {
    setWordMasterBreakLoading(true);
    try {
      const data = await fetchWordMasterBreakStatus();
      if (data?.wordMasterBreak) {
        handleWordMasterBreakUpdate(data.wordMasterBreak, true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setWordMasterBreakLoading(false);
    }
  }

  function handleWordMasterBreakUpdate(nextBreak: any, showModal = true): void {
    if (!nextBreak) return;
    setWordMasterBreak(nextBreak);
    if (nextBreak.blocked) {
      if (showModal) {
        setWordMasterBreakModalShown(true);
      }
    }
  }

  async function handleClearWordMasterBreak() {
    setWordMasterBreakLoading(true);
    try {
      const result = await clearWordMasterBreak('requirement');
      if (result?.wordMasterBreak) {
        handleWordMasterBreakUpdate(result.wordMasterBreak, true);
      }
      return result;
    } finally {
      setWordMasterBreakLoading(false);
    }
  }

  async function handlePayWordMasterBreak() {
    setWordMasterBreakLoading(true);
    try {
      const result = await clearWordMasterBreak('pay');
      if (typeof result?.coins === 'number') {
        onSetUserState({
          userId,
          newState: { twinkleCoins: result.coins }
        });
      }
      if (result?.wordMasterBreak) {
        handleWordMasterBreakUpdate(result.wordMasterBreak, true);
      }
      return result;
    } finally {
      setWordMasterBreakLoading(false);
    }
  }

  async function handleLoadWordMasterQuizQuestion() {
    setWordMasterBreakLoading(true);
    try {
      const result = await loadWordMasterQuizQuestion();
      if (result?.wordMasterBreak) {
        handleWordMasterBreakUpdate(result.wordMasterBreak, true);
      }
      return result;
    } finally {
      setWordMasterBreakLoading(false);
    }
  }

  async function handleSubmitWordMasterQuizAnswer(selectedIndex: number) {
    setWordMasterBreakLoading(true);
    try {
      const result = await submitWordMasterQuizAnswer(selectedIndex);
      if (result?.wordMasterBreak) {
        handleWordMasterBreakUpdate(result.wordMasterBreak, true);
      }
      return result;
    } finally {
      setWordMasterBreakLoading(false);
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

  function maybeSyncStrikeCount(word: any) {
    if (!word || word.isNew || word.canHit || word.isCensored) return;
    const now = Date.now();
    if (now - lastStrikeSyncRef.current < 5000) return;
    lastStrikeSyncRef.current = now;
    refreshWordMasterBreakStatus();
  }
}

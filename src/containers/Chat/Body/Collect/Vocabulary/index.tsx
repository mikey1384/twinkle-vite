import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import Input from './Input';
import Loading from '~/components/Loading';
import ActivitiesContainer from './ActivitiesContainer';
import Definition from './Definition';
import Icon from '~/components/Icon';
import FilterBar from '~/components/FilterBar';
import WordRegisterStatus from './WordRegisterStatus';
import { useNavigate } from 'react-router-dom';
import { Color, mobileMaxWidth } from '~/constants/css';
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
import localize from '~/constants/localize';

const collectingLabel = localize('collecting');
const loadingLabel = localize('loading');
const lookingUpLabel = localize('lookingUp');
const typeWordInBoxBelowLabel = localize('typeWordInBoxBelow');

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
  const onRegisterWord = useChatContext((v) => v.actions.onRegisterWord);
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
  const activitiesContainerRef = useRef<any>(null);
  const activitiesContentRef = useRef<any>(null);

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
    return inputTextIsEmpty || !searchedWord || !socketConnected
      ? wordRegisterStatus
        ? '16rem'
        : '10rem'
      : searchedWord?.content
      ? '20rem'
      : `10rem`;
  }, [inputTextIsEmpty, searchedWord, socketConnected, wordRegisterStatus]);

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

  const notCollectedYetLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return `이 ${wordLabel}는 아직 수집되지 않은 상태입니다. 수집하시면 XP가 올라갑니다!`;
    }
    return `This ${wordLabel} has not been collected yet. Collect it and earn XP!`;
  }, [wordLabel]);

  const alreadyCollectedLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return `이 ${wordLabel}는 이미 수집된 상태입니다`;
    }
    return `This ${wordLabel} has already been collected`;
  }, [wordLabel]);

  const notFoundLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return `찾을 수 없었습니다: ${`"${inputText}"`}`;
    }
    return `${`"${inputText}"`} was not found`;
  }, [inputText]);

  const handleSubmit = useCallback(async () => {
    const { isNew, ...definitions } = searchedWord;
    delete definitions.deletedDefIds;
    if (isNew && !isSubmitting) {
      setIsSubmitting(true);
      try {
        const { coins, numWordsCollected, xp, rank, word, rankings } =
          await registerWord(definitions);
        onSetUserState({
          userId,
          newState: { twinkleXP: xp, twinkleCoins: coins, rank }
        });
        onUpdateNumWordsCollected(numWordsCollected);
        onRegisterWord(word);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubmitting, userId, searchedWord]);

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
        <ActivitiesContainer
          containerRef={activitiesContainerRef}
          contentRef={activitiesContentRef}
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
      <div
        style={{
          zIndex: 5,
          width: '100%',
          height: widgetHeight,
          boxShadow:
            !wordRegisterStatus && inputTextIsEmpty
              ? `0 -5px 6px -3px ${Color.gray()}`
              : '',
          borderTop:
            !!wordRegisterStatus || !inputTextIsEmpty
              ? `1px solid ${Color.borderGray()}`
              : ''
        }}
      >
        {inputTextIsEmpty && !!wordRegisterStatus && <WordRegisterStatus />}
        {!wordRegisterStatus && inputTextIsEmpty && (
          <div
            className={css`
              padding: 1rem;
              font-size: 3rem;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              height: 100%;
              background: ${Color.black()};
              color: #fff;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.7rem;
              }
            `}
          >
            <div>
              <span>{typeWordInBoxBelowLabel}</span>
              <Icon style={{ marginLeft: '1rem' }} icon="arrow-down" />
            </div>
          </div>
        )}
        {!inputTextIsEmpty &&
          (!searchedWord || !socketConnected ? (
            <Loading
              style={{ height: '100%' }}
              text={socketConnected ? lookingUpLabel : `${loadingLabel}...`}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                position: 'relative',
                paddingRight: '1rem',
                flexDirection: 'column',
                width: '100%',
                height: '100%',
                overflow: 'scroll'
              }}
            >
              {searchedWord?.content && (
                <>
                  <div
                    className={css`
                      font-weight: bold;
                      font-size: 3rem;
                      @media (max-width: ${mobileMaxWidth}) {
                        font-size: 2rem;
                      }
                    `}
                    style={{
                      display: 'flex',
                      width: '100%',
                      alignItems: 'center',
                      padding: '1rem'
                    }}
                  >
                    {searchedWord?.content}
                  </div>
                  <Definition wordObj={searchedWord} />
                </>
              )}
              {!searchedWord?.content && (
                <div
                  className={css`
                    font-size: 2.5rem;
                    @media (max-width: ${mobileMaxWidth}) {
                      font-size: 1.7rem;
                    }
                  `}
                  style={{
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontWeight: 'bold'
                  }}
                >
                  {notFoundLabel}
                </div>
              )}
            </div>
          ))}
      </div>
      {(notRegistered ||
        alreadyRegistered ||
        vocabErrorMessage ||
        isSubmitting) && (
        <div
          className={css`
            font-size: 2rem;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.5rem;
            }
          `}
          style={{
            display: 'flex',
            background: vocabErrorMessage
              ? Color.rose()
              : notRegistered
              ? Color.green()
              : Color.darkerGray(),
            color: '#fff',
            width: '100%',
            padding: '1rem',
            justifyContent: 'center',
            alignItems: 'center',
            height: '7rem'
          }}
        >
          {vocabErrorMessage ||
            (notRegistered
              ? isSubmitting
                ? collectingLabel
                : notCollectedYetLabel
              : alreadyCollectedLabel)}
        </div>
      )}
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
    activitiesContainerRef.current.scrollTop =
      activitiesContentRef.current?.offsetHeight || 0;
    setTimeout(
      () =>
        ((activitiesContainerRef.current || {}).scrollTop =
          activitiesContentRef.current?.offsetHeight || 0),
      100
    );
    if (activitiesContentRef.current?.offsetHeight) {
      setScrollAtBottom(true);
      return true;
    }
    return false;
  }
}

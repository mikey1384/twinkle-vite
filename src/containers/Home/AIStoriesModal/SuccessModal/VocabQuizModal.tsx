import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import ProgressBar from '~/components/ProgressBar';
import MultipleChoiceQuestion from '~/components/MultipleChoiceQuestion';
import SanitizedHTML from 'react-sanitized-html';
import { useAppContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { wordLevelHash } from '~/constants/defaultValues';
import { socket } from '~/constants/sockets/api';
import {
  WordMasterLevelBadge,
  WordMasterStatusBadge,
  getActionColor
} from '~/components/WordMasterBadges';

interface QuizQuestion {
  id: number;
  word: string;
  question: string;
  choices: string[];
  answerIndex?: number;
  status?: 'collectable' | 'discoverable';
  wordId?: number;
  wordLevel?: number;
  definition?: string;
}

interface QuizResult {
  word: string;
  wordLevel: number;
  isCorrect: boolean;
  collected: boolean;
  discovered: boolean;
  blocked?: boolean;
  alreadyCollected?: boolean;
  censored?: boolean;
  message?: string;
}

type ResultTab = 'all' | 'banked' | 'missed';
type ResultTone =
  | 'collected'
  | 'discovered'
  | 'missed'
  | 'blocked'
  | 'already_collected'
  | 'censored'
  | 'correct';

const funFont =
  "'Trebuchet MS', 'Comic Sans MS', 'Segoe UI', 'Arial Rounded MT Bold', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

export default function VocabQuizModal({
  isOpen,
  onClose,
  storyId
}: {
  isOpen: boolean;
  onClose: () => void;
  storyId: number;
}) {
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const submitAIStoryVocabQuizAnswer = useAppContext(
    (v) => v.requestHelpers.submitAIStoryVocabQuizAnswer
  );

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusTone, setStatusTone] = useState<
    'neutral' | 'success' | 'warning' | 'error'
  >('neutral');
  const [submitting, setSubmitting] = useState(false);
  const [autoCollectBlocked, setAutoCollectBlocked] = useState(false);
  const [loadingNextQuestion, setLoadingNextQuestion] = useState(false);
  const [mockProgress, setMockProgress] = useState(0);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [resultTab, setResultTab] = useState<ResultTab>('all');

  const storyIdRef = useRef(storyId);

  const currentQuestion = questions[currentIndex] || null;
  const isLastQuestion =
    totalQuestions > 0 && currentIndex + 1 >= totalQuestions;
  const gradedSelectedIndex =
    typeof answerResult?.selectedIndex === 'number'
      ? answerResult.selectedIndex
      : selectedIndex;

  // Keep storyIdRef updated
  useEffect(() => {
    storyIdRef.current = storyId;
  }, [storyId]);

  useEffect(() => {
    if (!isOpen) return;
    if (!storyId) {
      setLoadError('Story is unavailable.');
      return;
    }

    // Reset state
    setLoading(true);
    setLoadError('');
    setQuestions([]);
    setTotalQuestions(0);
    setCurrentIndex(0);
    setSelectedIndex(null);
    setAnswerResult(null);
    setStatusMessage('');
    setStatusTone('neutral');
    setAutoCollectBlocked(false);
    setLoadingNextQuestion(false);
    setQuizResults([]);
    setShowResults(false);
    setResultTab('all');

    // Socket event handlers
    function handleQuizStarted(data: {
      storyId: number;
      totalQuestions: number;
      collectableCount: number;
      discoverableCount: number;
      autoCollectBlocked?: boolean;
    }) {
      if (data.storyId !== storyIdRef.current) return;
      setTotalQuestions(data.totalQuestions);
      setAutoCollectBlocked(data.autoCollectBlocked || false);
      setLoading(false);
    }

    function handleQuizQuestion(data: {
      storyId: number;
      question: QuizQuestion;
      currentIndex: number;
      totalQuestions: number;
    }) {
      if (data.storyId !== storyIdRef.current) return;
      setQuestions((prev) => {
        // Avoid duplicates
        if (prev.some((q) => q.id === data.question.id)) return prev;
        return [...prev, data.question];
      });
      setTotalQuestions(data.totalQuestions);
      setLoadingNextQuestion(false);
    }

    function handleQuizComplete(data: { storyId: number }) {
      if (data.storyId !== storyIdRef.current) return;
      setLoadingNextQuestion(false);
    }

    function handleQuizError(data: { storyId: number; error: string }) {
      if (data.storyId !== storyIdRef.current) return;
      setLoadError(data.error || 'Failed to load quiz');
      setLoading(false);
      setLoadingNextQuestion(false);
    }

    // Subscribe to socket events
    socket.on('ai_story_vocab_quiz_started', handleQuizStarted);
    socket.on('ai_story_vocab_quiz_question', handleQuizQuestion);
    socket.on('ai_story_vocab_quiz_complete', handleQuizComplete);
    socket.on('ai_story_vocab_quiz_error', handleQuizError);

    // Start the quiz
    socket.emit('start_ai_story_vocab_quiz', { storyId });

    return () => {
      socket.off('ai_story_vocab_quiz_started', handleQuizStarted);
      socket.off('ai_story_vocab_quiz_question', handleQuizQuestion);
      socket.off('ai_story_vocab_quiz_complete', handleQuizComplete);
      socket.off('ai_story_vocab_quiz_error', handleQuizError);
    };
  }, [isOpen, storyId]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedIndex(null);
    setAnswerResult(null);
    setStatusMessage('');
    setStatusTone('neutral');
  }, [currentIndex, isOpen]);

  const waitingForFirstQuestion = !currentQuestion && !loadError && !loading;
  const waitingForNextQuestion =
    loadingNextQuestion && currentIndex >= questions.length;

  const loadingText = loading
    ? 'Starting quiz...'
    : waitingForFirstQuestion || waitingForNextQuestion
    ? 'Generating question...'
    : null;

  useEffect(() => {
    if (!loadingText) {
      setMockProgress(0);
      return;
    }
    setMockProgress(0);
    const interval = setInterval(() => {
      setMockProgress((prev) => {
        const next = prev + Math.random() * 15;
        return next > 90 ? 90 : next;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, [loadingText]);

  const totalAnswered = quizResults.length;
  const totalTarget = totalQuestions || totalAnswered;
  const correctCount = quizResults.filter((result) => result.isCorrect).length;
  const collectedCount = quizResults.filter(
    (result) => result.collected
  ).length;
  const discoveredCount = quizResults.filter(
    (result) => result.discovered
  ).length;
  const bankedCount = quizResults.filter(
    (result) => result.collected || result.discovered
  ).length;
  const missedCount = quizResults.filter((result) => !result.isCorrect).length;

  const resultTabs: {
    key: ResultTab;
    label: string;
    count: number;
  }[] = [
    { key: 'all', label: 'All Words', count: totalTarget },
    { key: 'banked', label: 'Banked', count: bankedCount },
    { key: 'missed', label: 'Missed', count: missedCount }
  ];

  const filteredResults = quizResults.filter((result) => {
    if (resultTab === 'banked') return result.collected || result.discovered;
    if (resultTab === 'missed') return !result.isCorrect;
    return true;
  });

  const trophyCards: {
    label: string;
    count: number;
    tone: ResultTone;
    icon: string;
  }[] = [
    { label: 'Correct', count: correctCount, tone: 'correct', icon: 'check' },
    {
      label: 'Collected',
      count: collectedCount,
      tone: 'collected',
      icon: 'check-circle'
    },
    {
      label: 'Discovered',
      count: discoveredCount,
      tone: 'discovered',
      icon: 'sparkles'
    },
    { label: 'Missed', count: missedCount, tone: 'missed', icon: 'times' }
  ];

  return (
    <Modal
      modalKey="VocabQuizModal"
      isOpen={isOpen}
      onClose={submitting || loadingNextQuestion ? () => null : onClose}
      size="lg"
      modalLevel={3}
      hasHeader={false}
      closeOnBackdropClick={!submitting && !loadingNextQuestion}
      bodyPadding={0}
      allowOverflow
    >
      <div
        className={css`
          display: flex;
          flex-direction: column;
          gap: 1.8rem;
          padding: 1.5rem;
          background: #fff;
          border-radius: ${borderRadius};
          width: 100%;
          @media (max-width: ${mobileMaxWidth}) {
            padding: 1rem;
          }
        `}
      >
        {showResults ? (
          <div
            className={css`
              display: flex;
              flex-direction: column;
              gap: 1.2rem;
            `}
          >
            <div
              className={css`
                display: flex;
                flex-direction: column;
                gap: 1.1rem;
                padding: 1.6rem;
                border-radius: 1.3rem;
                background: transparent;
                border: 1px solid ${Color.borderGray()};
                font-family: ${funFont};
                color: ${Color.darkerGray()};
                overflow: hidden;
                @media (max-width: ${mobileMaxWidth}) {
                  padding: 1.2rem;
                }
              `}
            >
              <div
                className={css`
                  display: flex;
                  align-items: center;
                  gap: 1rem;
                  flex-wrap: wrap;
                `}
              >
                <div
                  className={css`
                    width: 3.2rem;
                    height: 3.2rem;
                    border-radius: 1rem;
                    background: ${Color.white(0.9)};
                    border: 2px solid ${Color.gold(0.5)};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: ${Color.gold()};
                    font-size: 1.4rem;
                  `}
                >
                  <Icon icon="trophy" />
                </div>
                <div>
                  <div
                    className={css`
                      font-size: 1.6rem;
                      font-weight: 800;
                      color: ${Color.logoBlue()};
                      letter-spacing: 0.04rem;
                    `}
                  >
                    Word Master Logbook
                  </div>
                  <div
                    className={css`
                      font-size: 1.05rem;
                      font-weight: 600;
                      color: ${Color.darkGray()};
                    `}
                  >
                    AI Story vocab complete
                  </div>
                </div>
                <div
                  className={css`
                    margin-left: auto;
                    padding: 0.6rem 0.9rem;
                    border-radius: 0.9rem;
                    background: transparent;
                    border: 1px solid ${Color.logoBlue(0.25)};
                    text-align: center;
                    min-width: 7rem;
                    @media (max-width: ${mobileMaxWidth}) {
                      margin-left: 0;
                    }
                  `}
                >
                  <div
                    className={css`
                      font-size: 1.8rem;
                      font-weight: 900;
                      color: ${Color.logoBlue()};
                    `}
                  >
                    {correctCount}/{totalTarget}
                  </div>
                  <div
                    className={css`
                      font-size: 0.9rem;
                      font-weight: 700;
                      color: ${Color.darkGray()};
                    `}
                  >
                    Correct
                  </div>
                </div>
              </div>

              {autoCollectBlocked && (
                <div
                  className={css`
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    padding: 0.6rem 0.8rem;
                    border-radius: 0.8rem;
                    background: transparent;
                    border: 1px solid ${Color.rose(0.3)};
                    color: ${Color.rose()};
                    font-size: 0.95rem;
                    font-weight: 700;
                  `}
                >
                  <Icon icon="lock" />
                  Word Master was blocked — correct answers were not collected.
                </div>
              )}
            </div>

            <div
              className={css`
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
                gap: 0.8rem;
              `}
            >
              {trophyCards.map((card) => {
                const toneColors = getToneColors(card.tone);
                return (
                  <div
                    key={card.label}
                    className={css`
                      display: flex;
                      flex-direction: column;
                      align-items: center;
                      gap: 0.4rem;
                      padding: 0.9rem;
                      border-radius: 1rem;
                      background: transparent;
                      border: 1px solid ${toneColors.border};
                      text-align: center;
                    `}
                  >
                    <div
                      className={css`
                        width: 2.4rem;
                        height: 2.4rem;
                        border-radius: 0.8rem;
                        background: ${toneColors.soft};
                        border: 1px dashed ${toneColors.border};
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: ${toneColors.color};
                        font-size: 1.1rem;
                      `}
                    >
                      <Icon icon={card.icon} />
                    </div>
                    <div
                      className={css`
                        font-size: 1.5rem;
                        font-weight: 900;
                        color: ${toneColors.color};
                      `}
                    >
                      {card.count}
                    </div>
                    <div
                      className={css`
                        font-size: 0.9rem;
                        font-weight: 700;
                        color: ${Color.darkerGray()};
                        text-transform: uppercase;
                        letter-spacing: 0.05rem;
                      `}
                    >
                      {card.label}
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              className={css`
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 0.8rem;
                flex-wrap: wrap;
              `}
            >
              <div
                className={css`
                  font-size: 1.2rem;
                  font-weight: 800;
                  color: ${Color.darkerGray()};
                `}
              >
                Quiz Logbook
              </div>
              <div
                className={css`
                  display: flex;
                  gap: 0.6rem;
                  flex-wrap: wrap;
                `}
              >
                {resultTabs.map((tab) => {
                  const isActive = resultTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setResultTab(tab.key)}
                      className={css`
                        display: inline-flex;
                        align-items: center;
                        gap: 0.4rem;
                        padding: 0.35rem 0.8rem;
                        border-radius: 999px;
                        border: 1px solid
                          ${isActive
                            ? Color.logoBlue(0.35)
                            : Color.borderGray()};
                        background: ${isActive
                          ? Color.logoBlue(0.12)
                          : Color.white()};
                        color: ${isActive
                          ? Color.logoBlue()
                          : Color.darkGray()};
                        font-weight: 700;
                        font-size: 0.95rem;
                        cursor: pointer;
                      `}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={css`
                          padding: 0 0.45rem;
                          border-radius: 999px;
                          background: ${Color.white()};
                          border: 1px solid ${Color.borderGray()};
                          font-size: 0.85rem;
                          color: ${Color.darkGray()};
                        `}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className={css`
                padding: 1rem;
                border-radius: 1.2rem;
                border: 1px solid ${Color.borderGray()};
                background: transparent;
              `}
            >
              <div
                className={css`
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  margin-bottom: 0.6rem;
                `}
              >
                <div
                  className={css`
                    font-size: 1.05rem;
                    font-weight: 700;
                    color: ${Color.darkerGray()};
                  `}
                >
                  Words
                </div>
                <div
                  className={css`
                    font-size: 0.9rem;
                    color: ${Color.gray()};
                    font-weight: 600;
                  `}
                >
                  {filteredResults.length} shown
                </div>
              </div>
              {filteredResults.length ? (
                <div
                  className={css`
                    display: flex;
                    flex-direction: column;
                    gap: 0.6rem;
                    max-height: 20rem;
                    overflow-y: auto;
                    padding-right: 0.2rem;
                    @media (max-width: ${mobileMaxWidth}) {
                      max-height: 18rem;
                    }
                  `}
                >
                  {filteredResults.map((result, index) => {
                    const levelInfo =
                      wordLevelHash[result.wordLevel] || wordLevelHash[3];
                    const wordColor =
                      Color[levelInfo.color as keyof typeof Color]?.() ||
                      Color.orange();
                    const meta = getResultMeta(result);
                    return (
                      <div
                        key={`${result.word}-${index}`}
                        className={css`
                          display: flex;
                          flex-direction: column;
                          gap: 0.5rem;
                          padding: 0.6rem 0;
                          border-bottom: 1px solid ${Color.borderGray()};

                          &:last-child {
                            border-bottom: none;
                          }
                        `}
                      >
                        <div
                          className={css`
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            gap: 0.8rem;
                            flex-wrap: wrap;
                          `}
                        >
                          <span
                            className={css`
                              font-size: 1.4rem;
                              font-weight: 800;
                              color: ${wordColor};
                              flex: 1;
                              min-width: 0;
                              overflow: hidden;
                              text-overflow: ellipsis;
                              white-space: nowrap;

                              @media (max-width: ${mobileMaxWidth}) {
                                font-size: 1.25rem;
                              }
                            `}
                          >
                            {result.word}
                          </span>
                          <WordMasterLevelBadge level={result.wordLevel} />
                        </div>
                        <div
                          className={css`
                            display: flex;
                            align-items: center;
                            gap: 0.6rem;
                            flex-wrap: wrap;
                          `}
                        >
                          <WordMasterStatusBadge
                            label={meta.label}
                            colorName={meta.badgeColorName}
                          />
                          {meta.note && (
                            <span
                              className={css`
                                font-size: 0.85rem;
                                color: ${Color.darkGray()};
                                line-height: 1.3;
                                display: -webkit-box;
                                -webkit-line-clamp: 2;
                                -webkit-box-orient: vertical;
                                overflow: hidden;
                              `}
                            >
                              {meta.note}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  className={css`
                    padding: 1.4rem 0;
                    text-align: center;
                    color: ${Color.gray()};
                    font-weight: 600;
                  `}
                >
                  No words in this tab yet.
                </div>
              )}
            </div>
          </div>
        ) : loadingText ? (
          <div
            className={css`
              display: flex;
              flex-direction: column;
              justify-content: center;
              min-height: 20rem;
              padding: 2rem;
            `}
          >
            <div
              className={css`
                font-size: 1.6rem;
                font-weight: 600;
                color: ${Color.darkerGray()};
                margin-bottom: 1.5rem;
                text-align: center;
              `}
            >
              {loadingText}
            </div>
            <ProgressBar
              progress={mockProgress}
              text=""
              style={{ width: '80%', margin: '0 auto' }}
            />
          </div>
        ) : loadError ? (
          <div
            className={css`
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 16rem;
              padding: 2rem;
              text-align: center;
            `}
          >
            <Icon
              icon="check-circle"
              style={{
                fontSize: '3rem',
                color: Color.green(),
                marginBottom: '1rem'
              }}
            />
            <div
              className={css`
                font-size: 1.5rem;
                font-weight: 600;
                color: ${Color.darkerGray()};
              `}
            >
              No words to collect
            </div>
            <div
              className={css`
                font-size: 1.2rem;
                color: ${Color.gray()};
                margin-top: 0.5rem;
              `}
            >
              All vocabulary from this story has already been collected
            </div>
          </div>
        ) : currentQuestion ? (
          <>
            <section
              className={css`
                padding: 1.4rem 1.6rem;
                border-radius: 1.2rem;
                background: ${Color.white()};
                border: 1px solid ${Color.borderGray()};
                display: flex;
                flex-direction: column;
                gap: 1rem;
                box-shadow: 0 10px 24px ${Color.black(0.06)};
              `}
            >
              <div
                className={css`
                  display: flex;
                  align-items: flex-start;
                  gap: 0.9rem;
                `}
              >
                <div
                  className={css`
                    width: 0.7rem;
                    height: 2.6rem;
                    border-radius: 999px;
                    background: ${currentQuestion.status === 'discoverable'
                      ? Color.gold()
                      : Color.green()};
                    margin-top: 0.2rem;
                  `}
                />
                <div
                  className={css`
                    font-size: 1.6rem;
                    font-weight: 700;
                    color: ${Color.darkerGray()};
                  `}
                >
                  AI Story Vocabulary
                </div>
              </div>
            </section>

            {autoCollectBlocked && (
              <section
                className={css`
                  padding: 1.2rem;
                  border-radius: 1.2rem;
                  background: ${Color.rose(0.08)};
                  border: 1px solid ${Color.rose(0.25)};
                  display: flex;
                  align-items: center;
                  gap: 0.8rem;
                  box-shadow: 0 10px 20px ${Color.black(0.04)};
                `}
              >
                <div
                  className={css`
                    width: 3rem;
                    height: 3rem;
                    border-radius: 50%;
                    background: ${Color.rose(0.15)};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: ${Color.rose()};
                    flex-shrink: 0;
                  `}
                >
                  <Icon icon="lock" />
                </div>
                <div>
                  <div
                    className={css`
                      font-size: 1.3rem;
                      font-weight: 700;
                      color: ${Color.rose()};
                    `}
                  >
                    Word Master blocked
                  </div>
                  <div
                    className={css`
                      font-size: 1.15rem;
                      color: ${Color.darkerGray()};
                      margin-top: 0.2rem;
                    `}
                  >
                    Correct answers will not be collected.
                  </div>
                </div>
              </section>
            )}

            <section
              className={css`
                padding: 1.8rem;
                border-radius: 1.2rem;
                border: 1px solid ${Color.borderGray()};
                background: ${Color.white()};
                display: flex;
                flex-direction: column;
                gap: 1.4rem;
                box-shadow: 0 10px 20px ${Color.black(0.04)};
              `}
            >
              {renderStatusMessage()}

              <MultipleChoiceQuestion
                question={
                  <SanitizedHTML
                    allowedAttributes={{ b: ['style'] }}
                    html={currentQuestion.question}
                  />
                }
                choices={currentQuestion.choices}
                isGraded={Boolean(answerResult)}
                selectedChoiceIndex={gradedSelectedIndex}
                answerIndex={Number(answerResult?.answerIndex || 0)}
                onSelectChoice={handleSelectChoice}
                allowReselect={false}
              />
            </section>
          </>
        ) : (
          <div
            className={css`
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 16rem;
              padding: 2rem;
              text-align: center;
            `}
          >
            <Icon
              icon="check-circle"
              style={{
                fontSize: '3rem',
                color: Color.green(),
                marginBottom: '1rem'
              }}
            />
            <div
              className={css`
                font-size: 1.5rem;
                font-weight: 600;
                color: ${Color.darkerGray()};
              `}
            >
              No words to collect
            </div>
            <div
              className={css`
                font-size: 1.2rem;
                color: ${Color.gray()};
                margin-top: 0.5rem;
              `}
            >
              All vocabulary from this story has already been collected
            </div>
          </div>
        )}

        <div
          className={css`
            display: flex;
            justify-content: ${showResults ? 'center' : 'flex-end'};
            gap: 1rem;
            border-top: 1px solid ${Color.borderGray()};
            padding-top: 1.5rem;
          `}
        >
          {showResults ? (
            <>
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
              <GameCTAButton
                variant="gold"
                icon="keyboard"
                shiny
                onClick={() => {
                  onClose();
                  navigate('/chat/vocabulary');
                }}
              >
                Word Master
              </GameCTAButton>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={onClose}
                disabled={submitting || loadingNextQuestion}
              >
                Close
              </Button>
              <GameCTAButton
                variant="success"
                icon={isLastQuestion ? 'check' : 'arrow-right'}
                shiny
                onClick={handleNext}
                disabled={!answerResult || submitting || loadingNextQuestion}
                loading={loadingNextQuestion}
              >
                {isLastQuestion ? 'Finish' : 'Next Word'}
              </GameCTAButton>
            </>
          )}
        </div>
      </div>
    </Modal>
  );

  function renderStatusMessage() {
    if (!answerResult) return null;

    // For collected/discovered, show word with level color
    if (
      answerResult.isCorrect &&
      (answerResult.collected || answerResult.discovered)
    ) {
      const isDiscovered = answerResult.discovered;
      const word = currentQuestion?.word || '';
      const wordLevel = currentQuestion?.wordLevel || 3;
      const levelInfo = wordLevelHash[wordLevel] || wordLevelHash[3];
      const wordColor =
        Color[levelInfo.color as keyof typeof Color]?.() || Color.orange();
      const actionColor = isDiscovered ? Color.gold() : Color.green();

      return (
        <div
          className={css`
            font-size: 1.2rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          `}
        >
          <Icon icon="check-circle" style={{ color: actionColor }} />
          <span style={{ color: actionColor }}>
            {isDiscovered ? 'Discovered' : 'Collected'}
          </span>
          <span style={{ color: wordColor, fontStyle: 'italic' }}>{word}</span>
        </div>
      );
    }

    // For warning/error messages
    if (statusMessage) {
      return (
        <div
          className={css`
            font-size: 1.2rem;
            font-weight: 700;
            color: ${statusTone === 'error'
              ? Color.rose()
              : statusTone === 'warning'
              ? Color.orange()
              : Color.green()};
            display: flex;
            align-items: center;
            gap: 0.5rem;
          `}
        >
          <Icon
            icon={
              statusTone === 'error'
                ? 'times-circle'
                : statusTone === 'warning'
                ? 'exclamation-circle'
                : 'check-circle'
            }
          />
          {statusMessage}
        </div>
      );
    }

    return null;
  }

  function handleNext() {
    if (submitting || loadingNextQuestion) return;
    if (isLastQuestion) {
      setShowResults(true);
      return;
    }
    // Move to next question index
    setCurrentIndex((prev) => prev + 1);
    // Request next question from server (on-demand generation)
    setLoadingNextQuestion(true);
    socket.emit('request_next_ai_story_vocab_question', { storyId });
  }

  function handleSelectChoice(index: number) {
    if (!currentQuestion || submitting) return;
    if (selectedIndex !== null) return;
    setSelectedIndex(index);
    setSubmitting(true);
    setStatusMessage('');
    setStatusTone('neutral');

    submitAIStoryVocabQuizAnswer({
      storyId,
      questionId: currentQuestion.id,
      selectedIndex: index
    })
      .then((data: any) => {
        const result = data?.result || null;
        setAnswerResult(result);
        if (!result) {
          setStatusMessage('Unable to check the answer right now.');
          setStatusTone('error');
          setSelectedIndex(null);
          return;
        }

        if (result.isCorrect) {
          if (result.blocked || result.alreadyCollected || result.censored) {
            const message =
              result.message ||
              (result.blocked
                ? 'Correct (blocked)'
                : result.alreadyCollected
                ? 'Already collected'
                : 'Cannot collect');
            setStatusMessage(message);
            setStatusTone('warning');
          } else if (result.collected || result.discovered) {
            setStatusMessage('');
            setStatusTone('success');
          } else {
            setStatusMessage('Correct!');
            setStatusTone('success');
          }
        } else {
          setStatusMessage('');
          setStatusTone('error');
        }

        // Store result for summary screen
        setQuizResults((prev) => [
          ...prev,
          {
            word: currentQuestion.word,
            wordLevel: currentQuestion.wordLevel || 3,
            isCorrect: result.isCorrect,
            collected: result.collected || false,
            discovered: result.discovered || false,
            blocked: result.blocked || false,
            alreadyCollected: result.alreadyCollected || false,
            censored: result.censored || false,
            message: result.message
          }
        ]);

        const nextState: Record<string, number> = {};
        if (typeof data?.coins === 'number') {
          nextState.twinkleCoins = data.coins;
        }
        if (typeof data?.xp === 'number') {
          nextState.twinkleXP = data.xp;
        }
        if (userId && Object.keys(nextState).length > 0) {
          onSetUserState({ userId, newState: nextState });
        }
      })
      .catch((error: any) => {
        console.error(error);
        setStatusMessage('Error submitting answer');
        setStatusTone('error');
        setSelectedIndex(null);
      })
      .finally(() => {
        setSubmitting(false);
      });
  }
}

interface ToneColors {
  color: string;
  soft: string;
  border: string;
}

interface ResultMeta {
  label: string;
  tone: ResultTone;
  badgeColorName: string;
  note?: string;
}

function getToneColors(tone: ResultTone): ToneColors {
  switch (tone) {
    case 'collected':
      return {
        color: Color.green(),
        soft: Color.green(0.12),
        border: Color.green(0.35)
      };
    case 'discovered':
      return {
        color: Color.gold(),
        soft: Color.gold(0.16),
        border: Color.gold(0.4)
      };
    case 'blocked':
      return {
        color: Color.orange(),
        soft: Color.orange(0.14),
        border: Color.orange(0.4)
      };
    case 'already_collected':
      return {
        color: Color.logoBlue(),
        soft: Color.logoBlue(0.12),
        border: Color.logoBlue(0.35)
      };
    case 'censored':
      return {
        color: Color.darkGray(),
        soft: Color.borderGray(0.2),
        border: Color.gray(0.4)
      };
    case 'missed':
      return {
        color: Color.rose(),
        soft: Color.rose(0.12),
        border: Color.rose(0.35)
      };
    default:
      return {
        color: Color.logoBlue(),
        soft: Color.logoBlue(0.12),
        border: Color.logoBlue(0.35)
      };
  }
}

function getResultMeta(result: QuizResult): ResultMeta {
  if (!result.isCorrect) {
    return {
      label: 'Missed',
      tone: 'missed',
      badgeColorName: 'red',
      note: result.message || 'Type in Word Master to collect'
    };
  }
  if (result.discovered) {
    return {
      label: 'Discovered',
      tone: 'discovered',
      badgeColorName: getActionColor('register'),
      note: result.message || undefined
    };
  }
  if (result.collected) {
    return {
      label: 'Collected',
      tone: 'collected',
      badgeColorName: getActionColor('hit'),
      note: result.message || undefined
    };
  }
  if (result.blocked) {
    return {
      label: 'Blocked',
      tone: 'blocked',
      badgeColorName: 'orange',
      note: result.message || 'Word Master is blocked right now'
    };
  }
  if (result.alreadyCollected) {
    return {
      label: 'Already collected',
      tone: 'already_collected',
      badgeColorName: 'logoBlue',
      note: result.message || 'Already in your Word Master collection'
    };
  }
  if (result.censored) {
    return {
      label: 'Filtered',
      tone: 'censored',
      badgeColorName: 'passionFruit',
      note: result.message || 'Cannot collect this word'
    };
  }
  return {
    label: 'Correct',
    tone: 'correct',
    badgeColorName: 'limeGreen',
    note: result.message || undefined
  };
}

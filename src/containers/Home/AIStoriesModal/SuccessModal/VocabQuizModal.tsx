import React, { useEffect, useMemo, useState, useRef } from 'react';
import Modal from '~/components/Modal';
import LegacyModalLayout from '~/components/Modal/LegacyModalLayout';
import Button from '~/components/Button';
import Loading from '~/components/Loading';
import MultipleChoiceQuestion from '~/components/MultipleChoiceQuestion';
import { useAppContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { Color, borderRadius } from '~/constants/css';
import { socket } from '~/constants/sockets/api';

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

export default function VocabQuizModal({
  isOpen,
  onClose,
  storyId
}: {
  isOpen: boolean;
  onClose: () => void;
  storyId: number;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const submitAIStoryVocabQuizAnswer = useAppContext(
    (v) => v.requestHelpers.submitAIStoryVocabQuizAnswer
  );

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [collectableCount, setCollectableCount] = useState(0);
  const [discoverableCount, setDiscoverableCount] = useState(0);
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
  const [generationComplete, setGenerationComplete] = useState(false);

  const storyIdRef = useRef(storyId);

  const currentQuestion = questions[currentIndex] || null;
  const isLastQuestion =
    generationComplete && currentIndex + 1 >= questions.length;
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
    setGenerationComplete(false);
    setAutoCollectBlocked(false);

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
      setCollectableCount(data.collectableCount);
      setDiscoverableCount(data.discoverableCount);
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
    }

    function handleQuizComplete(data: { storyId: number }) {
      if (data.storyId !== storyIdRef.current) return;
      setGenerationComplete(true);
    }

    function handleQuizError(data: { storyId: number; error: string }) {
      if (data.storyId !== storyIdRef.current) return;
      setLoadError(data.error || 'Failed to load quiz');
      setLoading(false);
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

  const statusColor = useMemo(() => {
    if (statusTone === 'success') return Color.green();
    if (statusTone === 'warning') return Color.orange();
    if (statusTone === 'error') return Color.rose();
    return Color.darkerGray();
  }, [statusTone]);

  const displayedTotalQuestions = totalQuestions || questions.length;
  const waitingForQuestion = !currentQuestion && !loadError && !loading;

  return (
    <Modal
      modalKey="VocabQuizModal"
      isOpen={isOpen}
      onClose={submitting ? () => null : onClose}
      size="lg"
      modalLevel={3}
      hasHeader={false}
      closeOnBackdropClick={!submitting}
      bodyPadding={0}
      allowOverflow
    >
      <LegacyModalLayout wrapped>
        <header>Word Master Quiz</header>
        <main>
          {loading ? (
            <Loading text="Starting quiz..." />
          ) : loadError ? (
            <div
              className={css`
                color: ${Color.rose()};
                font-size: 1.4rem;
                font-weight: 600;
                padding: 1rem 0;
              `}
            >
              {loadError}
            </div>
          ) : waitingForQuestion ? (
            <Loading text="Generating first question..." />
          ) : currentQuestion ? (
            <div
              className={css`
                width: 100%;
                display: flex;
                flex-direction: column;
                gap: 1.4rem;
              `}
            >
              {autoCollectBlocked && (
                <div
                  className={css`
                    padding: 0.9rem 1.1rem;
                    border-radius: ${borderRadius};
                    background: ${Color.rose(0.08)};
                    border: 1px solid ${Color.rose(0.3)};
                    color: ${Color.rose()};
                    font-weight: 600;
                    font-size: 1.2rem;
                    text-align: center;
                  `}
                >
                  Word Master is blocked right now. Correct answers will not
                  auto collect.
                </div>
              )}

              <div
                className={css`
                  display: flex;
                  flex-wrap: wrap;
                  align-items: center;
                  justify-content: space-between;
                  gap: 0.8rem;
                  font-size: 1.2rem;
                  font-weight: 700;
                  color: ${Color.darkerGray()};
                `}
              >
                <div>
                  Question {currentIndex + 1} of {displayedTotalQuestions}
                  {!generationComplete && (
                    <span
                      className={css`
                        color: ${Color.gray()};
                        font-weight: 500;
                        margin-left: 0.5rem;
                      `}
                    >
                      (generating...)
                    </span>
                  )}
                </div>
                {collectableCount > 0 || discoverableCount > 0 ? (
                  <div>
                    {collectableCount} collectable / {discoverableCount}{' '}
                    discoverable
                  </div>
                ) : null}
              </div>

              <section
                className={css`
                  padding: 1.5rem 1.6rem;
                  border-radius: ${borderRadius};
                  border: 1px solid ${Color.borderGray()};
                  background: ${Color.white()};
                  box-shadow: 0 10px 20px ${Color.black(0.04)};
                `}
              >
                <MultipleChoiceQuestion
                  question={currentQuestion.question}
                  choices={currentQuestion.choices}
                  isGraded={Boolean(answerResult)}
                  selectedChoiceIndex={gradedSelectedIndex}
                  answerIndex={Number(answerResult?.answerIndex || 0)}
                  onSelectChoice={handleSelectChoice}
                  allowReselect={false}
                />
              </section>

              {statusMessage && (
                <div
                  className={css`
                    font-size: 1.3rem;
                    font-weight: 600;
                    color: ${statusColor};
                    text-align: center;
                    padding: 0.5rem 0;
                  `}
                >
                  {statusMessage}
                </div>
              )}
            </div>
          ) : (
            <div
              className={css`
                font-size: 1.4rem;
                font-weight: 600;
                color: ${Color.darkerGray()};
              `}
            >
              No questions available.
            </div>
          )}
        </main>
        <footer>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Close
          </Button>
          <Button
            color="logoBlue"
            variant="solid"
            uppercase={false}
            size="lg"
            onClick={handleNext}
            disabled={
              !answerResult ||
              submitting ||
              (!isLastQuestion && currentIndex + 1 >= questions.length)
            }
          >
            {isLastQuestion ? 'Finish' : 'Next Word'}
          </Button>
        </footer>
      </LegacyModalLayout>
    </Modal>
  );

  function handleNext() {
    if (submitting) return;
    if (isLastQuestion) {
      onClose();
      return;
    }
    setCurrentIndex((prev) => prev + 1);
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
          const message =
            result.message ||
            (result.blocked
              ? 'Correct, but Word Master is blocked.'
              : result.alreadyCollected
                ? 'Correct, but this word was already collected.'
                : result.censored
                  ? 'Correct, but this word cannot be collected.'
                  : result.collected
                    ? 'Collected!'
                    : result.discovered
                      ? 'Discovered!'
                      : 'Correct!');
          setStatusMessage(message);
          setStatusTone(
            result.blocked || result.alreadyCollected || result.censored
              ? 'warning'
              : 'success'
          );
        } else {
          setStatusMessage('Correct answer shown below.');
          setStatusTone('error');
        }

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
        setStatusMessage('Unable to submit the answer right now.');
        setStatusTone('error');
        setSelectedIndex(null);
      })
      .finally(() => {
        setSubmitting(false);
      });
  }
}

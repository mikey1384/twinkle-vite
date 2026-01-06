import React, { useEffect, useMemo, useState } from 'react';
import Modal from '~/components/Modal';
import LegacyModalLayout from '~/components/Modal/LegacyModalLayout';
import Button from '~/components/Button';
import Loading from '~/components/Loading';
import MultipleChoiceQuestion from '~/components/MultipleChoiceQuestion';
import { useAppContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { Color, borderRadius } from '~/constants/css';

interface QuizQuestion {
  id: number;
  word: string;
  question: string;
  choices: string[];
}

interface QuizPayload {
  totalQuestions: number;
  questions: QuizQuestion[];
  autoCollectBlocked?: boolean;
  collectableCount?: number;
  discoverableCount?: number;
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
  const loadAIStoryVocabQuiz = useAppContext(
    (v) => v.requestHelpers.loadAIStoryVocabQuiz
  );
  const submitAIStoryVocabQuizAnswer = useAppContext(
    (v) => v.requestHelpers.submitAIStoryVocabQuizAnswer
  );

  const [quiz, setQuiz] = useState<QuizPayload | null>(null);
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

  const questions = quiz?.questions || [];
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex] || null;
  const isLastQuestion = currentIndex + 1 >= totalQuestions;
  const gradedSelectedIndex =
    typeof answerResult?.selectedIndex === 'number'
      ? answerResult.selectedIndex
      : selectedIndex;

  useEffect(() => {
    if (!isOpen) return;
    if (!storyId) {
      setLoadError('Story is unavailable.');
      return;
    }
    let isMounted = true;
    setLoading(true);
    setLoadError('');
    setQuiz(null);
    setCurrentIndex(0);
    setSelectedIndex(null);
    setAnswerResult(null);
    setStatusMessage('');
    setStatusTone('neutral');

    loadAIStoryVocabQuiz(storyId)
      .then((data: any) => {
        if (!isMounted) return;
        if (data?.quiz?.questions?.length) {
          setQuiz(data.quiz);
          return;
        }
        setLoadError(data?.message || 'No quiz available for this story.');
      })
      .catch((error: any) => {
        console.error(error);
        if (isMounted) {
          setLoadError('Failed to load the quiz. Please try again.');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return (
    <Modal
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
            <Loading text="Preparing quiz..." />
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
          ) : currentQuestion ? (
            <div
              className={css`
                width: 100%;
                display: flex;
                flex-direction: column;
                gap: 1.4rem;
              `}
            >
              {quiz?.autoCollectBlocked && (
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
                  Question {currentIndex + 1} of {totalQuestions}
                </div>
                {typeof quiz?.collectableCount === 'number' &&
                  typeof quiz?.discoverableCount === 'number' && (
                    <div>
                      {quiz.collectableCount} collectable /{' '}
                      {quiz.discoverableCount} discoverable
                    </div>
                  )}
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
            disabled={!answerResult || submitting}
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

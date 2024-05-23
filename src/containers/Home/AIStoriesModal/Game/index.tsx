import React, { useState } from 'react';
import Listening from './Listening';
import MainMenu from './MainMenu';
import Reading from './Reading';
import SuccessModal from './SuccessModal';
import { useAppContext, useKeyContext } from '~/contexts';

const rewardTable = {
  1: {
    xp: 500,
    coins: 25
  },
  2: {
    xp: 1000,
    coins: 50
  },
  3: {
    xp: 2500,
    coins: 75
  },
  4: {
    xp: 5000,
    coins: 150
  },
  5: {
    xp: 10000,
    coins: 200
  }
};

export default function Game({
  attemptId,
  difficulty,
  displayedSection,
  isGameStarted,
  imageGeneratedCount,
  loadingTopic,
  MainRef,
  onLoadTopic,
  onSetAttemptId,
  onSetIsGameStarted,
  onSetResetNumber,
  onSetDifficulty,
  onSetDisplayedSection,
  onSetDropdownShown,
  onSetIsCloseLocked,
  onSetTopicLoadError,
  storyType,
  topic,
  topicKey,
  topicLoadError
}: {
  attemptId: number;
  difficulty: number;
  displayedSection: string;
  isGameStarted: boolean;
  imageGeneratedCount: number;
  loadingTopic: boolean;
  MainRef: React.RefObject<any>;
  onLoadTopic: (v: any) => void;
  onSetAttemptId: (v: number) => void;
  onSetIsGameStarted: (v: boolean) => void;
  onSetResetNumber: (v: any) => void;
  onSetDifficulty: (v: number) => void;
  onSetDisplayedSection: (v: string) => void;
  onSetDropdownShown: (v: boolean) => void;
  onSetIsCloseLocked: (v: boolean) => void;
  onSetTopicLoadError: (v: boolean) => void;
  storyType: string;
  topic: string;
  topicKey: string;
  topicLoadError: boolean;
}) {
  const { userId } = useKeyContext((v) => v.myState);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const loadAIStoryQuestions = useAppContext(
    (v) => v.requestHelpers.loadAIStoryQuestions
  );
  const uploadAIStoryAttempt = useAppContext(
    (v) => v.requestHelpers.uploadAIStoryAttempt
  );
  const [story, setStory] = useState('');
  const [explanation, setExplanation] = useState('');
  const [loadStoryComplete, setLoadStoryComplete] = useState(false);
  const [gameMode, setGameMode] = useState('read');
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionsLoadError, setQuestionsLoadError] = useState(false);
  const [questionsButtonEnabled, setQuestionsButtonEnabled] = useState(false);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [successModalShown, setSuccessModalShown] = useState(false);
  const [storyId, setStoryId] = useState(0);
  const [userChoiceObj, setUserChoiceObj] = useState<Record<number, number>>(
    {}
  );
  const [solveObj, setSolveObj] = useState({
    numCorrect: 0,
    isGraded: false
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      {!isGameStarted ? (
        <MainMenu
          difficulty={difficulty}
          onLoadTopic={onLoadTopic}
          loadingTopic={loadingTopic}
          topicLoadError={topicLoadError}
          onSetDifficulty={onSetDifficulty}
          onSetDropdownShown={onSetDropdownShown}
          onSetTopicLoadError={onSetTopicLoadError}
          onStart={(mode: string) => {
            setGameMode(mode);
            onSetIsGameStarted(true);
          }}
        />
      ) : (
        <div style={{ height: '100%', width: '100%' }}>
          {gameMode === 'read' ? (
            <Reading
              difficulty={difficulty}
              displayedSection={displayedSection}
              explanation={explanation}
              isGrading={isGrading}
              loadStoryComplete={loadStoryComplete}
              MainRef={MainRef}
              onGrade={handleGrade}
              onLoadQuestions={handleLoadQuestions}
              onSetDisplayedSection={onSetDisplayedSection}
              onReset={handleReset}
              onSetAttemptId={onSetAttemptId}
              onSetIsCloseLocked={onSetIsCloseLocked}
              onSetQuestionsButtonEnabled={setQuestionsButtonEnabled}
              onSetStory={setStory}
              onSetExplanation={setExplanation}
              onSetLoadStoryComplete={setLoadStoryComplete}
              onSetSolveObj={setSolveObj}
              onSetStoryId={setStoryId}
              onSetUserChoiceObj={setUserChoiceObj}
              questions={questions}
              questionsLoaded={questionsLoaded}
              questionsButtonEnabled={questionsButtonEnabled}
              questionsLoadError={questionsLoadError}
              solveObj={solveObj}
              story={story}
              storyId={storyId}
              storyType={storyType}
              topic={topic}
              topicKey={topicKey}
              userChoiceObj={userChoiceObj}
            />
          ) : (
            <Listening
              difficulty={difficulty}
              isGrading={isGrading}
              onLoadQuestions={handleLoadQuestions}
              onGrade={handleGrade}
              onReset={handleReset}
              onSetAttemptId={onSetAttemptId}
              onSetUserChoiceObj={setUserChoiceObj}
              onSetStoryId={setStoryId}
              questions={questions}
              questionsLoaded={questionsLoaded}
              questionsLoadError={questionsLoadError}
              storyId={storyId}
              solveObj={solveObj}
              topic={topic}
              topicKey={topicKey}
              type={storyType}
              userChoiceObj={userChoiceObj}
            />
          )}
        </div>
      )}
      {successModalShown && (
        <SuccessModal
          imageGeneratedCount={imageGeneratedCount}
          onHide={() => setSuccessModalShown(false)}
          numQuestions={questions.length}
          difficulty={difficulty}
          rewardTable={rewardTable}
          storyId={storyId}
        />
      )}
    </div>
  );

  async function handleGrade() {
    let numCorrect = 0;
    const result = [];
    for (const question of questions) {
      const userChoice = userChoiceObj[question.id];
      if (userChoice === question.answerIndex) {
        numCorrect++;
      }
      result.push({
        questionId: question.id,
        isCorrect: userChoice === question.answerIndex
      });
    }
    const isPassed = numCorrect === questions.length;
    try {
      setIsGrading(true);
      const { newXp, newCoins } = await uploadAIStoryAttempt({
        attemptId,
        difficulty,
        result,
        isPassed
      });
      if (newXp && newCoins) {
        onSetUserState({
          userId,
          newState: { twinkleCoins: newCoins, twinkleXP: newXp }
        });
      }
      setSolveObj({
        numCorrect,
        isGraded: true
      });
      if (isPassed) {
        setSuccessModalShown(true);
      }
      setIsGrading(false);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleLoadQuestions(storyId: number) {
    setQuestionsLoadError(false);
    if (questionsLoaded) return;
    try {
      const questions = await loadAIStoryQuestions(storyId);
      setQuestions(questions);
      setQuestionsLoaded(true);
    } catch (error) {
      console.error(error);
      setQuestionsLoadError(true);
    }
  }

  function handleReset() {
    onSetResetNumber((prevNumber: number) => prevNumber + 1);
    setStoryId(0);
    setStory('');
    setExplanation('');
    setLoadStoryComplete(false);
    onSetIsCloseLocked(false);
    setQuestionsLoaded(false);
    setQuestionsButtonEnabled(false);
    setQuestions([]);
    onSetDisplayedSection('story');
    setUserChoiceObj({});
    setSolveObj({
      numCorrect: 0,
      isGraded: false
    });
    onSetIsGameStarted(false);
  }
}

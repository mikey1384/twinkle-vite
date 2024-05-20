import React, { useState } from 'react';
import Button from '~/components/Button';
import Listening from './Listening';
import MainMenu from './MainMenu';
import Reading from './Reading';

export default function Game({
  attemptId,
  difficulty,
  displayedSection,
  isGameStarted,
  explanation,
  imageGeneratedCount,
  loadStoryComplete,
  loadingTopic,
  MainRef,
  onLoadTopic,
  onHide,
  onSetAttemptId,
  onSetIsGameStarted,
  onSetResetNumber,
  onSetDifficulty,
  onSetDisplayedSection,
  onSetDropdownShown,
  onSetExplanation,
  onSetLoadStoryComplete,
  onSetSolveObj,
  onSetStoryLoadError,
  onSetUserChoiceObj,
  onSetQuestions,
  onSetQuestionsButtonEnabled,
  onSetQuestionsLoaded,
  onSetTopicLoadError,
  questions,
  questionsButtonEnabled,
  questionsLoaded,
  questionsLoadError,
  onLoadQuestions,
  onSetStory,
  onSetStoryId,
  solveObj,
  storyLoadError,
  story,
  storyId,
  storyType,
  topic,
  topicKey,
  topicLoadError,
  userChoiceObj
}: {
  attemptId: number;
  difficulty: number;
  displayedSection: string;
  explanation: string;
  isGameStarted: boolean;
  imageGeneratedCount: number;
  loadStoryComplete: boolean;
  loadingTopic: boolean;
  MainRef: React.RefObject<any>;
  onHide: () => void;
  onLoadQuestions: () => void;
  onLoadTopic: (v: any) => void;
  onSetAttemptId: (v: number) => void;
  onSetDifficulty: (v: number) => void;
  onSetDropdownShown: (v: boolean) => void;
  onSetDisplayedSection: (v: string) => void;
  onSetExplanation: (v: string) => void;
  onSetIsGameStarted: (v: boolean) => void;
  onSetLoadStoryComplete: (v: boolean) => void;
  onSetTopicLoadError: (v: boolean) => void;
  onSetQuestions: (v: any) => void;
  onSetQuestionsButtonEnabled: (v: boolean) => void;
  onSetQuestionsLoaded: (v: boolean) => void;
  onSetQuestionsLoadError: (v: boolean) => void;
  onSetResetNumber: (v: any) => void;
  onSetSolveObj: (v: any) => void;
  onSetStory: (v: string) => void;
  onSetStoryId: (v: number) => void;
  onSetStoryLoadError: (v: boolean) => void;
  onSetUserChoiceObj: (v: any) => void;
  questions: any[];
  questionsButtonEnabled: boolean;
  questionsLoaded: boolean;
  questionsLoadError: boolean;
  solveObj: any;
  story: string;
  storyId: number;
  storyLoadError: boolean;
  storyType: string;
  topic: string;
  topicKey: string;
  topicLoadError: boolean;
  userChoiceObj: any;
}) {
  const [gameMode, setGameMode] = useState('read');
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
          loadingTopic={loadingTopic}
          onSetDifficulty={onSetDifficulty}
          onSetDropdownShown={onSetDropdownShown}
          onStart={(mode: string) => {
            setGameMode(mode);
            onSetIsGameStarted(true);
          }}
        />
      ) : (
        <div style={{ height: '100%', width: '100%' }}>
          {gameMode === 'read' ? (
            <Reading
              attemptId={attemptId}
              difficulty={Number(difficulty)}
              displayedSection={displayedSection}
              explanation={explanation}
              imageGeneratedCount={imageGeneratedCount}
              loadStoryComplete={loadStoryComplete}
              MainRef={MainRef}
              onLoadQuestions={onLoadQuestions}
              onLoadTopic={onLoadTopic}
              onSetDisplayedSection={onSetDisplayedSection}
              onSetStoryLoadError={onSetStoryLoadError}
              onSetTopicLoadError={onSetTopicLoadError}
              onSetUserChoiceObj={onSetUserChoiceObj}
              onSetSolveObj={onSetSolveObj}
              onSetQuestions={onSetQuestions}
              onSetQuestionsButtonEnabled={onSetQuestionsButtonEnabled}
              onSetQuestionsLoaded={onSetQuestionsLoaded}
              onSetAttemptId={onSetAttemptId}
              handleReset={handleReset}
              onSetExplanation={onSetExplanation}
              onSetLoadStoryComplete={onSetLoadStoryComplete}
              onSetStory={onSetStory}
              onSetStoryId={onSetStoryId}
              questions={questions}
              questionsButtonEnabled={questionsButtonEnabled}
              questionsLoaded={questionsLoaded}
              questionsLoadError={questionsLoadError}
              solveObj={solveObj}
              story={story}
              storyId={storyId}
              storyLoadError={storyLoadError}
              storyType={storyType}
              topic={topic}
              topicKey={topicKey}
              topicLoadError={topicLoadError}
              userChoiceObj={userChoiceObj}
            />
          ) : (
            <Listening />
          )}
          {isGameStarted && (
            <div
              style={{
                marginTop: storyLoadError ? '1rem' : '13rem',
                padding: '2rem',
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <Button transparent onClick={onHide}>
                close
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  function handleReset() {
    onSetResetNumber((prevNumber: number) => prevNumber + 1);
    onSetStoryId(0);
    onSetStory('');
    onSetExplanation('');
    onSetLoadStoryComplete(false);
    onSetQuestionsLoaded(false);
    onSetQuestionsButtonEnabled(false);
    onSetQuestions([]);
    onSetDisplayedSection('story');
    onSetUserChoiceObj({});
    onSetSolveObj({
      numCorrect: 0,
      isGraded: false
    });
    onSetIsGameStarted(false);
  }
}

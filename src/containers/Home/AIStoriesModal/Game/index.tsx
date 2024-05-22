import React, { useState } from 'react';
import Listening from './Listening';
import MainMenu from './MainMenu';
import Reading from './Reading';

export default function Game({
  attemptId,
  difficulty,
  displayedSection,
  isGameStarted,
  imageGeneratedCount,
  loadingTopic,
  MainRef,
  onSetAttemptId,
  onSetIsGameStarted,
  onSetResetNumber,
  onSetDifficulty,
  onSetDisplayedSection,
  onSetDropdownShown,
  onSetIsCloseLocked,
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
  onSetAttemptId: (v: number) => void;
  onSetIsGameStarted: (v: boolean) => void;
  onSetResetNumber: (v: any) => void;
  onSetDifficulty: (v: number) => void;
  onSetDisplayedSection: (v: string) => void;
  onSetDropdownShown: (v: boolean) => void;
  onSetIsCloseLocked: (v: boolean) => void;
  storyType: string;
  topic: string;
  topicKey: string;
  topicLoadError: boolean;
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
              attemptId={attemptId}
              difficulty={Number(difficulty)}
              displayedSection={displayedSection}
              explanation={explanation}
              imageGeneratedCount={imageGeneratedCount}
              loadStoryComplete={loadStoryComplete}
              MainRef={MainRef}
              onLoadQuestions={onLoadQuestions}
              onSetDisplayedSection={onSetDisplayedSection}
              onSetIsGameStarted={onSetIsGameStarted}
              onSetStoryLoadError={onSetStoryLoadError}
              onSetUserChoiceObj={onSetUserChoiceObj}
              onSetSolveObj={onSetSolveObj}
              onSetQuestions={onSetQuestions}
              onSetQuestionsButtonEnabled={onSetQuestionsButtonEnabled}
              onSetQuestionsLoaded={onSetQuestionsLoaded}
              onSetAttemptId={onSetAttemptId}
              onSetExplanation={onSetExplanation}
              onSetIsCloseLocked={onSetIsCloseLocked}
              onSetResetNumber={onSetResetNumber}
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
            <Listening difficulty={difficulty} />
          )}
        </div>
      )}
    </div>
  );
}

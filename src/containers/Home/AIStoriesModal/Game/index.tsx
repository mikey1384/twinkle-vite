import React, { useState } from 'react';
import Button from '~/components/Button';
import Listening from './Listening';
import MainMenu from './MainMenu';
import Reading from './Reading';

export default function Game({
  attemptId,
  difficulty,
  displayedSection,
  explanation,
  imageGeneratedCount,
  generateButtonPressed,
  loadStoryComplete,
  loadingTopic,
  MainRef,
  onLoadTopic,
  onHide,
  onSetAttemptId,
  onSetResetNumber,
  onSetDifficulty,
  onSetDisplayedSection,
  onSetDropdownShown,
  onSetExplanation,
  onSetGenerateButtonPressed,
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
  imageGeneratedCount: number;
  generateButtonPressed: boolean;
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
  onSetGenerateButtonPressed: (v: boolean) => void;
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
  const [mode, setMode] = useState('read');
  const [started, setStarted] = useState(false);

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
      {!started ? (
        <MainMenu
          difficulty={difficulty}
          onSetDifficulty={onSetDifficulty}
          onSetDropdownShown={onSetDropdownShown}
          mode={mode}
          onSetMode={setMode}
          onStart={() => setStarted(true)}
        />
      ) : (
        <div style={{ height: '100%', width: '100%' }}>
          {mode === 'read' ? (
            <Reading
              attemptId={attemptId}
              difficulty={Number(difficulty)}
              displayedSection={displayedSection}
              explanation={explanation}
              imageGeneratedCount={imageGeneratedCount}
              generateButtonPressed={generateButtonPressed}
              loadStoryComplete={loadStoryComplete}
              loadingTopic={loadingTopic}
              MainRef={MainRef}
              onLoadQuestions={onLoadQuestions}
              onLoadTopic={onLoadTopic}
              onSetDisplayedSection={onSetDisplayedSection}
              onSetGenerateButtonPressed={onSetGenerateButtonPressed}
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
          {generateButtonPressed && (
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
    onSetGenerateButtonPressed(false);
  }
}

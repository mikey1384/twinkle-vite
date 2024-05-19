import React, { useState } from 'react';
import Button from '~/components/Button';
import ContentContainer from './ContentContainer';
import Listening from './Listening';
import DropdownButton from '~/components/Buttons/DropdownButton';
import GradientButton from '~/components/Buttons/GradientButton';
import { useAppContext } from '~/contexts';
import { socket } from '~/constants/io';

const levelHash: { [key: string]: string } = {
  1: 'Level 1 (AR 1)',
  2: 'Level 2 (AR 5)',
  3: 'Level 3 (TOEFL JR)',
  4: 'Level 4 (TOEFL)',
  5: 'Level 5 (SAT)'
};

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
  onSetDropdownShown,
  onSetDisplayedSection,
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
  onSetDisplayedSection: (v: string) => void;
  onSetDropdownShown: (v: boolean) => void;
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
  const loadAIStory = useAppContext((v) => v.requestHelpers.loadAIStory);
  const [mode, setMode] = useState('read');

  const modeOptions = [
    { label: 'Read', value: 'read' },
    { label: 'Listen', value: 'listen' }
  ];

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
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '1rem'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '1rem',
            gap: '1rem'
          }}
        >
          <DropdownButton
            skeuomorphic
            color="darkerGray"
            icon="caret-down"
            text={levelHash[difficulty]}
            onDropdownShown={onSetDropdownShown}
            menuProps={[
              {
                label: levelHash[1],
                onClick: () => onSetDifficulty(1)
              },
              {
                label: levelHash[2],
                onClick: () => onSetDifficulty(2)
              },
              {
                label: levelHash[3],
                onClick: () => onSetDifficulty(3)
              },
              {
                label: levelHash[4],
                onClick: () => onSetDifficulty(4)
              },
              {
                label: levelHash[5],
                onClick: () => onSetDifficulty(5)
              }
            ]}
          />
          <DropdownButton
            skeuomorphic
            color="darkerGray"
            icon="caret-down"
            text={mode}
            onDropdownShown={onSetDropdownShown}
            menuProps={modeOptions.map((option) => ({
              label: option.label,
              onClick: () => setMode(option.value)
            }))}
          />
        </div>
      </div>
      <div>
        {mode === 'read' ? (
          <>
            {storyLoadError ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  height: '100%',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <p style={{ fontWeight: 'bold', fontSize: '1.7rem' }}>
                  Oops, something went wrong. Try again
                </p>
                <GradientButton
                  style={{ marginTop: '5rem' }}
                  onClick={() => handleGenerateStory(true)}
                >
                  Retry
                </GradientButton>
              </div>
            ) : generateButtonPressed ? (
              <ContentContainer
                attemptId={attemptId}
                difficulty={Number(difficulty)}
                displayedSection={displayedSection}
                explanation={explanation}
                imageGeneratedCount={imageGeneratedCount}
                loading={story?.length < 10}
                loadComplete={loadStoryComplete}
                questions={questions}
                questionsButtonEnabled={questionsButtonEnabled}
                questionsLoadError={questionsLoadError}
                onLoadQuestions={onLoadQuestions}
                onSetDisplayedSection={onSetDisplayedSection}
                onSetUserChoiceObj={onSetUserChoiceObj}
                onScrollToTop={() => (MainRef.current.scrollTop = 0)}
                onReset={handleReset}
                onSetSolveObj={onSetSolveObj}
                questionsLoaded={questionsLoaded}
                solveObj={solveObj}
                story={story}
                storyId={storyId}
                userChoiceObj={userChoiceObj}
              />
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                {topicLoadError ? (
                  <div
                    style={{
                      marginTop: '5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}
                  >
                    <p>There was an error initializing AI Story</p>
                    <GradientButton
                      style={{ marginTop: '3rem' }}
                      onClick={() => {
                        onSetTopicLoadError(false);
                        onLoadTopic({ difficulty });
                      }}
                    >
                      Retry
                    </GradientButton>
                  </div>
                ) : (
                  <GradientButton
                    onClick={() => handleGenerateStory()}
                    loading={loadingTopic}
                  >
                    Generate a Story
                  </GradientButton>
                )}
              </div>
            )}
          </>
        ) : (
          <Listening /> // Placeholder for the Listening component
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
    </div>
  );

  async function handleGenerateStory(isOnError?: boolean) {
    if (isOnError) {
      handleReset();
    }
    onSetStoryLoadError(false);
    onSetGenerateButtonPressed(true);
    try {
      const { attemptId: newAttemptId, storyObj } = await loadAIStory({
        difficulty,
        topic,
        topicKey,
        type: storyType
      });
      onSetAttemptId(newAttemptId);
      onSetStoryId(storyObj.id);
      onSetStory(storyObj.story);
      onSetExplanation(storyObj.explanation);
      onSetLoadStoryComplete(true);
      socket.emit('generate_ai_story', {
        difficulty,
        topic,
        type: storyType,
        storyId: storyObj.id
      });
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(error);
      onSetStoryLoadError(true);
    }
  }

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

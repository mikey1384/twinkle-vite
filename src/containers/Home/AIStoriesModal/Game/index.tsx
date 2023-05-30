import React from 'react';
import Button from '~/components/Button';
import ContentContainer from './ContentContainer';
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
  generateButtonPressed,
  loadStoryComplete,
  loadingStory,
  loadingTopic,
  MainRef,
  onLoadTopic,
  onHide,
  onSetAttemptId,
  onSetResetNumber,
  onSetDifficulty,
  onSetDropdownShown,
  onSetDisplayedSection,
  onSetGenerateButtonPressed,
  onSetLoadingStory,
  onSetLoadStoryComplete,
  onSetSolveObj,
  onSetStoryLoadError,
  onSetStoryObj,
  onSetUserChoiceObj,
  onSetQuestions,
  onSetQuestionsLoaded,
  onSetQuestionsLoadError,
  onSetTopicLoadError,
  questions,
  questionsLoaded,
  questionsLoadError,
  solveObj,
  storyLoadError,
  storyObj,
  storyType,
  topic,
  topicKey,
  topicLoadError,
  userChoiceObj
}: {
  attemptId: number;
  difficulty: number;
  displayedSection: string;
  generateButtonPressed: boolean;
  loadStoryComplete: boolean;
  loadingStory: boolean;
  loadingTopic: boolean;
  MainRef: React.RefObject<any>;
  onHide: () => void;
  onLoadTopic: (v: any) => void;
  onSetAttemptId: (v: number) => void;
  onSetDifficulty: (v: number) => void;
  onSetDisplayedSection: (v: string) => void;
  onSetDropdownShown: (v: boolean) => void;
  onSetGenerateButtonPressed: (v: boolean) => void;
  onSetLoadingStory: (v: boolean) => void;
  onSetLoadStoryComplete: (v: boolean) => void;
  onSetTopicLoadError: (v: boolean) => void;
  onSetQuestions: (v: any) => void;
  onSetQuestionsLoaded: (v: boolean) => void;
  onSetQuestionsLoadError: (v: boolean) => void;
  onSetResetNumber: (v: any) => void;
  onSetSolveObj: (v: any) => void;
  onSetStoryLoadError: (v: boolean) => void;
  onSetStoryObj: (v: any) => void;
  onSetUserChoiceObj: (v: any) => void;
  questions: any[];
  questionsLoaded: boolean;
  questionsLoadError: boolean;
  solveObj: any;
  storyLoadError: boolean;
  storyObj: any;
  storyType: string;
  topic: string;
  topicKey: string;
  topicLoadError: boolean;
  userChoiceObj: any;
}) {
  const loadAIStoryQuestions = useAppContext(
    (v) => v.requestHelpers.loadAIStoryQuestions
  );
  const loadAIStory = useAppContext((v) => v.requestHelpers.loadAIStory);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
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
            onClick={handleGenerateStory}
          >
            Retry
          </GradientButton>
        </div>
      ) : generateButtonPressed ? (
        <ContentContainer
          attemptId={attemptId}
          difficulty={Number(difficulty)}
          displayedSection={displayedSection}
          loading={loadingStory}
          loadComplete={loadStoryComplete}
          storyObj={storyObj}
          questions={questions}
          questionsLoadError={questionsLoadError}
          onLoadQuestions={handleLoadQuestions}
          onSetDisplayedSection={onSetDisplayedSection}
          onSetUserChoiceObj={onSetUserChoiceObj}
          onScrollToTop={() => (MainRef.current.scrollTop = 0)}
          onReset={handleReset}
          onSetSolveObj={onSetSolveObj}
          questionsLoaded={questionsLoaded}
          solveObj={solveObj}
          userChoiceObj={userChoiceObj}
        />
      ) : (
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
              style={{ marginTop: '2rem' }}
              onClick={handleGenerateStory}
              loading={loadingTopic}
            >
              Generate a Story
            </GradientButton>
          )}
        </div>
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
  );

  async function handleLoadQuestions() {
    onSetQuestionsLoadError(false);
    if (questionsLoaded) return;
    try {
      const questions = await loadAIStoryQuestions({
        difficulty,
        story: storyObj.story,
        storyId: storyObj.id
      });
      onSetQuestions(questions);
      onSetQuestionsLoaded(true);
    } catch (error) {
      console.error(error);
      onSetQuestionsLoadError(true);
    }
  }

  async function handleGenerateStory() {
    onSetStoryLoadError(false);
    onSetGenerateButtonPressed(true);
    onSetLoadingStory(true);
    try {
      const { attemptId: newAttemptId, storyObj } = await loadAIStory({
        difficulty,
        topic,
        topicKey,
        type: storyType
      });
      onSetAttemptId(newAttemptId);
      onSetStoryObj(storyObj);
      onSetLoadStoryComplete(true);
      socket.emit('generate_ai_story', {
        difficulty,
        topic,
        type: storyType
      });
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(error);
      onSetStoryLoadError(true);
    } finally {
      onSetLoadingStory(false);
    }
  }

  function handleReset() {
    onSetResetNumber((prevNumber: number) => prevNumber + 1);
    onSetLoadStoryComplete(false);
    onSetQuestionsLoaded(false);
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

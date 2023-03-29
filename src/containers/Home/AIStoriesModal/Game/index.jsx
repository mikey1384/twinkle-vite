import PropTypes from 'prop-types';
import Button from '~/components/Button';
import ContentContainer from './ContentContainer';
import DropdownButton from '~/components/Buttons/DropdownButton';
import GradientButton from '~/components/Buttons/GradientButton';
import { useAppContext } from '~/contexts';

const levelHash = {
  1: 'Level 1',
  2: 'Level 2',
  3: 'Level 3',
  4: 'Level 4',
  5: 'Level 5'
};

Game.propTypes = {
  attemptId: PropTypes.number,
  difficulty: PropTypes.number.isRequired,
  generateButtonPressed: PropTypes.bool.isRequired,
  loadStoryComplete: PropTypes.bool.isRequired,
  loadingStory: PropTypes.bool.isRequired,
  loadingTopic: PropTypes.bool.isRequired,
  MainRef: PropTypes.object.isRequired,
  onHide: PropTypes.func.isRequired,
  onLoadTopic: PropTypes.func.isRequired,
  onSetAttemptId: PropTypes.func.isRequired,
  onSetResetNumber: PropTypes.func.isRequired,
  onSetDifficulty: PropTypes.func.isRequired,
  onSetDropdownShown: PropTypes.func.isRequired,
  onSetGenerateButtonPressed: PropTypes.func.isRequired,
  onSetLoadingStory: PropTypes.func.isRequired,
  onSetLoadStoryComplete: PropTypes.func.isRequired,
  onSetQuestions: PropTypes.func.isRequired,
  onSetQuestionsLoaded: PropTypes.func.isRequired,
  onSetQuestionsLoadError: PropTypes.func.isRequired,
  onSetTopicLoadError: PropTypes.func.isRequired,
  onSetSolveObj: PropTypes.func.isRequired,
  onSetStoryLoadError: PropTypes.func.isRequired,
  onSetStoryObj: PropTypes.func.isRequired,
  onSetUserChoiceObj: PropTypes.func.isRequired,
  questions: PropTypes.array,
  questionsLoaded: PropTypes.bool,
  questionsLoadError: PropTypes.bool,
  solveObj: PropTypes.object.isRequired,
  storyLoadError: PropTypes.bool.isRequired,
  storyObj: PropTypes.object.isRequired,
  storyType: PropTypes.string.isRequired,
  topic: PropTypes.string.isRequired,
  topicLoadError: PropTypes.bool.isRequired,
  userChoiceObj: PropTypes.object.isRequired
};

export default function Game({
  attemptId,
  difficulty,
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
  topicLoadError,
  userChoiceObj
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
          loading={loadingStory}
          loadingTopic={loadingTopic}
          loadComplete={loadStoryComplete}
          storyObj={storyObj}
          questions={questions}
          questionsLoadError={questionsLoadError}
          onLoadQuestions={handleLoadQuestions}
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
                  onLoadTopic(difficulty);
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
        type: storyType
      });
      onSetAttemptId(newAttemptId);
      onSetStoryObj(storyObj);
      onSetLoadStoryComplete(true);
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(error);
      onSetStoryLoadError(true);
    } finally {
      onSetLoadingStory(false);
    }
  }

  function handleReset() {
    onSetResetNumber((prevNumber) => prevNumber + 1);
    onSetLoadStoryComplete(false);
    onSetQuestionsLoaded(false);
    onSetQuestions([]);
    onSetUserChoiceObj({});
    onSetSolveObj({
      numCorrect: 0,
      isGraded: false
    });
    onSetGenerateButtonPressed(false);
  }
}

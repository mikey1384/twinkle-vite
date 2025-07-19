import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import StatusMessage from './StatusMessage';
import Loading from '~/components/Loading';
import QuestionCarousel from './QuestionCarousel';
import { useAppContext, useMissionContext, useKeyContext } from '~/contexts';

Questions.propTypes = {
  isRepeating: PropTypes.bool,
  mission: PropTypes.object.isRequired
};

export default function Questions({
  isRepeating,
  mission
}: {
  isRepeating?: boolean;
  mission: any;
}) {
  const [submitDisabled, setSubmitDisabled] = useState(true);
  const userId = useKeyContext((v) => v.myState.userId);
  const [repeatMissionComplete, setRepeatMissionComplete] = useState(false);
  const updateUserCoins = useAppContext(
    (v) => v.requestHelpers.updateUserCoins
  );
  const updateMissionData = useAppContext(
    (v) => v.requestHelpers.updateMissionData
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const updateUserXP = useAppContext((v) => v.requestHelpers.updateUserXP);
  const uploadMissionAttempt = useAppContext(
    (v) => v.requestHelpers.uploadMissionAttempt
  );
  const uploadGrammarAttempt = useAppContext(
    (v) => v.requestHelpers.uploadGrammarAttempt
  );
  const onUpdateMissionAttempt = useMissionContext(
    (v) => v.actions.onUpdateMissionAttempt
  );
  const onSetMissionState = useMissionContext(
    (v) => v.actions.onSetMissionState
  );
  const [questionIds, setQuestionIds] = useState<number[]>([]);
  const [questionObj, setQuestionObj] = useState<Record<string, any>>({});
  useEffect(() => {
    if (!mission.questions || mission.questions.length === 0) return;
    const resultObj = mission.questions.reduce(
      (prev: any, curr: any, index: number) => {
        const choices = curr.choices.map((choice: string) => ({
          label: choice,
          checked: false
        }));
        return {
          ...prev,
          [index]: {
            ...curr,
            choices,
            failMessage: renderFailMessage(),
            selectedChoiceIndex: null
          }
        };

        function renderFailMessage() {
          const answer = curr.choices[curr.answerIndex];
          const answerInBold = answer
            .split(' ')
            .map((word: string) => `*${word}*`)
            .join(' ');
          return `Wrong. Correct sentence is "${curr.question.replace(
            '_____',
            answerInBold
          )}"`;
        }
      },
      {}
    );
    setQuestionObj(resultObj);
    setQuestionIds([...Array(mission.questions.length).keys()]);
  }, [mission.questions]);

  const selectedAnswerIndex: React.MutableRefObject<any> = useRef(null);
  const statusRef: React.MutableRefObject<any> = useRef(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [conditionPassStatus, setConditionPassStatus] = useState('');
  const objectiveMessage = useMemo(() => {
    if (questionObj[currentSlideIndex]?.type === 'fill in the blank') {
      return 'Choose the word or phrase that correctly completes the sentence';
    }
    return '';
  }, [currentSlideIndex, questionObj]);

  return (
    <div style={{ width: '100%' }}>
      {questionIds.length > 0 ? (
        <QuestionCarousel
          conditionPassStatus={
            repeatMissionComplete ? 'complete' : conditionPassStatus
          }
          currentSlideIndex={currentSlideIndex}
          onAfterSlide={(index) => {
            statusRef.current = null;
            setSubmitDisabled(true);
            setConditionPassStatus('');
            setCurrentSlideIndex(index);
          }}
          onCheckNavCondition={handleCheckNavCondition}
          objectiveMessage={objectiveMessage}
          questionIds={questionIds}
          questionObj={questionObj}
          onSelectChoice={handleSelectChoice}
          submitDisabled={submitDisabled}
        />
      ) : (
        <Loading />
      )}
      {conditionPassStatus && (
        <div style={{ marginTop: '-0.5rem' }}>
          <StatusMessage
            mission={mission}
            missionComplete={repeatMissionComplete}
            status={conditionPassStatus}
            passMessage="*Correct!*"
            failMessage={questionObj[currentSlideIndex].failMessage}
            onBackToStart={() =>
              onSetMissionState({
                missionId: mission.id,
                newState: { started: false, grammarReviewLoaded: false }
              })
            }
          />
        </div>
      )}
    </div>
  );

  function handleSelectChoice({
    selectedIndex,
    questionId
  }: {
    selectedIndex: number;
    questionId: number;
  }) {
    if (!statusRef.current) {
      setQuestionObj((questionObj) => ({
        ...questionObj,
        [questionId]: {
          ...questionObj[questionId],
          choices: questionObj[questionId].choices.map(
            (choice: any, index: number) =>
              index === selectedIndex
                ? { ...choice, checked: true }
                : { ...choice, checked: false }
          )
        },
        selectedChoiceIndex: selectedIndex
      }));
      selectedAnswerIndex.current = selectedIndex;
      setSubmitDisabled(false);
    }
  }

  function handleCheckNavCondition(onNext: () => void) {
    if (statusRef.current === 'pass') {
      if (currentSlideIndex < questionIds.length - 1) {
        return onNext();
      }
      return handleSuccess();
    }
    statusRef.current =
      questionObj[currentSlideIndex].answerIndex === selectedAnswerIndex.current
        ? 'pass'
        : 'fail';
    uploadGrammarAttempt({
      result: statusRef.current,
      questionId: questionObj[currentSlideIndex].id
    });
    setConditionPassStatus(statusRef.current);
    selectedAnswerIndex.current = null;
  }

  async function handleSuccess() {
    setSubmitDisabled(true);
    try {
      if (isRepeating) {
        const { coins } = await updateUserCoins({
          action: 'repeat',
          target: 'mission',
          amount: mission.repeatCoinReward,
          targetId: mission.id,
          type: 'increase'
        });
        const { xp, rank } = await updateUserXP({
          amount: mission.repeatXpReward,
          action: 'repeat',
          target: 'mission',
          targetId: mission.id,
          type: 'increase'
        });
        onSetUserState({
          userId,
          newState: { twinkleXP: xp, twinkleCoins: coins, rank }
        });
        await updateMissionData(mission.id);
        setRepeatMissionComplete(true);
      } else {
        const { success, newXpAndRank, newCoins } = await uploadMissionAttempt({
          missionId: mission.id,
          attempt: { status: 'pass' }
        });
        if (success) {
          if (newXpAndRank.xp) {
            onSetUserState({
              userId,
              newState: { twinkleXP: newXpAndRank.xp, rank: newXpAndRank.rank }
            });
          }
          if (newCoins) {
            onSetUserState({
              userId,
              newState: { twinkleCoins: newCoins }
            });
          }
          onUpdateMissionAttempt({
            missionId: mission.id,
            newState: { status: 'pass' }
          });
          onSetMissionState({
            missionId: mission.id,
            newState: { started: false, grammarReviewLoaded: false }
          });
        }
      }
      setSubmitDisabled(false);
    } catch (_error) {
      setSubmitDisabled(false);
    }
  }
}

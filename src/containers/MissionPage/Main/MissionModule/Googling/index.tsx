import React, { useEffect, useRef, useState } from 'react';
import Question from './Question';
import Button from '~/components/Button';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { scrollElementToCenter } from '~/helpers';
import { useAppContext, useMissionContext, useKeyContext } from '~/contexts';
import { Color } from '~/constants/css';

const BodyRef = document.scrollingElement || document.documentElement;

export default function Googling({
  isDeprecated = false,
  mission,
  onSetMissionState,
  style
}: {
  isDeprecated?: boolean;
  mission: any;
  onSetMissionState: (arg0: { missionId: any; newState: any }) => void;
  style?: React.CSSProperties;
}) {
  const doneColor = useKeyContext((v) => v.theme.done.color);
  const uploadMissionAttempt = useAppContext(
    (v) => v.requestHelpers.uploadMissionAttempt
  );
  const onUpdateMissionAttempt = useMissionContext(
    (v) => v.actions.onUpdateMissionAttempt
  );
  const [submitDisabled, setSubmitDisabled] = useState(false);
  const [answers, setAnswers] = useState(mission.answers || {});
  const answersRef = useRef(mission.answers || {});
  const [hasErrorObj, setHasErrorObj] = useState(mission.hasErrorObj || {});
  const hasErrorObjRef = useRef(mission.hasErrorObj || {});
  const QuestionRefs: React.RefObject<any> = useRef({});

  useEffect(() => {
    return function onUnmount() {
      onSetMissionState({
        missionId: mission.id,
        newState: {
          answers: answersRef.current,
          hasErrorObj: hasErrorObjRef.current
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={style}>
      {isDeprecated && (
        <div
          style={{
            background: Color.gold(0.12),
            border: `1px solid ${Color.gold(0.5)}`,
            borderRadius: '1rem',
            color: Color.darkBrownOrange(),
            fontSize: '1.5rem',
            lineHeight: 1.6,
            marginBottom: '2.5rem',
            padding: '1.5rem'
          }}
        >
          <strong>This mission has been deprecated.</strong> You can still
          review the tutorial below, but new submissions are disabled and will
          not be reviewed.
        </div>
      )}
      {mission.questions?.map((question: { id: number }) => (
        <Question
          key={question.id}
          innerRef={(ref: any) => (QuestionRefs.current[question.id] = ref)}
          hasError={hasErrorObj[question.id]}
          question={question}
          answer={answers[question.id] || ''}
          onInputChange={(text) =>
            handleSetAnswers({ questionId: question.id, answer: text })
          }
          style={{
            marginBottom: '2rem'
          }}
        />
      ))}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '-1rem'
        }}
      >
        <Button
          style={{ fontSize: '1.7rem' }}
          disabled={submitDisabled || isDeprecated}
          color={doneColor}
          variant="solid"
          onClick={handleSubmit}
        >
          Submit
        </Button>
      </div>
    </div>
  );

  function handleSetAnswers({
    questionId,
    answer
  }: {
    questionId: number;
    answer: any;
  }) {
    handleSetHasErrorObj({ questionId, hasError: false });
    setAnswers((answers: any[]) => ({
      ...answers,
      [questionId]: answer
    }));
    answersRef.current = {
      ...answersRef.current,
      [questionId]: answer
    };
  }

  function handleSetHasErrorObj({
    questionId,
    hasError
  }: {
    questionId: number;
    hasError: any;
  }) {
    setHasErrorObj((hasErrorObj: any) => ({
      ...hasErrorObj,
      [questionId]: hasError
    }));
    hasErrorObjRef.current = {
      ...hasErrorObjRef.current,
      [questionId]: hasError
    };
  }

  async function handleSubmit() {
    if (isDeprecated) {
      return;
    }
    setSubmitDisabled(true);
    for (const { id: questionId } of mission.questions) {
      if (!answers[questionId] || stringIsEmpty(answers[questionId])) {
        handleSetHasErrorObj({
          questionId,
          hasError: true
        });
        scrollElementToCenter(QuestionRefs.current[questionId]);
        setSubmitDisabled(false);
        return QuestionRefs.current[questionId]?.focus();
      }
    }

    const { success } = await uploadMissionAttempt({
      missionId: mission.id,
      attempt: {
        answers
      }
    });
    if (success) {
      setAnswers({});
      answersRef.current = {};
      onSetMissionState({
        missionId: mission.id,
        newState: {
          answers: {},
          hasErrorObj: {}
        }
      });
      onUpdateMissionAttempt({
        missionId: mission.id,
        newState: { status: 'pending', tryingAgain: false }
      });
      const appElement = document.getElementById('App');
      if (appElement) appElement.scrollTop = 0;
      BodyRef.scrollTop = 0;
    }
    setSubmitDisabled(false);
  }
}

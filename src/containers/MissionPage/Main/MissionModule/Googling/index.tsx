import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Question from './Question';
import Button from '~/components/Button';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { scrollElementToCenter } from '~/helpers';
import { useAppContext, useMissionContext, useKeyContext } from '~/contexts';

const BodyRef = document.scrollingElement || document.documentElement;

Googling.propTypes = {
  mission: PropTypes.object.isRequired,
  onSetMissionState: PropTypes.func.isRequired,
  style: PropTypes.object
};

export default function Googling({
  mission,
  onSetMissionState,
  style
}: {
  mission: any;
  onSetMissionState: (arg0: { missionId: any; newState: any }) => void;
  style?: React.CSSProperties;
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
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
      {mission.questions?.map((question: { id: number }) => (
        <Question
          key={question.id}
          innerRef={(ref) => (QuestionRefs.current[question.id] = ref)}
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
          disabled={submitDisabled}
          color={doneColor}
          filled
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

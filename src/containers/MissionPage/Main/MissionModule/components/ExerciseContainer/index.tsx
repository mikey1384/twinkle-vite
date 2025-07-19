import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import SuccessMessage from './SuccessMessage';
import FailMessage from './FailMessage';
import Icon from '~/components/Icon';
import CodeSandbox from '~/components/Forms/CodeSandbox';
import useExercises from './useExercises';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useAppContext, useKeyContext } from '~/contexts';

ExerciseContainer.propTypes = {
  codeObj: PropTypes.object,
  exercises: PropTypes.object.isRequired,
  exerciseKey: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
  prevExerciseKey: PropTypes.string,
  prevUserId: PropTypes.number,
  onOpenTutorial: PropTypes.func,
  onSetCode: PropTypes.func.isRequired,
  style: PropTypes.object,
  taskType: PropTypes.string
};

export default function ExerciseContainer({
  codeObj,
  exercises,
  exerciseKey,
  index,
  prevExerciseKey,
  onOpenTutorial,
  onSetCode,
  prevUserId,
  style,
  taskType
}: {
  codeObj: { [key: string]: string };
  exercises: { [key: string]: any };
  exerciseKey: string;
  index: number;
  prevExerciseKey: string;
  prevUserId: number;
  onOpenTutorial: () => void;
  onSetCode: (v: { code: string; exerciseLabel: string }) => void;
  style?: React.CSSProperties;
  taskType: string;
}) {
  const updateMissionStatus = useAppContext(
    (v) => v.requestHelpers.updateMissionStatus
  );
  const onUpdateUserMissionState = useAppContext(
    (v) => v.user.actions.onUpdateUserMissionState
  );
  const username = useKeyContext((v) => v.myState.username);
  const missions = useKeyContext((v) => v.myState.missions);

  const { passed, prevPassed, errorMsg, setErrorMsg, success, exercise } =
    useExercises({
      exercises,
      exerciseKey,
      prevExerciseKey,
      codeObj,
      missions,
      onUpdateUserMissionState,
      onSetCode,
      updateMissionStatus,
      taskType,
      username
    });

  const ComponentRef = useRef(null);

  return (
    <ErrorBoundary componentPath="MissionModule/components/ExerciseContainer/index">
      <div
        style={{
          width: '100%',
          display: prevPassed ? 'flex' : 'none',
          flexDirection: 'column',
          alignItems: 'center',
          ...style
        }}
      >
        <p>
          {index + 1}. {exercise?.title}
          {passed && (
            <Icon
              style={{ marginLeft: '1rem' }}
              icon="check"
              color={Color.green()}
            />
          )}
        </p>
        <div
          className={css`
            width: 80%;
            font-size: 1.7rem;
            line-height: 2;
            text-align: center;
            @media (max-width: ${mobileMaxWidth}) {
              width: 100%;
            }
          `}
          style={{ marginTop: '2rem' }}
        >
          {exercise?.instruction}
        </div>
        <div
          ref={ComponentRef}
          className={css`
            margin-top: 2rem;
            width: 80%;
            @media (max-width: ${mobileMaxWidth}) {
              width: 100%;
            }
          `}
        >
          {exercise && (
            <CodeSandbox
              style={{ marginTop: '5rem' }}
              code={exercise.code}
              initialCode={exercise.initialCode}
              onSetCode={exercise.onSetCode}
              onRunCode={exercise.onRunCode}
              onSetErrorMsg={setErrorMsg}
              hasError={!!errorMsg}
              passed={passed || success}
              prevUserId={prevUserId}
              runButtonLabel="check"
            />
          )}
          {success && !passed && (
            <SuccessMessage onNextClick={exercise?.onNextClick} />
          )}
          {errorMsg && <FailMessage message={errorMsg} />}
          {errorMsg && (
            <div style={{ marginTop: '1rem', fontSize: '1.7rem' }}>
              Need help?{' '}
              <a
                style={{
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  color: Color.logoBlue()
                }}
                onClick={onOpenTutorial}
              >
                Read the tutorial for {`"${exercise?.title}"`}
              </a>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

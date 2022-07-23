import { useMemo, useState } from 'react';

export default function useExercises({
  codeObj,
  exercises,
  exerciseKey,
  prevExerciseKey,
  missions,
  onUpdateUserMissionState,
  onSetCode,
  taskType,
  username,
  updateMissionStatus
} = {}) {
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState();
  const passObj = useMemo(() => {
    const result = {};
    for (let key of Object.keys(exercises)) {
      result[key] = missions[taskType]?.[key] === 'pass';
    }
    return result;
  }, [exercises, missions, taskType]);

  const passed = useMemo(() => {
    return passObj[exerciseKey];
  }, [exerciseKey, passObj]);

  const prevPassed = useMemo(() => {
    if (!prevExerciseKey) {
      return true;
    }
    return passObj[prevExerciseKey];
  }, [passObj, prevExerciseKey]);

  const exercise = useMemo(() => {
    return {
      title: exercises[exerciseKey].title,
      code: codeObj?.[exerciseKey],
      initialCode:
        typeof exercises[exerciseKey].initialCode === 'function'
          ? exercises[exerciseKey].initialCode({ username })
          : exercises[exerciseKey].initialCode,
      instruction:
        typeof exercises[exerciseKey].instruction === 'function'
          ? exercises[exerciseKey].instruction({ username })
          : exercises[exerciseKey].instruction,
      onNextClick: handleNextClick,
      onSetCode: handleSetCode,
      onRunCode: ({ ast, code }) =>
        exercises[exerciseKey].onRunCode({
          username,
          code,
          ast,
          onSetErrorMsg: setErrorMsg,
          onUpdateMissionStatus: handleUpdateMissionStatus
        })
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeObj, exerciseKey]);

  return {
    passed,
    prevPassed,
    errorMsg,
    setErrorMsg,
    exercise,
    success
  };

  function handleNextClick() {
    onUpdateUserMissionState({
      missionType: taskType,
      newState: { [exerciseKey]: 'pass' }
    });
  }

  function handleSetCode(code) {
    onSetCode({ code, exerciseLabel: exerciseKey });
  }

  async function handleUpdateMissionStatus() {
    await updateMissionStatus({
      missionType: taskType,
      newStatus: { [exerciseKey]: 'pass' }
    });
    setSuccess(true);
  }
}

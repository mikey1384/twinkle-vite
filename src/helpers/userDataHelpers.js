export function checkMultiMissionPassStatus({ mission, myAttempts }) {
  let numTasks = 0;
  let numPassedTasks = 0;
  for (let subMission of mission.subMissions) {
    for (let task of subMission.tasks) {
      numTasks++;
      if (myAttempts[task.id]?.status === 'pass') {
        numPassedTasks++;
      }
    }
  }
  return {
    numTasks,
    numPassedTasks,
    passed: numTasks > 0 && numTasks === numPassedTasks
  };
}

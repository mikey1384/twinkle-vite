import chatRequestHelpers from './chat';
import contentRequestHelpers from './content';
import interactiveRequestHelpers from './interactive';
import notificationRequestHelpers from './notification';
import managementRequestHelpers from './management';
import missionRequestHelpers from './mission';
import userRequestHelpers from './user';
import zeroRequestHelpers from './zero';

const token = () =>
  typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;

const auth = () => ({
  headers: {
    authorization: token()
  }
});

export default function requestHelpers(handleError) {
  return {
    auth,
    ...contentRequestHelpers({ auth, handleError }),
    ...interactiveRequestHelpers({ auth, handleError }),
    ...notificationRequestHelpers({ auth, handleError }),
    ...managementRequestHelpers({ auth, handleError }),
    ...missionRequestHelpers({ auth, handleError }),
    ...chatRequestHelpers({ auth, handleError }),
    ...zeroRequestHelpers({ auth, handleError }),
    ...userRequestHelpers({ auth, handleError, token })
  };
}

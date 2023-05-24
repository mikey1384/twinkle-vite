import chatRequestHelpers from './chat';
import contentRequestHelpers from './content';
import interactiveRequestHelpers from './interactive';
import notificationRequestHelpers from './notification';
import managementRequestHelpers from './management';
import missionRequestHelpers from './mission';
import userRequestHelpers from './user';
import zeroRequestHelpers from './zero';
import { getStoredItem } from '~/helpers/userDataHelpers';

const token = () => getStoredItem('token');

const auth = () => ({
  headers: {
    authorization: token()
  }
});

export default function requestHelpers(handleError: (error: unknown) => void) {
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

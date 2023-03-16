import request from 'axios';
import URL from '~/constants/URL';

export default function zeroRequestHelpers({ auth, handleError }) {
  return {
    async getZerosReview({ type, content, command }) {
      try {
        const {
          data: { response }
        } = await request.post(
          `${URL}/zero/review`,
          { type, content, command },
          auth()
        );
        return Promise.resolve(response);
      } catch (error) {
        return handleError(error);
      }
    }
  };
}

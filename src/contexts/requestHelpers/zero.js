import request from 'axios';
import URL from '~/constants/URL';

export default function zeroRequestHelpers({ auth, handleError }) {
  return {
    async getZerosReview({ type, content }) {
      try {
        const { data } = await request.post(
          `${URL}/zero/review`,
          { type, content },
          auth()
        );
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    }
  };
}

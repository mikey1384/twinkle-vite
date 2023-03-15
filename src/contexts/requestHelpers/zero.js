import request from 'axios';
import URL from '~/constants/URL';

export default function zeroRequestHelpers({ auth, handleError }) {
  return {
    async getZerosReview() {
      try {
        const { data } = await request.get(`${URL}/zero/review`, auth());
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    }
  };
}

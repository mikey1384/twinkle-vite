import request from 'axios';
import URL from '~/constants/URL';
import { RequestHelpers } from '../types';

export default function zeroRequestHelpers({
  auth,
  handleError
}: RequestHelpers) {
  return {
    async getZerosReview({
      type,
      content,
      command
    }: {
      type: string;
      content: string;
      command: string;
    }) {
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

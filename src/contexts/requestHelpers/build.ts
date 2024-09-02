import request from 'axios';
import URL from '~/constants/URL';
import { RequestHelpers } from '~/types';

export default function buildRequestHelpers({
  auth,
  handleError
}: RequestHelpers) {
  return {
    async runSimulation(code: string) {
      try {
        const { data } = await request.post(
          `${URL}/simulator/run`,
          { code },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    }
  };
}

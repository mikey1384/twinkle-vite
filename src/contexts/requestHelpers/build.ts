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
          `${URL}/project/run`,
          { code },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async fetchSampleCode() {
      try {
        const { data } = await request.get(
          `${URL}/project/samples/website`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    }
  };
}

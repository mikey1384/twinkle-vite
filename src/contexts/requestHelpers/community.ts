import request from 'axios';
import URL from '~/constants/URL';

export default function communityRequestHelpers({
  auth,
  handleError
}: {
  auth: () => any;
  handleError: (error: unknown) => void;
}) {
  return {
    async loadCommunityFunds() {
      try {
        const { data } = await request.get(`${URL}/community/funds`);
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },

    async loadCommunityFundStats() {
      try {
        const { data } = await request.get(`${URL}/community/funds/stats`);
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },

    async loadDonorLeaderboard() {
      try {
        const { data } = await request.get(
          `${URL}/community/donors/leaderboard`,
          auth()
        );
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    }
  };
}
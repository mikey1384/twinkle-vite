import request from 'axios';
import URL from '~/constants/URL';
import { clientVersion } from '~/constants/defaultValues';

export default function notificationRequestHelpers({ auth, handleError }) {
  return {
    async checkVersion() {
      try {
        const { data } = await request.get(
          `${URL}/notification/version?version=${clientVersion}`
        );
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async fetchNotifications() {
      try {
        const {
          data: { currentChatSubject, loadMoreNotifications, notifications }
        } = await request.get(`${URL}/notification`, auth());
        return Promise.resolve({
          currentChatSubject,
          loadMoreNotifications,
          notifications
        });
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMoreNotifications(lastId) {
      try {
        const {
          data: { loadMoreNotifications, notifications }
        } = await request.get(`${URL}/notification?lastId=${lastId}`, auth());
        return Promise.resolve({ loadMoreNotifications, notifications });
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMoreRewards(lastId) {
      try {
        const { data } = await request.get(
          `${URL}/notification/more/rewards?lastId=${lastId}`,
          auth()
        );
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async loadRewards() {
      if (auth().headers.authorization === null) {
        return {
          rewards: [],
          loadMore: false,
          totalRewardedTwinkles: 0,
          totalRewardedTwinkleCoins: 0
        };
      }
      try {
        const {
          data: {
            rewards,
            loadMoreRewards,
            totalRewardedTwinkles,
            totalRewardedTwinkleCoins
          }
        } = await request.get(`${URL}/notification/rewards`, auth());
        return Promise.resolve({
          rewards,
          loadMoreRewards,
          totalRewardedTwinkles,
          totalRewardedTwinkleCoins
        });
      } catch (error) {
        return handleError(error);
      }
    }
  };
}

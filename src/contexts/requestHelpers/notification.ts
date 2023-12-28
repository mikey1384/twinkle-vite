import request from 'axios';
import URL from '~/constants/URL';
import { RequestHelpers } from '~/types';
import { clientVersion } from '~/constants/defaultValues';

export default function notificationRequestHelpers({
  auth,
  handleError
}: RequestHelpers) {
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
    async fetchTodayStats() {
      try {
        const {
          data: {
            achievedDailyGoals,
            dailyHasBonus,
            dailyBonusAchieved,
            dailyRewardIsChecked,
            xpEarned,
            coinsEarned,
            nextMission,
            unansweredChessMsgChannelId,
            standardTimeStamp
          }
        } = await request.get(`${URL}/notification/today`, auth());
        return Promise.resolve({
          achievedDailyGoals,
          dailyHasBonus,
          dailyBonusAchieved,
          dailyRewardIsChecked,
          xpEarned,
          coinsEarned,
          nextMission,
          standardTimeStamp,
          unansweredChessMsgChannelId
        });
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMoreNotifications(lastId: number) {
      try {
        const {
          data: { loadMoreNotifications, notifications }
        } = await request.get(`${URL}/notification?lastId=${lastId}`, auth());
        return Promise.resolve({ loadMoreNotifications, notifications });
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMoreRewards(lastId: number) {
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
    },
    async unlockDailyReward() {
      try {
        const {
          data: {
            cards,
            chosenCardId,
            coinEarned,
            hasBonus,
            xpEarned,
            isAlreadyChecked
          }
        } = await request.post(
          `${URL}/notification/today/dailyReward`,
          {},
          auth()
        );
        return Promise.resolve({
          cards,
          chosenCardId,
          coinEarned,
          hasBonus,
          xpEarned,
          isAlreadyChecked
        });
      } catch (error) {
        return handleError(error);
      }
    },
    async loadDailyBonus() {
      try {
        const { data } = await request.get(
          `${URL}/notification/today/dailyReward/bonus`,
          auth()
        );
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    }
  };
}

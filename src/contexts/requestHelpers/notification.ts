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
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async fetchNotifications() {
      try {
        const {
          data: { currentChatSubject, loadMoreNotifications, notifications }
        } = await request.get(`${URL}/notification`, auth());
        return {
          currentChatSubject,
          loadMoreNotifications,
          notifications
        };
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
            dailyBonusAttempted,
            dailyRewardIsChecked,
            xpEarned,
            coinsEarned,
            nextMission,
            unansweredChessMsgChannelId,
            standardTimeStamp
          }
        } = await request.get(`${URL}/notification/today`, auth());
        return {
          achievedDailyGoals,
          dailyHasBonus,
          dailyBonusAttempted,
          dailyRewardIsChecked,
          xpEarned,
          coinsEarned,
          nextMission,
          standardTimeStamp,
          unansweredChessMsgChannelId
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMoreNotifications(lastId: number) {
      try {
        const {
          data: { loadMoreNotifications, notifications }
        } = await request.get(`${URL}/notification?lastId=${lastId}`, auth());
        return { loadMoreNotifications, notifications };
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
        return data;
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
        return {
          rewards,
          loadMoreRewards,
          totalRewardedTwinkles,
          totalRewardedTwinkleCoins
        };
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
            isAlreadyChecked,
            isCardOwned
          }
        } = await request.post(
          `${URL}/notification/today/dailyReward`,
          {},
          auth()
        );
        return {
          cards,
          chosenCardId,
          coinEarned,
          hasBonus,
          xpEarned,
          isAlreadyChecked,
          isCardOwned
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadDailyBonus() {
      try {
        const {
          data: { questions, chosenCard, isCardOwned }
        } = await request.get(
          `${URL}/notification/today/dailyReward/bonus`,
          auth()
        );
        return { questions, chosenCard, isCardOwned };
      } catch (error) {
        return handleError(error);
      }
    },
    async postDailyBonus(selectedIndex: number) {
      try {
        const {
          data: { isCorrect, rewardAmount }
        } = await request.post(
          `${URL}/notification/today/dailyReward/bonus`,
          { selectedIndex },
          auth()
        );
        return { isCorrect, rewardAmount };
      } catch (error) {
        return handleError(error);
      }
    }
  };
}

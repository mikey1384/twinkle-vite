import request from './axiosInstance';
import axios from 'axios';
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
    async fetchNotifications(options?: { fromWriter?: boolean }) {
      try {
        const query = options?.fromWriter ? '?fromWriter=1' : '';
        const {
          data: { currentChatSubject, loadMoreNotifications, notifications }
        } = await request.get(`${URL}/notification${query}`, auth());
        return {
          currentChatSubject,
          loadMoreNotifications,
          notifications
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async getBuildAppNotificationPreferences({
      buildId,
      eventKey
    }: {
      buildId: number;
      eventKey?: string;
    }) {
      try {
        const query = new URLSearchParams();
        query.set('buildId', String(buildId));
        if (eventKey) {
          query.set('eventKey', eventKey);
        }
        const { data } = await request.get(
          `${URL}/notification/build-app/preferences?${query.toString()}`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async updateBuildAppNotificationPreferences({
      buildId,
      eventKey,
      mutedBuild,
      mutedEvent
    }: {
      buildId: number;
      eventKey?: string;
      mutedBuild?: boolean;
      mutedEvent?: boolean;
    }) {
      try {
        const { data } = await request.put(
          `${URL}/notification/build-app/preferences`,
          { buildId, eventKey, mutedBuild, mutedEvent },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadBuildAppNotificationLaunchTarget(notificationId: number) {
      try {
        const { data } = await request.get(
          `${URL}/notification/build-app/${notificationId}/launch-target`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async fetchTodayStats() {
      try {
        const {
          data: {
            achievedDailyGoals,
            dailyTaskStreak,
            dailyTaskBestStreak,
            dailyTaskStatus,
            aiCallDuration,
            aiUsagePolicy,
            dailyHasBonus,
            dailyBonusAttempted,
            dailyRewardResultViewed,
            dailyQuestionCompleted,
            xpEarned,
            coinsEarned,
            nextDayTimeStamp,
            nextMission,
            standardTimeStamp
          }
        } = await request.get(`${URL}/notification/today`, auth());
        return {
          achievedDailyGoals,
          dailyTaskStreak,
          dailyTaskBestStreak,
          dailyTaskStatus,
          aiCallDuration,
          aiUsagePolicy,
          dailyHasBonus,
          dailyBonusAttempted,
          dailyRewardResultViewed,
          dailyQuestionCompleted,
          xpEarned,
          coinsEarned,
          nextDayTimeStamp,
          nextMission,
          standardTimeStamp
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async checkUnansweredChess() {
      try {
        const {
          data: { unansweredChessMsgChannelId }
        } = await request.get(`${URL}/notification/chess`, auth());
        return { unansweredChessMsgChannelId };
      } catch (error) {
        return handleError(error);
      }
    },
    async checkUnansweredOmok() {
      try {
        const {
          data: { unansweredOmokMsgChannelId }
        } = await request.get(`${URL}/notification/omok`, auth());
        return { unansweredOmokMsgChannelId };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMoreNotifications(lastId: number, lastTimeStamp?: number) {
      try {
        const cursorTimeStamp = Number(lastTimeStamp || 0);
        const {
          data: { loadMoreNotifications, notifications }
        } = await request.get(
          `${URL}/notification?lastId=${lastId}${
            cursorTimeStamp ? `&lastTimeStamp=${cursorTimeStamp}` : ''
          }`,
          auth()
        );
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
            dailyTaskReward,
            hasBonus,
            bonusAttempted,
            bonusAchieved,
            nextDayTimeStamp,
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
          dailyTaskReward,
          hasBonus,
          bonusAttempted,
          bonusAchieved,
          nextDayTimeStamp,
          xpEarned,
          isAlreadyChecked,
          isCardOwned
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async purchaseDailyTaskRepair() {
      try {
        const { data } = await request.post(
          `${URL}/notification/today/dailyTask/repair`,
          {},
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async clearUnavailableAIStoryDailyTask() {
      try {
        const { data } = await request.post(
          `${URL}/notification/today/dailyTask/aiStory/unavailable-clear`,
          {},
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async clearUnavailableDailyQuestion() {
      try {
        const { data } = await request.post(
          `${URL}/notification/today/dailyQuestion/unavailable-clear`,
          {},
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async setDailyTaskRepairNoticeHidden(hidden: boolean) {
      try {
        const { data } = await request.put(
          `${URL}/notification/today/dailyTask/repair-notice`,
          { hidden },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async setDailyTaskBoostStripCompact(compact: boolean) {
      try {
        const { data } = await request.put(
          `${URL}/notification/today/dailyTask/boost-strip`,
          { compact },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async updateDailyRewardViewStatus() {
      try {
        const { data } = await request.put(
          `${URL}/notification/today/dailyReward`,
          {},
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadDailyBonus() {
      try {
        const {
          data: {
            questions,
            chosenCard,
            isCardOwned,
            isUnavailable,
            dailyTaskReward
          }
        } = await axios.get(
          `${URL}/notification/today/dailyReward/bonus`,
          auth()
        );
        return {
          questions,
          chosenCard,
          isCardOwned,
          isUnavailable,
          dailyTaskReward
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async postDailyBonus(selectedIndex: number) {
      try {
        const {
          data: { isCorrect, isAlreadyAttempted, rewardAmount, dailyTaskReward }
        } = await request.post(
          `${URL}/notification/today/dailyReward/bonus`,
          { selectedIndex },
          auth()
        );
        return { isCorrect, isAlreadyAttempted, rewardAmount, dailyTaskReward };
      } catch (error) {
        return handleError(error);
      }
    },
    async purchaseDailyTaskStreakRepair() {
      try {
        const { data } = await request.post(
          `${URL}/notification/today/dailyTask/repair`,
          {},
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    }
  };
}

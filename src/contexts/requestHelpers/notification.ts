import request from './axiosInstance';
import axios from 'axios';
import URL from '~/constants/URL';
import { RequestHelpers } from '~/types';
import { clientVersion } from '~/constants/defaultValues';
import { buildClientVersionCheckUrl } from '~/helpers/clientUpdate';

export default function notificationRequestHelpers({
  auth,
  handleError
}: RequestHelpers) {
  return {
    // The answer decides whether to blockade the screen, so it must come from
    // the network every time. The server's no-store policy cannot retroactively
    // alter a `false` cached before that policy existed, and a resumed iOS tab
    // can consult that cache before its network path is usable. A unique URL
    // bypasses every poisoned entry. If the request fails, the caller ignores
    // the non-boolean result and leaves the client alone, which is the safe way
    // to be wrong.
    async checkVersion() {
      try {
        const { data } = await request.get(
          buildClientVersionCheckUrl({ apiUrl: URL, version: clientVersion })
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
          // Non-GET requests get no scheduler timeout; without one a stalled
          // connection or slow server-side bonus assessment holds the daily
          // reward modal on its spinner forever. The server's worst inline
          // path is ~53s (30s bonus-guard wait + ~23s timeboxed assessment),
          // so this must stay above that or the client aborts right before
          // the fallback reward arrives.
          { ...auth(), timeout: 60000 }
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
          { ...auth(), timeout: 30000 }
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
        } = await axios.get(`${URL}/notification/today/dailyReward/bonus`, {
          // Raw axios (not the scheduler), so no timeout applies by default;
          // the server generates the bonus question inline so allow a while.
          ...auth(),
          timeout: 60000
        });
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
          { ...auth(), timeout: 30000 }
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

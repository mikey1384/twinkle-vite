import request from 'axios';
import URL from '~/constants/URL';
import { clientVersion } from '~/constants/defaultValues';
import { queryStringForArray } from '~/helpers/stringHelpers';

export default function userRequestHelpers({ auth, handleError, token }) {
  return {
    async addAccountType(accountType) {
      try {
        const { data } = await request.post(
          `${URL}/user/accountType`,
          { accountType },
          auth()
        );
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async addModerators(newModerators) {
      try {
        const { data } = await request.post(
          `${URL}/user/moderator`,
          { newModerators },
          auth()
        );
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async changeAccountType({ userId, selectedAccountType }) {
      try {
        const { data } = await request.put(
          `${URL}/user/moderator`,
          { userId, selectedAccountType },
          auth()
        );
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async checkIfUsernameExists(username) {
      try {
        const {
          data: { exists }
        } = await request.get(
          `${URL}/user/username/exists?username=${username}`,
          auth()
        );
        return Promise.resolve(exists);
      } catch (error) {
        return handleError(error);
      }
    },
    async changePassword({ userId, password }) {
      try {
        const { data } = await request.put(`${URL}/user/password`, {
          userId,
          password
        });
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async changePasswordFromStore({ currentPassword, newPassword }) {
      try {
        const {
          data: { isSuccess }
        } = await request.put(
          `${URL}/user/password/change`,
          { currentPassword, newPassword },
          auth()
        );
        return Promise.resolve({ isSuccess });
      } catch (error) {
        return handleError(error);
      }
    },
    async changeUsername(newUsername) {
      try {
        const {
          data: { alreadyExists, coins }
        } = await request.put(`${URL}/user/username`, { newUsername }, auth());
        return Promise.resolve({ alreadyExists, coins });
      } catch (error) {
        return handleError(error);
      }
    },
    async confirmPassword(password) {
      try {
        const {
          data: { success }
        } = await request.post(
          `${URL}/user/password/confirm`,
          { password },
          auth()
        );
        return Promise.resolve(success);
      } catch (error) {
        return handleError(error);
      }
    },
    async deleteAccountType(accountTypeLabel) {
      try {
        const {
          data: { success }
        } = await request.delete(
          `${URL}/user/accountType?accountTypeLabel=${accountTypeLabel}`,
          auth()
        );
        return Promise.resolve(success);
      } catch (error) {
        return handleError(error);
      }
    },
    async deleteProfilePictures(remainingPictures) {
      const queryString = queryStringForArray({
        array: remainingPictures,
        originVar: 'id',
        destinationVar: 'remainingPictureIds'
      });
      try {
        const {
          data: { success }
        } = await request.delete(`${URL}/user/picture?${queryString}`, auth());
        return Promise.resolve(success);
      } catch (error) {
        return handleError(error);
      }
    },
    async deleteArchivedPicture(pictureId) {
      try {
        const {
          data: { success }
        } = await request.delete(
          `${URL}/user/picture/archive?pictureId=${pictureId}`,
          auth()
        );
        return Promise.resolve(success);
      } catch (error) {
        return handleError(error);
      }
    },
    async editAccountType({ label, editedAccountType }) {
      try {
        const {
          data: { success }
        } = await request.put(
          `${URL}/user/accountType`,
          {
            label,
            editedAccountType
          },
          auth()
        );
        return Promise.resolve(success);
      } catch (error) {
        return handleError(error);
      }
    },
    async editRewardComment({ editedComment, contentId }) {
      try {
        await request.put(
          `${URL}/user/reward`,
          { editedComment, contentId },
          auth()
        );
        return Promise.resolve();
      } catch (error) {
        return handleError(error);
      }
    },
    async revokeReward(rewardId) {
      try {
        const {
          data: { success }
        } = await request.delete(
          `${URL}/user/reward?rewardId=${rewardId}`,
          auth()
        );
        return Promise.resolve(success);
      } catch (error) {
        return handleError(error);
      }
    },
    async recordUserTraffic(pathname) {
      if (token() === null) {
        request.post(`${URL}/user/recordAnonTraffic`, { pathname });
        return {};
      }
      try {
        const { data } = await request.get(
          `${URL}/user/traffic?pathname=${pathname}`,
          auth()
        );
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async loadCoinHistory(lastId) {
      try {
        const {
          data: { totalCoins, changes, loadMoreShown }
        } = await request.get(
          `${URL}/user/coin/history${lastId ? `?lastId=${lastId}` : ''}`,
          auth()
        );
        return Promise.resolve({ totalCoins, changes, loadMoreShown });
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMyData() {
      try {
        const { data } = await request.get(`${URL}/user/session`, auth());
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async loadUserPictures({ lastPictureId, exclude }) {
      const queryString = exclude
        ? queryStringForArray({
            array: exclude,
            originVar: 'id',
            destinationVar: 'currentPictureIds'
          })
        : '';
      try {
        const {
          data: { pictures, loadMoreShown }
        } = await request.get(
          `${URL}/user/picture/archive${
            queryString || lastPictureId ? '?' : ''
          }${queryString}${
            lastPictureId
              ? `${queryString ? '&' : ''}lastPictureId=${lastPictureId}`
              : ''
          }`,
          auth()
        );
        return Promise.resolve({ pictures, loadMoreShown });
      } catch (error) {
        return handleError(error);
      }
    },
    async loadKarmaPoints() {
      try {
        const {
          data: {
            karmaPoints,
            numTwinklesRewarded,
            numApprovedRecommendations,
            numPostsRewarded,
            numRecommended
          }
        } = await request.get(`${URL}/user/karma`, auth());
        return Promise.resolve({
          karmaPoints,
          numTwinklesRewarded,
          numApprovedRecommendations,
          numPostsRewarded,
          numRecommended
        });
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMonthlyLeaderboards(year) {
      try {
        const { data: leaderboards } = await request.get(
          `${URL}/user/leaderBoard/monthly?year=${year}`
        );
        return Promise.resolve(leaderboards);
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMonthlyXp(userId) {
      try {
        const { data } = await request.get(
          `${URL}/user/monthlyXp?userId=${userId}`
        );
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async loadProfile(userId) {
      try {
        const { data } = await request.get(`${URL}/user?userId=${userId}`);
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async loadProfileViaUsername(username) {
      try {
        const {
          data: { pageNotExists, user }
        } = await request.get(
          `${URL}/user/username/check?username=${username}`
        );
        return Promise.resolve({ pageNotExists, user });
      } catch (error) {
        return handleError(error);
      }
    },
    async loadRankings() {
      try {
        const {
          data: {
            all,
            top30s,
            allMonthly,
            top30sMonthly,
            myAllTimeRank,
            myMonthlyRank,
            myAllTimeXP,
            myMonthlyXP
          }
        } = await request.get(`${URL}/user/leaderBoard`, auth());
        return Promise.resolve({
          all,
          top30s,
          allMonthly,
          top30sMonthly,
          myAllTimeRank,
          myMonthlyRank,
          myAllTimeXP,
          myMonthlyXP
        });
      } catch (error) {
        return handleError(error);
      }
    },
    async loadUsers({ orderBy, lastUserId, lastActive, lastTwinkleXP } = {}) {
      try {
        const { data } = await request.get(
          `${URL}/user/users${orderBy ? `?orderBy=${orderBy}` : ''}${
            lastUserId
              ? `${
                  orderBy ? '&' : '?'
                }lastUserId=${lastUserId}&lastActive=${lastActive}&lastTwinkleXP=${lastTwinkleXP}`
              : ''
          }`
        );
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async loadCoins() {
      try {
        const {
          data: { coins }
        } = await request.get(`${URL}/user/coin`, auth());
        return Promise.resolve(coins);
      } catch (error) {
        return handleError(error);
      }
    },
    async loadXP() {
      try {
        const {
          data: { rank, xp }
        } = await request.get(`${URL}/user/xp`, auth());
        return Promise.resolve({ rank, xp });
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMissionProgress(userId) {
      try {
        const { data } = await request.get(
          `${URL}/user/state/mission?userId=${userId}`
        );
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async loadXpAcquisition(userId) {
      try {
        const { data } = await request.get(
          `${URL}/user/xp/acquisition?userId=${userId}`
        );
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async login(params) {
      try {
        const { data } = await request.post(`${URL}/user/login`, params);
        localStorage.setItem('token', data.token);
        return Promise.resolve(data);
      } catch (error) {
        if (error.response.status === 401) {
          return Promise.reject('Incorrect username/password combination');
        }
        return handleError(error);
      }
    },
    async reorderProfilePictures(reorderedPictureIds) {
      try {
        const {
          data: { success }
        } = await request.put(
          `${URL}/user/picture/reorder`,
          { reorderedPictureIds },
          auth()
        );
        return Promise.resolve(success);
      } catch (error) {
        return handleError(error);
      }
    },
    async reportError({ componentPath, info, message }) {
      try {
        const {
          data: { success }
        } = await request.post(
          `${URL}/user/error`,
          { componentPath, info, message, clientVersion },
          auth()
        );
        return Promise.resolve(success);
      } catch (error) {
        return handleError(error);
      }
    },
    async rewardUser({
      maxRewardAmountForOnePerson,
      explanation,
      amount,
      contentType,
      contentId,
      rootType,
      rootId,
      uploaderId,
      rewardType
    }) {
      try {
        const {
          data: { alreadyRewarded, reward, netCoins }
        } = await request.post(
          `${URL}/user/reward`,
          {
            maxRewardAmountForOnePerson,
            rewardExplanation: explanation || '',
            amount,
            contentType,
            contentId,
            rootType,
            rootId,
            uploaderId,
            rewardType
          },
          auth()
        );
        return Promise.resolve({ alreadyRewarded, reward, netCoins });
      } catch (error) {
        return handleError(error);
      }
    },
    async searchUsers(query) {
      try {
        const { data: users } = await request.get(
          `${URL}/user/users/search?queryString=${query}`
        );
        return Promise.resolve(users);
      } catch (error) {
        return handleError(error);
      }
    },
    async sendVerificationEmail({ email, userId, isPasswordReset }) {
      try {
        const { data } = await request.put(`${URL}/user/email/verify`, {
          email,
          userId,
          isPasswordReset
        });
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async sendVerificationOTPEmail(email) {
      try {
        const {
          data: { success }
        } = await request.put(
          `${URL}/user/email/verify/otp`,
          {
            email
          },
          auth()
        );
        return Promise.resolve(success);
      } catch (error) {
        return handleError(error);
      }
    },
    async setDefaultSearchFilter(filter) {
      try {
        const { data } = await request.post(
          `${URL}/user/searchFilter`,
          { filter },
          auth()
        );
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async setTheme({ color }) {
      try {
        await request.put(`${URL}/user/theme`, { color }, auth());
        return Promise.resolve();
      } catch (error) {
        return handleError(error);
      }
    },
    async signup(params) {
      try {
        const { data } = await request.post(`${URL}/user/signup`, params);
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async toggleHideWatched() {
      try {
        const {
          data: { hideWatched }
        } = await request.put(`${URL}/user/hideWatched`, {}, auth());
        return Promise.resolve(hideWatched);
      } catch (error) {
        return handleError(error);
      }
    },
    async toggleWordleStrictMode(strictMode) {
      try {
        const data = await request.put(
          `${URL}/user/wordleStrictMode`,
          { strictMode },
          auth()
        );
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async updateCollectType(collectType) {
      try {
        const {
          data: { success }
        } = await request.put(
          `${URL}/user/collectType`,
          { collectType },
          auth()
        );
        return Promise.resolve(success);
      } catch (error) {
        return handleError(error);
      }
    },
    async updateCurrentlyWatching({ watchCode }) {
      const authorization = auth();
      const authExists = !!authorization.headers.authorization;
      if (authExists) {
        try {
          request.put(
            `${URL}/video/currentlyWatching`,
            { watchCode },
            authorization
          );
        } catch (error) {
          return handleError(error);
        }
      }
    },
    async collectRewardedCoins() {
      try {
        const {
          data: { coins }
        } = await request.post(`${URL}/user/coin/collect`, null, auth());
        return Promise.resolve(coins);
      } catch (error) {
        return handleError(error);
      }
    },
    async updateUserCoins({
      action,
      type,
      amount,
      target,
      targetId,
      totalDuration
    }) {
      try {
        const {
          data: { alreadyDone, coins }
        } = await request.post(
          `${URL}/user/coin`,
          { amount, action, target, targetId, totalDuration, type },
          auth()
        );
        return Promise.resolve({ alreadyDone, coins });
      } catch (error) {
        return handleError(error);
      }
    },
    async updateUserXP({
      amount,
      action,
      target,
      targetId,
      totalDuration,
      type,
      userId
    }) {
      try {
        const {
          data: { xp, alreadyDone, rank, coins }
        } = await request.post(
          `${URL}/user/xp`,
          { amount, action, target, targetId, totalDuration, type, userId },
          auth()
        );
        return Promise.resolve({ xp, alreadyDone, rank, coins });
      } catch (error) {
        return handleError(error);
      }
    },
    async uploadBio(params) {
      try {
        const { data } = await request.post(`${URL}/user/bio`, params, auth());
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async uploadGreeting({ greeting }) {
      try {
        await request.put(`${URL}/user/greeting`, { greeting }, auth());
        return Promise.resolve();
      } catch (error) {
        return handleError(error);
      }
    },
    async uploadProfileInfo({ email, website, youtubeName, youtubeUrl }) {
      try {
        const { data } = await request.put(
          `${URL}/user/info`,
          {
            email,
            website,
            youtubeName,
            youtubeUrl
          },
          auth()
        );
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async unlockAICardGeneration() {
      try {
        const {
          data: { success }
        } = await request.put(`${URL}/user/unlock/aiCard`, null, auth());
        return Promise.resolve(success);
      } catch (error) {
        return handleError(error);
      }
    },
    async unlockUsernameChange() {
      try {
        const {
          data: { success }
        } = await request.put(`${URL}/user/unlock/username`, null, auth());
        return Promise.resolve(success);
      } catch (error) {
        return handleError(error);
      }
    },
    async uploadUserPic({ caption, src, isProfilePic }) {
      try {
        const {
          data: { pictures }
        } = await request.post(
          `${URL}/user/picture`,
          { caption, src, isProfilePic },
          auth()
        );
        return Promise.resolve(pictures);
      } catch (error) {
        return handleError(error);
      }
    },
    async updateUserPictureCaption({ caption, pictureId }) {
      try {
        const {
          data: { pictures }
        } = await request.put(
          `${URL}/user/picture/caption`,
          { caption, pictureId },
          auth()
        );
        return Promise.resolve(pictures);
      } catch (error) {
        return handleError(error);
      }
    },
    async updateUserPictures(pictureIds) {
      try {
        const {
          data: { pictures }
        } = await request.put(
          `${URL}/user/picture/archive`,
          { pictureIds },
          auth()
        );
        return Promise.resolve(pictures);
      } catch (error) {
        return handleError(error);
      }
    },
    async upgradeFileUploadSize() {
      try {
        const {
          data: { success }
        } = await request.put(`${URL}/user/upgrade/uploadSize`, null, auth());
        return Promise.resolve(success);
      } catch (error) {
        return handleError(error);
      }
    },
    async upgradeNumPics() {
      try {
        const {
          data: { success }
        } = await request.put(`${URL}/user/upgrade/numPics`, null, auth());
        return Promise.resolve(success);
      } catch (error) {
        return handleError(error);
      }
    },
    async upgradeRewardBoost() {
      try {
        const {
          data: { success }
        } = await request.put(`${URL}/user/upgrade/rewardBoost`, null, auth());
        return Promise.resolve(success);
      } catch (error) {
        return handleError(error);
      }
    },
    async verifyEmailViaOTP({ otp, email }) {
      try {
        const {
          data: { success }
        } = await request.get(
          `${URL}/user/email/verify/otp?otp=${otp}&email=${email}`,
          auth()
        );
        return Promise.resolve(success);
      } catch (error) {
        return handleError(error);
      }
    },
    async verifyEmail({ token, forPasswordReset }) {
      try {
        const {
          data: { profilePicUrl, userId, username, errorMsg }
        } = await request.get(
          `${URL}/user/email/verify?token=${token}${
            forPasswordReset ? '&forPasswordReset=1' : ''
          }`,
          auth()
        );
        return Promise.resolve({ profilePicUrl, userId, username, errorMsg });
      } catch (error) {
        return handleError(error);
      }
    }
  };
}

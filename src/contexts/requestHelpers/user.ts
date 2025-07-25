import request from './axiosInstance';
import axios from 'axios';
import URL from '~/constants/URL';
import { clientVersion } from '~/constants/defaultValues';
import { RequestHelpers } from '~/types';
import { queryStringForArray } from '~/helpers/stringHelpers';

export default function userRequestHelpers({
  auth,
  handleError,
  token
}: RequestHelpers) {
  return {
    async checkIfPasswordMatches(password: string) {
      try {
        const {
          data: { passwordMatches }
        } = await request.get(
          `${URL}/user/password?password=${password}`,
          auth()
        );
        return passwordMatches;
      } catch (error) {
        return handleError(error);
      }
    },
    async checkIfUsernameExists(username: string) {
      try {
        const {
          data: { exists }
        } = await request.get(
          `${URL}/user/username/exists?username=${username}`,
          auth()
        );
        return exists;
      } catch (error) {
        return handleError(error);
      }
    },
    async changePassword({
      userId,
      password
    }: {
      userId: number;
      password: string;
    }) {
      try {
        const { data } = await request.put(`${URL}/user/password`, {
          userId,
          password
        });
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async changePasswordFromStore({
      currentPassword,
      newPassword
    }: {
      currentPassword: string;
      newPassword: string;
    }) {
      try {
        const {
          data: { isSuccess }
        } = await request.put(
          `${URL}/user/password/change`,
          { currentPassword, newPassword },
          auth()
        );
        return { isSuccess };
      } catch (error) {
        return handleError(error);
      }
    },
    async changeUsername(newUsername: string) {
      try {
        const {
          data: { alreadyExists, coins }
        } = await request.put(`${URL}/user/username`, { newUsername }, auth());
        return { alreadyExists, coins };
      } catch (error) {
        return handleError(error);
      }
    },
    async confirmPassword(password: string) {
      try {
        const {
          data: { success }
        } = await request.post(
          `${URL}/user/password/confirm`,
          { password },
          auth()
        );
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async deletePreviousUsername(username: string) {
      try {
        const {
          data: { success }
        } = await request.delete(
          `${URL}/user/username/previous?username=${username}`,
          auth()
        );
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async deleteProfilePictures(remainingPictures: object[]) {
      const queryString = queryStringForArray({
        array: remainingPictures,
        originVar: 'id',
        destinationVar: 'remainingPictureIds'
      });
      try {
        const {
          data: { success }
        } = await request.delete(`${URL}/user/picture?${queryString}`, auth());
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async deleteArchivedPicture(pictureId: number) {
      try {
        const {
          data: { success }
        } = await request.delete(
          `${URL}/user/picture/archive?pictureId=${pictureId}`,
          auth()
        );
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async editRewardComment({
      editedComment,
      contentId
    }: {
      editedComment: string;
      contentId: number;
    }) {
      try {
        await request.put(
          `${URL}/user/reward`,
          { editedComment, contentId },
          auth()
        );
        return;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadFeaturedSubjectsOnProfile(userId: { userId: number }) {
      try {
        const { data: subjects } = await request.get(
          `${URL}/user/featured/subjects?userId=${userId}`
        );
        return subjects;
      } catch (error) {
        return handleError(error);
      }
    },
    async featureSubjectsOnProfile({ selected }: { selected: number[] }) {
      try {
        const { data: subjects } = await request.post(
          `${URL}/user/featured/subjects`,
          { selectedSubjects: selected },
          auth()
        );
        return subjects;
      } catch (error) {
        return handleError(error);
      }
    },
    async revokeReward(rewardId: number) {
      try {
        const {
          data: { success }
        } = await request.delete(
          `${URL}/user/reward?rewardId=${rewardId}`,
          auth()
        );
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async recordUserTraffic(pathname: string) {
      if (!token?.()) {
        request.post(`${URL}/user/recordAnonTraffic`, { pathname });
        return {};
      }
      try {
        const { data } = await request.get(
          `${URL}/user/traffic?pathname=${pathname}`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMyAchievements() {
      try {
        const { data } = await request.get(`${URL}/user/achievements`, auth());
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadAchievementsByUserId(userId: number) {
      try {
        const { data } = await request.get(
          `${URL}/user/achievements/byId?userId=${userId}`
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadUsersByAchievementId(achievementId: number) {
      try {
        const {
          data: { users, hasMore }
        } = await request.get(
          `${URL}/user/achievements/users?achievementId=${achievementId}`,
          auth()
        );
        return { users, hasMore };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadCoinHistory(lastId: number) {
      try {
        const {
          data: { totalCoins, changes, loadMoreShown }
        } = await request.get(
          `${URL}/user/coin/history${lastId ? `?lastId=${lastId}` : ''}`,
          auth()
        );
        return { totalCoins, changes, loadMoreShown };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMyData() {
      try {
        const { data } = await request.get(`${URL}/user/session`, auth());
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadUsernameHistory({
      userId,
      lastId
    }: {
      userId: number;
      lastId?: number;
    }) {
      try {
        let url = `${URL}/user/username?userId=${userId}`;
        if (lastId) {
          url += `&lastId=${lastId}`;
        }

        const {
          data: { usernames, loadMoreShown }
        } = await request.get(url);

        return {
          usernames,
          loadMoreShown
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadUserPictures({
      lastPictureId,
      exclude
    }: {
      lastPictureId: number;
      exclude: number[];
    }) {
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
        return { pictures, loadMoreShown };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadUserTitles() {
      try {
        const {
          data: { titles }
        } = await request.get(`${URL}/user/title`, auth());
        return titles;
      } catch (error) {
        return handleError(error);
      }
    },
    async updateUserTitle(title: string) {
      try {
        const {
          data: { success }
        } = await request.put(`${URL}/user/title`, { title }, auth());
        return success;
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
        return {
          karmaPoints,
          numTwinklesRewarded,
          numApprovedRecommendations,
          numPostsRewarded,
          numRecommended
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMonthlyLeaderboards(year: number) {
      try {
        const { data: leaderboards } = await axios.get(
          `${URL}/user/leaderBoard/monthly?year=${year}`
        );
        return leaderboards;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMonthlyXp(userId: number) {
      try {
        const { data } = await request.get(
          `${URL}/user/monthlyXp?userId=${userId}`
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadProfile(userId: number) {
      try {
        const { data } = await request.get(`${URL}/user?userId=${userId}`);
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadProfileViaUsername(username: string) {
      try {
        const {
          data: { pageNotExists, user }
        } = await request.get(
          `${URL}/user/username/check?username=${username}`
        );
        return { pageNotExists, user };
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
        return {
          all,
          top30s,
          allMonthly,
          top30sMonthly,
          myAllTimeRank,
          myMonthlyRank,
          myAllTimeXP,
          myMonthlyXP
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadTodayRankings() {
      try {
        const {
          data: { all, hasMore, myTodayRank, myTodayXP }
        } = await request.get(`${URL}/user/leaderBoard/today`, auth());
        return {
          all,
          hasMore,
          myTodayRank,
          myTodayXP
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadAllTodayRankings() {
      try {
        const {
          data: { all, myTodayRank, myTodayXP }
        } = await request.get(`${URL}/user/leaderBoard/today/all`, auth());
        return {
          all,
          myTodayRank,
          myTodayXP
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadTop30TodayRankings() {
      try {
        const {
          data: { all, myTodayRank, myTodayXP }
        } = await request.get(`${URL}/user/leaderBoard/today/top30`, auth());
        return {
          all,
          myTodayRank,
          myTodayXP
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadUsers({
      orderBy,
      lastUserId,
      lastActive,
      lastTwinkleXP
    }: {
      orderBy?: string;
      lastUserId?: number;
      lastActive?: number;
      lastTwinkleXP?: number;
    } = {}) {
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
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadCoins() {
      try {
        const {
          data: { coins }
        } = await request.get(`${URL}/user/coin`, auth());
        return coins;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadXP() {
      try {
        const {
          data: { rank, xp }
        } = await request.get(`${URL}/user/xp`, auth());
        return { rank, xp };
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMissionProgress(userId: number) {
      try {
        const { data } = await request.get(
          `${URL}/user/state/mission?userId=${userId}`
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadXpAcquisition(userId: number) {
      try {
        const { data } = await request.get(
          `${URL}/user/xp/acquisition?userId=${userId}`
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async login(params: { username: string; password: string }) {
      try {
        const { data } = await axios.post(`${URL}/user/login`, params);
        localStorage.setItem('token', data.token);
        return data;
      } catch (error: any) {
        if (error.response.status === 401) {
          return Promise.reject('Wrong username/password combination');
        }
        return handleError(error);
      }
    },
    async reorderProfilePictures(reorderedPictureIds: number[]) {
      try {
        const {
          data: { success }
        } = await request.put(
          `${URL}/user/picture/reorder`,
          { reorderedPictureIds },
          auth()
        );
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async reportError({
      componentPath,
      info,
      message
    }: {
      componentPath: string;
      info: string;
      message: string;
    }) {
      try {
        const {
          data: { success }
        } = await request.post(
          `${URL}/user/error`,
          { componentPath, info, message, clientVersion },
          auth()
        );
        return success;
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
    }: {
      maxRewardAmountForOnePerson: number;
      explanation?: string;
      amount: number;
      contentType: string;
      contentId: number;
      rootType: string;
      rootId: number;
      uploaderId: number;
      rewardType: string;
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
          {
            ...auth(),
            timeout: 30_000
          }
        );
        return { alreadyRewarded, reward, netCoins };
      } catch (error) {
        return handleError(error);
      }
    },
    async searchUsers(query: string) {
      try {
        const { data: users } = await axios.get(
          `${URL}/user/users/search?queryString=${query}`
        );
        return users;
      } catch (error) {
        return handleError(error);
      }
    },
    async searchUsersWithAchievements(query: string) {
      try {
        const { data: users } = await request.get(
          `${URL}/user/users/search/achievements?queryString=${query}`
        );
        return users;
      } catch (error) {
        return handleError(error);
      }
    },
    async sendVerificationEmail({
      email,
      userId,
      isPasswordReset
    }: {
      email: string;
      userId: number;
      isPasswordReset: boolean;
    }) {
      try {
        const { data } = await request.put(`${URL}/user/email/verify`, {
          email,
          userId,
          isPasswordReset
        });
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async sendVerificationOTPEmail(email: string) {
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
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async sendVerificationOTPEmailForSignup(email: string) {
      try {
        const {
          data: { success }
        } = await request.put(`${URL}/user/signup/email/otp`, {
          email
        });
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async setDefaultSearchFilter(filter: string) {
      try {
        const { data } = await request.post(
          `${URL}/user/searchFilter`,
          { filter },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async setTheme({ color }: { color: string }) {
      try {
        await request.put(`${URL}/user/theme`, { color }, auth());
        return;
      } catch (error) {
        return handleError(error);
      }
    },
    async signup({
      username,
      firstname,
      lastname,
      branchName,
      className,
      email,
      verifiedEmail,
      password,
      userType
    }: {
      branchName: string;
      className: string;
      username: string;
      firstname: string;
      lastname: string;
      email: string;
      verifiedEmail: string;
      password: string;
      userType: string;
    }) {
      try {
        const { data } = await request.post(`${URL}/user/signup`, {
          username,
          firstname,
          lastname,
          branchName,
          className,
          email,
          verifiedEmail,
          password,
          userType
        });
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async toggleHideWatched() {
      try {
        const {
          data: { hideWatched }
        } = await request.put(`${URL}/user/hideWatched`, {}, auth());
        return hideWatched;
      } catch (error) {
        return handleError(error);
      }
    },
    async toggleWordleStrictMode(strictMode: boolean) {
      try {
        const data = await request.put(
          `${URL}/user/wordleStrictMode`,
          { strictMode },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async updateCollectType(collectType: string) {
      try {
        const {
          data: { success }
        } = await request.put(
          `${URL}/user/collectType`,
          { collectType },
          auth()
        );
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async updateCurrentlyWatching({ watchCode }: { watchCode: string }) {
      const authorization = auth();
      const authExists = !!authorization.headers.authorization;
      if (authExists) {
        try {
          request.put(
            `${URL}/video/currentlyWatching`,
            { watchCode },
            authorization
          );
          return;
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
        return coins;
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
    }: {
      action: string;
      type: string;
      amount: number;
      target: string;
      targetId: number;
      totalDuration: number;
    }) {
      try {
        const {
          data: { alreadyDone, coins }
        } = await request.post(
          `${URL}/user/coin`,
          { amount, action, target, targetId, totalDuration, type },
          auth()
        );
        return { alreadyDone, coins };
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
    }: {
      amount: number;
      action: string;
      target: string;
      targetId: number;
      totalDuration: number;
      type: string;
      userId: number;
    }) {
      try {
        const {
          data: { xp, alreadyDone, maxReached, rank, coins }
        } = await request.post(
          `${URL}/user/xp`,
          { amount, action, target, targetId, totalDuration, type, userId },
          auth()
        );
        return { xp, alreadyDone, maxReached, rank, coins };
      } catch (error) {
        return handleError(error);
      }
    },
    async uploadBio(params: object) {
      try {
        const { data } = await request.post(`${URL}/user/bio`, params, auth());
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async uploadGreeting({ greeting }: { greeting: string }) {
      try {
        await request.put(`${URL}/user/greeting`, { greeting }, auth());
        return;
      } catch (error) {
        return handleError(error);
      }
    },
    async uploadProfileInfo({
      email,
      website,
      youtubeName,
      youtubeUrl
    }: {
      email: string;
      website: string;
      youtubeName: string;
      youtubeUrl: string;
    }) {
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
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async unlockAICardGeneration() {
      try {
        const {
          data: { success }
        } = await request.put(`${URL}/user/unlock/aiCard`, null, auth());
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async unlockUsernameChange() {
      try {
        const {
          data: { success }
        } = await request.put(`${URL}/user/unlock/username`, null, auth());
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async unlockDonorLicense() {
      try {
        const {
          data: { success }
        } = await request.put(`${URL}/user/unlock/donor`, null, auth());
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async makeDonation(amount: number) {
      try {
        const {
          data: { coins, donatedCoins, achievementUnlocked }
        } = await request.post(`${URL}/user/donate`, { amount }, auth());
        return { coins, donatedCoins, achievementUnlocked };
      } catch (error) {
        return handleError(error);
      }
    },
    async uploadUserPic({
      caption,
      src,
      isProfilePic
    }: {
      caption: string;
      src: string;
      isProfilePic: boolean;
    }) {
      try {
        const {
          data: { pictures }
        } = await request.post(
          `${URL}/user/picture`,
          { caption, src, isProfilePic },
          auth()
        );
        return pictures;
      } catch (error) {
        return handleError(error);
      }
    },
    async updateUserPictureCaption({
      caption,
      pictureId
    }: {
      caption: string;
      pictureId: number;
    }) {
      try {
        const {
          data: { pictures }
        } = await request.put(
          `${URL}/user/picture/caption`,
          { caption, pictureId },
          auth()
        );
        return pictures;
      } catch (error) {
        return handleError(error);
      }
    },
    async updateUserPictures(pictureIds: number[]) {
      try {
        const {
          data: { pictures }
        } = await request.put(
          `${URL}/user/picture/archive`,
          { pictureIds },
          auth()
        );
        return pictures;
      } catch (error) {
        return handleError(error);
      }
    },
    async upgradeFileUploadSize() {
      try {
        const {
          data: { success }
        } = await request.put(`${URL}/user/upgrade/uploadSize`, null, auth());
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async upgradeNumPics() {
      try {
        const {
          data: { success }
        } = await request.put(`${URL}/user/upgrade/numPics`, null, auth());
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async upgradeRewardBoost() {
      try {
        const {
          data: { success }
        } = await request.put(`${URL}/user/upgrade/rewardBoost`, null, auth());
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async verifyEmailViaOTP({ otp, email }: { otp: string; email: string }) {
      try {
        const {
          data: { success }
        } = await request.get(
          `${URL}/user/email/verify/otp?otp=${otp}&email=${email}`,
          auth()
        );
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async verifyEmailViaOTPForSignup({
      otp,
      email
    }: {
      otp: string;
      email: string;
    }) {
      try {
        const {
          data: { success }
        } = await request.get(
          `${URL}/user/signup/email/otp?otp=${otp}&email=${email}`,
          auth()
        );
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async verifyEmail({
      token,
      forPasswordReset
    }: {
      token: string;
      forPasswordReset: boolean;
    }) {
      try {
        const {
          data: { profilePicUrl, userId, username, errorMsg }
        } = await request.get(
          `${URL}/user/email/verify?token=${token}${
            forPasswordReset ? '&forPasswordReset=1' : ''
          }`,
          auth()
        );
        return { profilePicUrl, userId, username, errorMsg };
      } catch (error) {
        return handleError(error);
      }
    },
    async verifyPassphrase(passphrase: string) {
      try {
        const {
          data: { isMatch }
        } = await request.post(`${URL}/user/signup/passphrase`, { passphrase });
        return isMatch;
      } catch (error) {
        return handleError(error);
      }
    }
  };
}

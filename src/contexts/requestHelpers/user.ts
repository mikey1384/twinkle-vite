import request from 'axios';
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
    async addAccountType(accountType: string) {
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
    async addModerators(newModerators: number[]) {
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
    async addSupermods(supermods: { userId: number; role: string }[]) {
      try {
        const {
          data: { supermods: newSupermods }
        } = await request.post(`${URL}/user/supermod`, { supermods }, auth());
        return Promise.resolve(newSupermods);
      } catch (error) {
        return handleError(error);
      }
    },
    async changeAccountType({
      userId,
      selectedAccountType
    }: {
      userId: number;
      selectedAccountType: string;
    }) {
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
    async checkIfUsernameExists(username: string) {
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
        return Promise.resolve(data);
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
        return Promise.resolve({ isSuccess });
      } catch (error) {
        return handleError(error);
      }
    },
    async changeUsername(newUsername: string) {
      try {
        const {
          data: { alreadyExists, coins }
        } = await request.put(`${URL}/user/username`, { newUsername }, auth());
        return Promise.resolve({ alreadyExists, coins });
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
        return Promise.resolve(success);
      } catch (error) {
        return handleError(error);
      }
    },
    async deleteAccountType(accountTypeLabel: string) {
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
    async deletePreviousUsername(username: string) {
      try {
        const {
          data: { success }
        } = await request.delete(
          `${URL}/user/username/previous?username=${username}`,
          auth()
        );
        return Promise.resolve(success);
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
        return Promise.resolve(success);
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
        return Promise.resolve(success);
      } catch (error) {
        return handleError(error);
      }
    },
    async editAccountType({
      label,
      editedAccountType
    }: {
      label: string;
      editedAccountType: string;
    }) {
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
        return Promise.resolve();
      } catch (error) {
        return handleError(error);
      }
    },
    async loadFeaturedSubjectsOnProfile(userId: { userId: number }) {
      try {
        const { data: subjects } = await request.get(
          `${URL}/user/featured/subjects?userId=${userId}`
        );
        return Promise.resolve(subjects);
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
        return Promise.resolve(subjects);
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
        return Promise.resolve(success);
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
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMyAchievements() {
      try {
        const { data } = await request.get(`${URL}/user/achievements`, auth());
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async loadAchievementsByUserId(userId: number) {
      try {
        const { data } = await request.get(
          `${URL}/user/achievements/byId?userId=${userId}`
        );
        return Promise.resolve(data);
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

        return Promise.resolve({
          usernames,
          loadMoreShown
        });
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
        return Promise.resolve({ pictures, loadMoreShown });
      } catch (error) {
        return handleError(error);
      }
    },
    async loadUserTitles() {
      try {
        const {
          data: { titles }
        } = await request.get(`${URL}/user/title`, auth());
        return Promise.resolve(titles);
      } catch (error) {
        return handleError(error);
      }
    },
    async updateUserTitle(title: string) {
      try {
        const {
          data: { success }
        } = await request.put(`${URL}/user/title`, { title }, auth());
        return Promise.resolve(success);
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
    async loadMonthlyLeaderboards(year: number) {
      try {
        const { data: leaderboards } = await request.get(
          `${URL}/user/leaderBoard/monthly?year=${year}`
        );
        return Promise.resolve(leaderboards);
      } catch (error) {
        return handleError(error);
      }
    },
    async loadMonthlyXp(userId: number) {
      try {
        const { data } = await request.get(
          `${URL}/user/monthlyXp?userId=${userId}`
        );
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async loadProfile(userId: number) {
      try {
        const { data } = await request.get(`${URL}/user?userId=${userId}`);
        return Promise.resolve(data);
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
    async loadMissionProgress(userId: number) {
      try {
        const { data } = await request.get(
          `${URL}/user/state/mission?userId=${userId}`
        );
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async loadXpAcquisition(userId: number) {
      try {
        const { data } = await request.get(
          `${URL}/user/xp/acquisition?userId=${userId}`
        );
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async login(params: { username: string; password: string }) {
      try {
        const { data } = await request.post(`${URL}/user/login`, params);
        localStorage.setItem('token', data.token);
        return Promise.resolve(data);
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
        return Promise.resolve(success);
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
          auth()
        );
        return Promise.resolve({ alreadyRewarded, reward, netCoins });
      } catch (error) {
        return handleError(error);
      }
    },
    async searchUsers(query: string) {
      try {
        const { data: users } = await request.get(
          `${URL}/user/users/search?queryString=${query}`
        );
        return Promise.resolve(users);
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
        return Promise.resolve(data);
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
        return Promise.resolve(success);
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
        return Promise.resolve(success);
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
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async setTheme({ color }: { color: string }) {
      try {
        await request.put(`${URL}/user/theme`, { color }, auth());
        return Promise.resolve();
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
    async toggleWordleStrictMode(strictMode: boolean) {
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
    async updateCollectType(collectType: string) {
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
        return Promise.resolve({ xp, alreadyDone, maxReached, rank, coins });
      } catch (error) {
        return handleError(error);
      }
    },
    async uploadBio(params: object) {
      try {
        const { data } = await request.post(`${URL}/user/bio`, params, auth());
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async uploadGreeting({ greeting }: { greeting: string }) {
      try {
        await request.put(`${URL}/user/greeting`, { greeting }, auth());
        return Promise.resolve();
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
        return Promise.resolve(pictures);
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
        return Promise.resolve(pictures);
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
    async verifyEmailViaOTP({ otp, email }: { otp: string; email: string }) {
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
        return Promise.resolve(success);
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
        return Promise.resolve({ profilePicUrl, userId, username, errorMsg });
      } catch (error) {
        return handleError(error);
      }
    },
    async verifyPassphrase(passphrase: string) {
      try {
        const {
          data: { isMatch }
        } = await request.post(`${URL}/user/signup/passphrase`, { passphrase });
        return Promise.resolve(isMatch);
      } catch (error) {
        return handleError(error);
      }
    }
  };
}

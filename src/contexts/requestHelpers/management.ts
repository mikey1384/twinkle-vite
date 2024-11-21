import request from './axiosInstance';
import URL from '~/constants/URL';
import { RequestHelpers } from '~/types';
import axios from 'axios';

export default function managementRequestHelpers({
  auth,
  handleError
}: RequestHelpers) {
  return {
    async addAccountType(accountType: string) {
      try {
        const { data } = await request.post(
          `${URL}/user/management/accountType`,
          { accountType },
          auth()
        );
        return Promise.resolve(data);
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
          `${URL}/user/management/moderator`,
          { userId, selectedAccountType },
          auth()
        );
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async loadModerators() {
      try {
        const {
          data: { moderators }
        } = await request.get(`${URL}/user/management/moderator`);
        return moderators;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadModeratorsCSV() {
      try {
        const { data } = await axios.get(
          `${URL}/user/management/moderator/csv`
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadWealthData() {
      try {
        const { data } = await request.get(`${URL}/user/management/wealth`);
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadWealthDataCSV() {
      try {
        const { data } = await axios.get(`${URL}/user/management/wealth/csv`);
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async addModerators(newModerators: number[]) {
      try {
        const { data } = await request.post(
          `${URL}/user/management/moderator`,
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
        } = await request.post(
          `${URL}/user/management/supermod`,
          { supermods },
          auth()
        );
        return Promise.resolve(newSupermods);
      } catch (error) {
        return handleError(error);
      }
    },
    async approveRequest({
      type,
      data,
      isApproved,
      userId
    }: {
      type: string;
      data: {
        dob: string;
      };
      isApproved: boolean;
      userId: number;
    }) {
      try {
        const params = { isApproved, userId, data, type };
        const {
          data: { status }
        } = await request.put(
          `${URL}/management/approval/${type}`,
          params,
          auth()
        );
        return status;
      } catch (error) {
        return handleError(error);
      }
    },
    async changeSupermodRole({
      userId,
      role
    }: {
      userId: number;
      role?: string;
    }) {
      try {
        const {
          data: { unlockedAchievementIds, level, achievementPoints, title }
        } = await request.put(
          `${URL}/user/management/supermod`,
          { userId, role },
          auth()
        );
        return {
          unlockedAchievementIds,
          level,
          achievementPoints,
          title
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async checkDobApprovalSubmission() {
      try {
        const {
          data: { isSubmitted, content, status }
        } = await request.get(`${URL}/management/approval/dob`, auth());
        return {
          isSubmitted,
          content,
          status
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async checkMeetupApprovalSubmission() {
      try {
        const {
          data: { isSubmitted, content, status }
        } = await request.get(`${URL}/management/approval/meetup`, auth());
        return {
          isSubmitted,
          content,
          status
        };
      } catch (error) {
        return handleError(error);
      }
    },
    async convertUser(userId: number) {
      try {
        const {
          data: { success }
        } = await request.put(`${URL}/management/convert`, { userId }, auth());
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async deleteMessagePermanently({
      messageId,
      filePath,
      fileName
    }: {
      messageId: number;
      filePath?: string;
      fileName?: string;
    }) {
      try {
        const {
          data: { success }
        } = await request.delete(
          `${URL}/chat/message/permanently?messageId=${messageId}${
            filePath ? `&filePath=${filePath}` : ''
          }${fileName ? `&fileName=${fileName}` : ''}`,
          auth()
        );
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async deletePostPermanently({
      contentId,
      contentType,
      filePath,
      fileName
    }: {
      contentId: number;
      contentType: string;
      filePath?: string;
      fileName?: string;
    }) {
      try {
        const {
          data: { success }
        } = await request.delete(
          `${URL}/content/permanently?contentId=${contentId}&contentType=${contentType}${
            filePath ? `&filePath=${filePath}` : ''
          }${fileName ? `&fileName=${fileName}` : ''}`,
          auth()
        );
        return success;
      } catch (error) {
        return handleError(error);
      }
    },
    async grantAchievements({
      targetUserIds,
      achievementType
    }: {
      targetUserIds: number[];
      achievementType: string;
    }) {
      try {
        const {
          data: { results }
        } = await request.post(
          `${URL}/management/grant`,
          { targetUserIds, achievementType },
          auth()
        );
        return results;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadAccountTypes() {
      try {
        const { data } = await request.get(
          `${URL}/user/management/accountType`
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async deleteAccountType(accountTypeLabel: string) {
      try {
        const {
          data: { success }
        } = await request.delete(
          `${URL}/user/management/accountType?accountTypeLabel=${accountTypeLabel}`,
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
          `${URL}/user/management/accountType`,
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
    async loadAllAchievements() {
      try {
        const { data } = await request.get(`${URL}/management/achievements`);
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadApprovalItemById(approvalId: number) {
      try {
        const { data: approvalItem } = await request.get(
          `${URL}/management/approval/byId?approvalId=${approvalId}`,
          auth()
        );
        return approvalItem;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadApprovalItems() {
      try {
        const { data: approvalItems } = await request.get(
          `${URL}/management/approval`,
          auth()
        );
        return approvalItems;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadBannedUsers() {
      try {
        const { data } = await request.get(`${URL}/user/management/banned`);
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadDeletedContent({
      contentId,
      contentType
    }: {
      contentId: number;
      contentType: string;
    }) {
      try {
        const { data } = await request.get(
          `${URL}/management/deleted/content?contentId=${contentId}&contentType=${contentType}`
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadDeletedMessage(messageId: number) {
      try {
        const { data } = await request.get(
          `${URL}/management/deleted/message?messageId=${messageId}`
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadDeletedPosts(contentType: string) {
      try {
        const { data } = await request.get(
          `${URL}/management/deleted?contentType=${contentType}`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadModificationItem(modificationId: number) {
      try {
        const { data: modificationItem } = await request.get(
          `${URL}/management/modification${
            modificationId ? `?modificationId=${modificationId}` : ''
          }}`,
          auth()
        );
        return modificationItem;
      } catch (error) {
        return handleError(error);
      }
    },
    async loadSupermods() {
      try {
        const {
          data: { supermods }
        } = await request.get(`${URL}/user/management/supermod`);
        return supermods;
      } catch (error) {
        return handleError(error);
      }
    },
    async retryDobApproval(dob: string) {
      try {
        const {
          data: { status }
        } = await request.put(
          `${URL}/management/approval/dob/retry`,
          { dob },
          auth()
        );
        return status;
      } catch (error) {
        return handleError(error);
      }
    },
    async retryMeetupApproval(meetupDetails: string) {
      try {
        const {
          data: { status }
        } = await request.put(
          `${URL}/management/approval/meetup/retry`,
          { meetupDetails },
          auth()
        );
        return status;
      } catch (error) {
        return handleError(error);
      }
    },
    async revertApproval({ userId, type }: { userId: number; type: string }) {
      try {
        const {
          data: { status }
        } = await request.put(
          `${URL}/management/approval/revert`,
          { userId, approvalType: type },
          auth()
        );
        return status;
      } catch (error) {
        return handleError(error);
      }
    },
    async submitDobForApproval(dob: string) {
      try {
        const data = await request.post(
          `${URL}/management/approval/dob`,
          { dob },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async submitMeetupForApproval(meetupDetails: string) {
      try {
        const data = await request.post(
          `${URL}/management/approval/meetup`,
          { meetupDetails },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async updateBanStatus({
      userId,
      banStatus
    }: {
      userId: number;
      banStatus: object;
    }) {
      try {
        await request.put(
          `${URL}/user/management/banned`,
          { userId, banStatus },
          auth()
        );
        return { success: true };
      } catch (error) {
        return handleError(error);
      }
    }
  };
}

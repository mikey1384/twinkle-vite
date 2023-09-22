import request from 'axios';
import URL from '~/constants/URL';
import { RequestHelpers } from '~/types';

export default function managementRequestHelpers({
  auth,
  handleError
}: RequestHelpers) {
  return {
    async approveRequests({
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
        return Promise.resolve(status);
      } catch (error) {
        return handleError(error);
      }
    },
    async deletePermanently({
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
        return Promise.resolve(success);
      } catch (error) {
        return handleError(error);
      }
    },
    async loadAccountTypes() {
      try {
        const { data } = await request.get(`${URL}/user/accountType`);
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async loadBannedUsers() {
      try {
        const { data } = await request.get(`${URL}/user/banned`);
        return Promise.resolve(data);
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
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async loadDeletedPosts() {
      try {
        const { data } = await request.get(`${URL}/management/deleted`, auth());
        return Promise.resolve(data);
      } catch (error) {
        return handleError(error);
      }
    },
    async loadModerators() {
      try {
        const {
          data: { moderators }
        } = await request.get(`${URL}/user/moderator`);
        return Promise.resolve(moderators);
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
        return Promise.resolve(approvalItem);
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
        return Promise.resolve(approvalItems);
      } catch (error) {
        return handleError(error);
      }
    },
    async checkDobApprovalSubmission() {
      try {
        const {
          data: { isSubmitted, content, status }
        } = await request.get(`${URL}/management/approval/dob`, auth());
        return Promise.resolve({
          isSubmitted,
          content,
          status
        });
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
        return Promise.resolve(status);
      } catch (error) {
        return handleError(error);
      }
    },
    async revertDobApproval(userId: number) {
      try {
        const {
          data: { status }
        } = await request.put(
          `${URL}/management/approval/dob/revert`,
          { userId },
          auth()
        );
        return Promise.resolve(status);
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
        return Promise.resolve(data);
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
        await request.put(`${URL}/user/banned`, { userId, banStatus }, auth());
        return Promise.resolve();
      } catch (error) {
        return handleError(error);
      }
    }
  };
}

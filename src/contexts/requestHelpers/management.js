import request from 'axios';
import URL from '~/constants/URL';

export default function managementRequestHelpers({ auth, handleError }) {
  return {
    async deletePermanently({ contentId, contentType, filePath, fileName }) {
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
    async loadDeletedContent({ contentId, contentType }) {
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
    async updateBanStatus({ userId, banStatus }) {
      try {
        await request.put(`${URL}/user/banned`, { userId, banStatus }, auth());
        return Promise.resolve();
      } catch (error) {
        return handleError(error);
      }
    }
  };
}

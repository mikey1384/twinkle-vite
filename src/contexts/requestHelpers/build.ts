import request from './axiosInstance';
import URL from '~/constants/URL';
import { RequestHelpers } from '~/types';

export default function buildRequestHelpers({
  auth,
  handleError
}: RequestHelpers) {
  return {
    async createBuild({
      title,
      description
    }: {
      title: string;
      description?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/create`,
          { title, description },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async loadBuild(buildId: number) {
      try {
        const { data } = await request.get(`${URL}/build/${buildId}`, auth());
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async loadMyBuilds() {
      try {
        const { data } = await request.get(`${URL}/build/list/mine`, auth());
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async updateBuildCode({
      buildId,
      code
    }: {
      buildId: number;
      code: string;
    }) {
      try {
        const { data } = await request.put(
          `${URL}/build/${buildId}/code`,
          { code },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async generateBuildCode({
      buildId,
      message
    }: {
      buildId: number;
      message: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/generate`,
          { message },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async deleteBuild(buildId: number) {
      try {
        const { data } = await request.delete(
          `${URL}/build/${buildId}`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async downloadBuildDatabase(buildId: number) {
      try {
        const response = await request.get(`${URL}/build/${buildId}/db`, {
          ...auth(),
          responseType: 'arraybuffer'
        });
        if (response.status === 204) {
          return null;
        }
        return response.data;
      } catch (error) {
        return handleError(error);
      }
    },

    async uploadBuildDatabase({
      buildId,
      data
    }: {
      buildId: number;
      data: ArrayBuffer;
    }) {
      try {
        const response = await request.put(`${URL}/build/${buildId}/db`, data, {
          ...auth(),
          headers: {
            ...auth().headers,
            'Content-Type': 'application/x-sqlite3'
          }
        });
        return response.data;
      } catch (error) {
        return handleError(error);
      }
    },

    async loadBuildAiPrompts() {
      try {
        const { data } = await request.get(`${URL}/build/ai-prompts`);
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async callBuildAiChat({
      buildId,
      promptId,
      message,
      history
    }: {
      buildId: number;
      promptId: number;
      message: string;
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/ai-chat`,
          { promptId, message, history },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    }
  };
}

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

    async loadBuild(buildId: number, options?: { fromWriter?: boolean }) {
      try {
        const qs = options?.fromWriter ? '?fromWriter=1' : '';
        const { data } = await request.get(`${URL}/build/${buildId}${qs}`, auth());
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async deleteBuildChatMessage({
      buildId,
      messageId
    }: {
      buildId: number;
      messageId: number;
    }) {
      try {
        const { data } = await request.delete(
          `${URL}/build/${buildId}/chat/message/${messageId}`,
          auth()
        );
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

    async loadWallpaperCode(buildId: number) {
      try {
        const { data } = await request.get(
          `${URL}/build/${buildId}/wallpaper`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async updateBuildCode({
      buildId,
      code,
      createVersion,
      summary
    }: {
      buildId: number;
      code: string;
      createVersion?: boolean;
      summary?: string;
    }) {
      try {
        const { data } = await request.put(
          `${URL}/build/${buildId}/code`,
          { code, createVersion, summary },
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
    },

    async listBuildArtifacts(buildId: number) {
      try {
        const { data } = await request.get(
          `${URL}/build/${buildId}/artifacts`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async listBuildArtifactVersions({
      buildId,
      artifactId,
      limit
    }: {
      buildId: number;
      artifactId: number;
      limit?: number;
    }) {
      try {
        const params = limit ? { limit } : undefined;
        const { data } = await request.get(
          `${URL}/build/${buildId}/artifacts/${artifactId}/versions`,
          {
            ...auth(),
            params
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async restoreBuildArtifactVersion({
      buildId,
      artifactId,
      versionId
    }: {
      buildId: number;
      artifactId: number;
      versionId: number;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/artifacts/${artifactId}/restore`,
          { versionId },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async publishBuild({
      buildId,
      thumbnailUrl
    }: {
      buildId: number;
      thumbnailUrl?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/publish`,
          { thumbnailUrl },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async unpublishBuild(buildId: number) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/unpublish`,
          {},
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async loadPublicBuilds({
      sort = 'recent',
      limit = 20,
      lastId
    }: {
      sort?: 'recent' | 'popular' | 'starred';
      limit?: number;
      lastId?: number;
    } = {}) {
      try {
        const params: Record<string, any> = { sort, limit };
        if (lastId) params.lastId = lastId;
        const { data } = await request.get(`${URL}/build/public/list`, {
          params
        });
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async loadUserBuilds({
      userId,
      limit = 20,
      lastId
    }: {
      userId: number;
      limit?: number;
      lastId?: number;
    }) {
      try {
        const params: Record<string, any> = { limit };
        if (lastId) params.lastId = lastId;
        const { data } = await request.get(`${URL}/build/user/${userId}`, {
          params
        });
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async starBuild(buildId: number) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/star`,
          {},
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async loadBuildComments({
      buildId,
      lastCommentId,
      limit = 20
    }: {
      buildId: number;
      lastCommentId?: number;
      limit?: number;
    }) {
      try {
        const params: Record<string, any> = { limit };
        if (lastCommentId) params.lastCommentId = lastCommentId;
        const { data } = await request.get(
          `${URL}/build/${buildId}/comments`,
          { ...auth(), params }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async postBuildComment({
      buildId,
      content,
      replyId,
      fileName,
      filePath,
      fileSize,
      thumbUrl
    }: {
      buildId: number;
      content: string;
      replyId?: number;
      fileName?: string;
      filePath?: string;
      fileSize?: number;
      thumbUrl?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/comments`,
          { content, replyId, fileName, filePath, fileSize, thumbUrl },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async rewardBuild({
      buildId,
      rewardAmount,
      rewardComment
    }: {
      buildId: number;
      rewardAmount: number;
      rewardComment?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/reward`,
          { rewardAmount, rewardComment },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async forkBuild(buildId: number) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/fork`,
          {},
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async followBuildUser({
      buildId,
      userId
    }: {
      buildId: number;
      userId: number;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/social/follow/${userId}`,
          {},
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async unfollowBuildUser({
      buildId,
      userId
    }: {
      buildId: number;
      userId: number;
    }) {
      try {
        const { data } = await request.delete(
          `${URL}/build/${buildId}/social/follow/${userId}`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async loadBuildFollowers({
      buildId,
      limit = 50,
      offset = 0
    }: {
      buildId: number;
      limit?: number;
      offset?: number;
    }) {
      try {
        const params: Record<string, any> = { limit, offset };
        const { data } = await request.get(
          `${URL}/build/${buildId}/social/followers`,
          { ...auth(), params }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async loadBuildFollowing({
      buildId,
      limit = 50,
      offset = 0
    }: {
      buildId: number;
      limit?: number;
      offset?: number;
    }) {
      try {
        const params: Record<string, any> = { limit, offset };
        const { data } = await request.get(
          `${URL}/build/${buildId}/social/following`,
          { ...auth(), params }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async isFollowingBuildUser({
      buildId,
      userId
    }: {
      buildId: number;
      userId: number;
    }) {
      try {
        const { data } = await request.get(
          `${URL}/build/${buildId}/social/is-following/${userId}`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async queryViewerDb({
      buildId,
      sql,
      params
    }: {
      buildId: number;
      sql: string;
      params?: any[];
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/viewer-db/query`,
          { sql, params },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async execViewerDb({
      buildId,
      sql,
      params
    }: {
      buildId: number;
      sql: string;
      params?: any[];
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/viewer-db/exec`,
          { sql, params },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async getBuildApiToken({
      buildId,
      scopes
    }: {
      buildId: number;
      scopes?: string[];
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/token`,
          { scopes },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async getBuildApiUser({
      buildId,
      userId,
      token
    }: {
      buildId: number;
      userId: number;
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/user`,
          { userId },
          {
            ...auth(),
            headers: {
              ...auth().headers,
              ...(token ? { 'x-build-api-token': token } : {})
            }
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async getBuildApiUsers({
      buildId,
      search,
      userIds,
      cursor,
      limit,
      token
    }: {
      buildId: number;
      search?: string;
      userIds?: number[];
      cursor?: { id?: number };
      limit?: number;
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/users`,
          { search, userIds, cursor, limit },
          {
            ...auth(),
            headers: {
              ...auth().headers,
              ...(token ? { 'x-build-api-token': token } : {})
            }
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async getBuildDailyReflections({
      buildId,
      following,
      userIds,
      lastId,
      cursor,
      limit,
      token
    }: {
      buildId: number;
      following?: boolean;
      userIds?: number[];
      lastId?: number;
      cursor?: { id?: number; sharedAt?: number };
      limit?: number;
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/daily-reflections`,
          { following, userIds, lastId, cursor, limit },
          {
            ...auth(),
            headers: {
              ...auth().headers,
              ...(token ? { 'x-build-api-token': token } : {})
            }
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async lookupBuildVocabularyWord({
      buildId,
      word,
      token
    }: {
      buildId: number;
      word: string;
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/vocabulary/lookup`,
          { word },
          {
            ...auth(),
            headers: {
              ...auth().headers,
              ...(token ? { 'x-build-api-token': token } : {})
            }
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async collectBuildVocabularyWord({
      buildId,
      word,
      token
    }: {
      buildId: number;
      word: string;
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/vocabulary/collect`,
          { word },
          {
            ...auth(),
            headers: {
              ...auth().headers,
              ...(token ? { 'x-build-api-token': token } : {})
            }
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async getBuildVocabularyBreakStatus({
      buildId,
      token
    }: {
      buildId: number;
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/vocabulary/break-status`,
          {},
          {
            ...auth(),
            headers: {
              ...auth().headers,
              ...(token ? { 'x-build-api-token': token } : {})
            }
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async getBuildCollectedVocabularyWords({
      buildId,
      limit,
      cursor,
      token
    }: {
      buildId: number;
      limit?: number;
      cursor?: { id?: number };
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/vocabulary/collected`,
          { limit, cursor },
          {
            ...auth(),
            headers: {
              ...auth().headers,
              ...(token ? { 'x-build-api-token': token } : {})
            }
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async getBuildMySubjects({
      buildId,
      limit,
      cursor,
      token
    }: {
      buildId: number;
      limit?: number;
      cursor?: { id?: number };
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/content/my-subjects`,
          { limit, cursor },
          {
            ...auth(),
            headers: {
              ...auth().headers,
              ...(token ? { 'x-build-api-token': token } : {})
            }
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async getBuildSubject({
      buildId,
      subjectId,
      token
    }: {
      buildId: number;
      subjectId: number;
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/content/subject`,
          { subjectId },
          {
            ...auth(),
            headers: {
              ...auth().headers,
              ...(token ? { 'x-build-api-token': token } : {})
            }
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async getBuildSubjectComments({
      buildId,
      subjectId,
      limit,
      cursor,
      token
    }: {
      buildId: number;
      subjectId: number;
      limit?: number;
      cursor?: { id?: number };
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/content/subject-comments`,
          { subjectId, limit, cursor },
          {
            ...auth(),
            headers: {
              ...auth().headers,
              ...(token ? { 'x-build-api-token': token } : {})
            }
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async getSharedDbTopics({
      buildId,
      token
    }: {
      buildId: number;
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/shared-db/topics`,
          {},
          {
            ...auth(),
            headers: {
              ...auth().headers,
              ...(token ? { 'x-build-api-token': token } : {})
            }
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async createSharedDbTopic({
      buildId,
      name,
      token
    }: {
      buildId: number;
      name: string;
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/shared-db/topic`,
          { name },
          {
            ...auth(),
            headers: {
              ...auth().headers,
              ...(token ? { 'x-build-api-token': token } : {})
            }
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async getSharedDbEntries({
      buildId,
      topicName,
      topicId,
      limit,
      cursor,
      token
    }: {
      buildId: number;
      topicName?: string;
      topicId?: number;
      limit?: number;
      cursor?: { id?: number };
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/shared-db/entries`,
          { topicName, topicId, limit, cursor },
          {
            ...auth(),
            headers: {
              ...auth().headers,
              ...(token ? { 'x-build-api-token': token } : {})
            }
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async addSharedDbEntry({
      buildId,
      topicName,
      topicId,
      data: entryData,
      token
    }: {
      buildId: number;
      topicName?: string;
      topicId?: number;
      data: Record<string, any>;
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/shared-db/entry`,
          { topicName, topicId, data: entryData },
          {
            ...auth(),
            headers: {
              ...auth().headers,
              ...(token ? { 'x-build-api-token': token } : {})
            }
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async updateSharedDbEntry({
      buildId,
      entryId,
      data: entryData,
      token
    }: {
      buildId: number;
      entryId: number;
      data: Record<string, any>;
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/shared-db/entry/update`,
          { entryId, data: entryData },
          {
            ...auth(),
            headers: {
              ...auth().headers,
              ...(token ? { 'x-build-api-token': token } : {})
            }
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async deleteSharedDbEntry({
      buildId,
      entryId,
      token
    }: {
      buildId: number;
      entryId: number;
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/shared-db/entry/delete`,
          { entryId },
          {
            ...auth(),
            headers: {
              ...auth().headers,
              ...(token ? { 'x-build-api-token': token } : {})
            }
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async getPrivateDbItem({
      buildId,
      key,
      token
    }: {
      buildId: number;
      key: string;
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/private-db/get`,
          { key },
          {
            ...auth(),
            headers: {
              ...auth().headers,
              ...(token ? { 'x-build-api-token': token } : {})
            }
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async listPrivateDbItems({
      buildId,
      prefix,
      limit,
      cursor,
      token
    }: {
      buildId: number;
      prefix?: string;
      limit?: number;
      cursor?: { id?: number };
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/private-db/list`,
          { prefix, limit, cursor },
          {
            ...auth(),
            headers: {
              ...auth().headers,
              ...(token ? { 'x-build-api-token': token } : {})
            }
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async setPrivateDbItem({
      buildId,
      key,
      value,
      token
    }: {
      buildId: number;
      key: string;
      value: any;
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/private-db/set`,
          { key, value },
          {
            ...auth(),
            headers: {
              ...auth().headers,
              ...(token ? { 'x-build-api-token': token } : {})
            }
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async deletePrivateDbItem({
      buildId,
      key,
      token
    }: {
      buildId: number;
      key: string;
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/private-db/delete`,
          { key },
          {
            ...auth(),
            headers: {
              ...auth().headers,
              ...(token ? { 'x-build-api-token': token } : {})
            }
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async scheduleBuildJob({
      buildId,
      name,
      runAt,
      intervalSeconds,
      maxRuns,
      data: jobData,
      scope,
      token
    }: {
      buildId: number;
      name: string;
      runAt: number;
      intervalSeconds?: number;
      maxRuns?: number;
      data?: any;
      scope?: 'user' | 'build';
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/jobs/schedule`,
          { name, runAt, intervalSeconds, maxRuns, data: jobData, scope },
          {
            ...auth(),
            headers: {
              ...auth().headers,
              ...(token ? { 'x-build-api-token': token } : {})
            }
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async listBuildJobs({
      buildId,
      scope,
      status,
      limit,
      cursor,
      token
    }: {
      buildId: number;
      scope?: 'user' | 'build';
      status?: 'active' | 'cancelled' | 'completed';
      limit?: number;
      cursor?: { id?: number };
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/jobs/list`,
          { scope, status, limit, cursor },
          {
            ...auth(),
            headers: {
              ...auth().headers,
              ...(token ? { 'x-build-api-token': token } : {})
            }
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async cancelBuildJob({
      buildId,
      jobId,
      token
    }: {
      buildId: number;
      jobId: number;
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/jobs/cancel`,
          { jobId },
          {
            ...auth(),
            headers: {
              ...auth().headers,
              ...(token ? { 'x-build-api-token': token } : {})
            }
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async claimDueBuildJobs({
      buildId,
      scope,
      limit,
      token
    }: {
      buildId: number;
      scope?: 'user' | 'build';
      limit?: number;
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/jobs/claim-due`,
          { scope, limit },
          {
            ...auth(),
            headers: {
              ...auth().headers,
              ...(token ? { 'x-build-api-token': token } : {})
            }
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async sendBuildMail({
      buildId,
      to,
      subject,
      text,
      html,
      from,
      replyTo,
      meta,
      token
    }: {
      buildId: number;
      to: string | string[];
      subject: string;
      text?: string;
      html?: string;
      from?: string;
      replyTo?: string;
      meta?: any;
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/mail/send`,
          { to, subject, text, html, from, replyTo, meta },
          {
            ...auth(),
            headers: {
              ...auth().headers,
              ...(token ? { 'x-build-api-token': token } : {})
            }
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async listBuildMail({
      buildId,
      status,
      limit,
      cursor,
      token
    }: {
      buildId: number;
      status?: 'queued' | 'sent' | 'failed';
      limit?: number;
      cursor?: { id?: number };
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/mail/list`,
          { status, limit, cursor },
          {
            ...auth(),
            headers: {
              ...auth().headers,
              ...(token ? { 'x-build-api-token': token } : {})
            }
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    }
  };
}

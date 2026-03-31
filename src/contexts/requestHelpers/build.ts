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

    async loadRuntimeBuild(buildId: number, options?: { fromWriter?: boolean }) {
      try {
        const qs = options?.fromWriter ? '?fromWriter=1' : '';
        const { data } = await request.get(
          `${URL}/build/${buildId}/runtime${qs}`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async updateBuildMetadata({
      buildId,
      description
    }: {
      buildId: number;
      description?: string | null;
    }) {
      try {
        const { data } = await request.put(
          `${URL}/build/${buildId}`,
          { description },
          auth()
        );
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

    async loadBuildProjectFiles(
      buildId: number,
      options?: { fromWriter?: boolean }
    ) {
      try {
        const qs = options?.fromWriter ? '?fromWriter=1' : '';
        const { data } = await request.get(
          `${URL}/build/${buildId}/project-files${qs}`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async updateBuildProjectFiles({
      buildId,
      files,
      createVersion,
      summary
    }: {
      buildId: number;
      files: Array<{ path: string; content: string }>;
      createVersion?: boolean;
      summary?: string;
    }) {
      try {
        const { data } = await request.put(
          `${URL}/build/${buildId}/project-files`,
          { files, createVersion, summary },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async createBuildPreviewSession({
      buildId,
      sessionId,
      entryPath,
      codeSignature,
      files
    }: {
      buildId: number;
      sessionId?: string;
      entryPath?: string | null;
      codeSignature?: string | null;
      files: Array<{ path: string; content: string }>;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/preview-session`,
          {
            sessionId,
            entryPath,
            codeSignature,
            files
          },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async loadBuildProjectFileChangeLogs(
      buildId: number,
      options?: { fromWriter?: boolean; limit?: number }
    ) {
      try {
        const queryParts: string[] = [];
        if (options?.fromWriter) {
          queryParts.push('fromWriter=1');
        }
        if (
          Number.isFinite(Number(options?.limit)) &&
          Number(options?.limit) > 0
        ) {
          queryParts.push(`limit=${Math.floor(Number(options?.limit))}`);
        }
        const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
        const { data } = await request.get(
          `${URL}/build/${buildId}/project-file-change-logs${qs}`,
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

    async deleteBuild({
      buildId,
      confirmTitle
    }: {
      buildId: number;
      confirmTitle: string;
    }) {
      try {
        const { data } = await request.delete(
          `${URL}/build/${buildId}`,
          {
            ...auth(),
            data: { confirmTitle }
          }
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
      lastId,
      cursor
    }: {
      sort?: 'recent' | 'popular';
      limit?: number;
      lastId?: number;
      cursor?: string;
    } = {}) {
      try {
        const params: Record<string, any> = { sort, limit };
        if (cursor) {
          params.cursor = cursor;
        } else if (lastId) {
          params.lastId = lastId;
        }
        const { data } = await request.get(`${URL}/build/public/list`, {
          params
        });
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
      userIds,
      lastId,
      cursor,
      limit,
      token
    }: {
      buildId: number;
      userIds?: number[];
      lastId?: number;
      cursor?: { id?: number; sharedAt?: number };
      limit?: number;
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/daily-reflections`,
          { userIds, lastId, cursor, limit },
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

    async getBuildProfileComments({
      buildId,
      profileUserId,
      limit,
      offset,
      sortBy,
      includeReplies,
      range,
      since,
      until,
      token
    }: {
      buildId: number;
      profileUserId?: number;
      limit?: number;
      offset?: number;
      sortBy?: 'newest' | 'oldest';
      includeReplies?: boolean;
      range?: 'today';
      since?: number;
      until?: number;
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/content/profile-comments`,
          {
            profileUserId,
            limit,
            offset,
            sortBy,
            includeReplies,
            range,
            since,
            until
          },
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

    async getBuildProfileCommentIds({
      buildId,
      profileUserId,
      limit,
      offset,
      sortBy,
      includeReplies,
      range,
      since,
      until,
      token
    }: {
      buildId: number;
      profileUserId?: number;
      limit?: number;
      offset?: number;
      sortBy?: 'newest' | 'oldest';
      includeReplies?: boolean;
      range?: 'today';
      since?: number;
      until?: number;
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/content/profile-comment-ids`,
          {
            profileUserId,
            limit,
            offset,
            sortBy,
            includeReplies,
            range,
            since,
            until
          },
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

    async getBuildProfileCommentsByIds({
      buildId,
      ids,
      token
    }: {
      buildId: number;
      ids: number[];
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/content/profile-comments-by-ids`,
          { ids },
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

    async getBuildProfileCommentCounts({
      buildId,
      ids,
      token
    }: {
      buildId: number;
      ids: number[];
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/content/profile-comment-counts`,
          { ids },
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

    async listBuildReminders({
      buildId,
      includeDisabled,
      limit,
      token
    }: {
      buildId: number;
      includeDisabled?: boolean;
      limit?: number;
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/reminders/list`,
          { includeDisabled, limit },
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

    async createBuildReminder({
      buildId,
      title,
      body,
      targetPath,
      payload,
      schedule,
      isEnabled,
      token
    }: {
      buildId: number;
      title: string;
      body?: string | null;
      targetPath?: string | null;
      payload?: any;
      schedule: Record<string, any>;
      isEnabled?: boolean;
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/reminders/create`,
          { title, body, targetPath, payload, schedule, isEnabled },
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

    async updateBuildReminder({
      buildId,
      reminderId,
      title,
      body,
      targetPath,
      payload,
      schedule,
      isEnabled,
      token
    }: {
      buildId: number;
      reminderId: number;
      title?: string;
      body?: string | null;
      targetPath?: string | null;
      payload?: any;
      schedule?: Record<string, any>;
      isEnabled?: boolean;
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/reminders/update`,
          { reminderId, title, body, targetPath, payload, schedule, isEnabled },
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

    async deleteBuildReminder({
      buildId,
      reminderId,
      token
    }: {
      buildId: number;
      reminderId: number;
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/reminders/delete`,
          { reminderId },
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

    async getDueBuildReminders({
      buildId,
      now,
      autoAcknowledge,
      limit,
      token
    }: {
      buildId: number;
      now?: number;
      autoAcknowledge?: boolean;
      limit?: number;
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/reminders/due`,
          { now, autoAcknowledge, limit },
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

  };
}

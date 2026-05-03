import axios from 'axios';
import request from './axiosInstance';
import URL from '~/constants/URL';
import { getFileInfoFromFileName } from '~/helpers/stringHelpers';
import { RequestHelpers } from '~/types';

export default function buildRequestHelpers({
  auth,
  handleError
}: RequestHelpers) {
  const BUILD_RUNTIME_UPLOAD_CHUNK_SIZE = 5 * 1024 * 1024;

  interface BuildRuntimeAiChatStreamEvent {
    type?: string;
    status?: string;
    text?: string;
    response?: string;
    delta?: string;
    done?: boolean;
    model?: string;
    aiUsagePolicy?: Record<string, any>;
    error?: string;
    code?: string;
  }

  function getBuildApiConfig(token?: string) {
    return {
      ...auth(),
      headers: {
        ...auth().headers,
        ...(token ? { 'x-build-api-token': token } : {})
      }
    };
  }

  function getFetchAuthHeaders(extraHeaders?: Record<string, string>) {
    const headers = new Headers();
    const authHeaders = auth()?.headers || {};
    Object.entries(authHeaders).forEach(([key, value]) => {
      if (value == null) return;
      headers.set(key, String(value));
    });
    Object.entries(extraHeaders || {}).forEach(([key, value]) => {
      headers.set(key, value);
    });
    return headers;
  }

  async function readBuildRuntimeAiChatStream({
    response,
    onEvent
  }: {
    response: Response;
    onEvent?: (event: BuildRuntimeAiChatStreamEvent) => void;
  }) {
    const decoder = new TextDecoder();
    const reader = response.body?.getReader();
    let buffer = '';
    let finalEvent: BuildRuntimeAiChatStreamEvent | null = null;

    function consumeLine(rawLine: string) {
      const line = rawLine.trim();
      if (!line) return;
      const event = JSON.parse(line) as BuildRuntimeAiChatStreamEvent;
      onEvent?.(event);
      if (event.type === 'error') {
        throw new Error(event.error || 'AI chat stream failed');
      }
      if (event.type === 'done') {
        finalEvent = event;
      }
    }

    if (!reader) {
      const text = await response.text();
      text.split('\n').forEach(consumeLine);
      return finalEvent || {};
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        consumeLine(line);
      }
    }

    buffer += decoder.decode();
    if (buffer.trim()) {
      consumeLine(buffer);
    }

    return finalEvent || {};
  }

  function isVideoRuntimeUploadCandidate(file: File) {
    const mimeType = String(file?.type || '').toLowerCase();
    if (mimeType.startsWith('video/')) {
      return true;
    }
    return getFileInfoFromFileName(file?.name || '').fileType === 'video';
  }

  function isRuntimeUploadFileCandidate(file: unknown): file is File {
    if (!file || typeof file !== 'object') return false;
    if (typeof File !== 'undefined' && file instanceof File) return true;
    const candidate = file as File;
    return (
      typeof candidate.name === 'string' &&
      typeof candidate.slice === 'function' &&
      Number.isFinite(Number(candidate.size)) &&
      Number(candidate.size) > 0
    );
  }

  async function prepareBuildRuntimeFileUpload({
    buildId,
    file,
    token
  }: {
    buildId: number;
    file: File;
    token?: string;
  }) {
    const { data } = await request.post(
      `${URL}/build/${buildId}/api/files/prepare-upload`,
      {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || null
      },
      getBuildApiConfig(token)
    );
    return data;
  }

  async function completeBuildRuntimeFileUpload({
    buildId,
    assetId,
    uploadId,
    key,
    parts,
    token
  }: {
    buildId: number;
    assetId: number;
    uploadId: string;
    key: string;
    parts: Array<{ ETag: string; PartNumber: number }>;
    token?: string;
  }) {
    const { data } = await request.post(
      `${URL}/build/${buildId}/api/files/complete-upload`,
      {
        assetId,
        uploadId,
        key,
        parts
      },
      getBuildApiConfig(token)
    );
    return data;
  }

  async function abortBuildRuntimeFileUpload({
    buildId,
    assetId,
    reason,
    token
  }: {
    buildId: number;
    assetId: number;
    reason?: string;
    token?: string;
  }) {
    const { data } = await request.post(
      `${URL}/build/${buildId}/api/files/abort-upload`,
      {
        assetId,
        reason
      },
      getBuildApiConfig(token)
    );
    return data;
  }

  async function listBuildRuntimeFiles({
    buildId,
    cursor,
    limit,
    token
  }: {
    buildId: number;
    cursor?: number | null;
    limit?: number;
    token?: string;
  }) {
    const { data } = await request.post(
      `${URL}/build/${buildId}/api/files/list`,
      {
        cursor,
        limit
      },
      getBuildApiConfig(token)
    );
    return data;
  }

  async function deleteBuildRuntimeFile({
    buildId,
    assetId,
    token
  }: {
    buildId: number;
    assetId: number;
    token?: string;
  }) {
    const { data } = await request.post(
      `${URL}/build/${buildId}/api/files/delete`,
      {
        assetId
      },
      getBuildApiConfig(token)
    );
    return data;
  }

  async function uploadBuildRuntimeFile({
    buildId,
    file,
    token,
    onUploadProgress
  }: {
    buildId: number;
    file: File;
    token?: string;
    onUploadProgress?: (event: {
      file: File;
      loaded: number;
      total: number;
    }) => void;
  }) {
    if (isVideoRuntimeUploadCandidate(file)) {
      throw new Error('Video uploads are not supported in Twinkle.files yet.');
    }
    const prepared = await prepareBuildRuntimeFileUpload({
      buildId,
      file,
      token
    });
    const uploadId = String(prepared?.uploadId || '');
    const key = String(prepared?.key || '');
    const urls = Array.isArray(prepared?.urls) ? prepared.urls : [];
    const assetId = Number(prepared?.asset?.id);

    if (!uploadId || !key || urls.length === 0 || !assetId) {
      throw new Error('Failed to prepare upload.');
    }

    let start = 0;
    const parts: Array<{ ETag: string; PartNumber: number }> = [];
    try {
      for (let partNumber = 0; partNumber < urls.length; partNumber += 1) {
        const end = Math.min(
          start + BUILD_RUNTIME_UPLOAD_CHUNK_SIZE,
          file.size
        );
        const chunk = file.slice(start, end);
        const response = await axios.put(urls[partNumber], chunk, {
          timeout: 0,
          headers: {
            'Content-Type': file.type || prepared?.asset?.mimeType || undefined
          },
          onUploadProgress: (progressEvent) => {
            if (!onUploadProgress) return;
            const loaded =
              partNumber * BUILD_RUNTIME_UPLOAD_CHUNK_SIZE +
              Number(progressEvent.loaded || 0);
            onUploadProgress({
              file,
              loaded: Math.min(loaded, file.size),
              total: file.size
            });
          }
        });
        const etag = response.headers?.etag || response.headers?.ETag;
        if (!etag) {
          throw new Error(
            `Missing ETag in upload response for part ${partNumber + 1}.`
          );
        }
        parts.push({
          ETag: String(etag).replace(/['"]/g, ''),
          PartNumber: partNumber + 1
        });
        start = end;
      }

      const completed = await completeBuildRuntimeFileUpload({
        buildId,
        assetId,
        uploadId,
        key,
        parts,
        token
      });
      onUploadProgress?.({
        file,
        loaded: file.size,
        total: file.size
      });
      return completed?.asset || prepared?.asset || null;
    } catch (error) {
      await abortBuildRuntimeFileUpload({
        buildId,
        assetId,
        reason: 'upload_failed',
        token
      }).catch(() => {});
      throw error;
    }
  }

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
      } catch (error: any) {
        if (error?.response?.data?.aiUsagePolicy) {
          return Promise.reject({
            status: error.response.status,
            message: error.response.data.error || 'AI chat failed',
            code: error.response.data.code,
            aiUsagePolicy: error.response.data.aiUsagePolicy
          });
        }
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

    async loadBuildForkHistory(
      buildId: number,
      options?: { fromWriter?: boolean }
    ) {
      try {
        const qs = options?.fromWriter ? '?fromWriter=1' : '';
        const { data } = await request.get(
          `${URL}/build/${buildId}/fork-history${qs}`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async loadBuildBranch({
      buildId,
      branchNumber,
      options
    }: {
      buildId: number;
      branchNumber: number;
      options?: { fromWriter?: boolean };
    }) {
      try {
        const qs = options?.fromWriter ? '?fromWriter=1' : '';
        const { data } = await request.get(
          `${URL}/build/${buildId}/branches/${branchNumber}${qs}`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async loadBuildRuntimeUploads(options?: {
      cursor?: number | null;
      limit?: number;
    }) {
      try {
        const params: Record<string, any> = {};
        if (Number.isFinite(Number(options?.cursor)) && Number(options?.cursor) > 0) {
          params.cursor = Math.floor(Number(options?.cursor));
        }
        if (Number.isFinite(Number(options?.limit)) && Number(options?.limit) > 0) {
          params.limit = Math.floor(Number(options?.limit));
        }
        const { data } = await request.get(`${URL}/build/runtime-files`, {
          ...auth(),
          params
        });
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async deleteBuildRuntimeUpload(assetId: number) {
      try {
        const { data } = await request.delete(
          `${URL}/build/runtime-files/${assetId}`,
          auth()
        );
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
      title,
      description,
      thumbnailUrl
    }: {
      buildId: number;
      title?: string;
      description?: string | null;
      thumbnailUrl?: string | null;
    }) {
      try {
        const { data } = await request.put(
          `${URL}/build/${buildId}`,
          { title, description, thumbnailUrl },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async uploadBuildThumbnail({
      buildId,
      file
    }: {
      buildId: number;
      file: File;
    }) {
      try {
        const {
          data: { signedRequest, thumbnailUrl }
        } = await request.post(
          `${URL}/build/${buildId}/thumbnail`,
          {
            fileSize: file.size,
            contentType: file.type || 'image/jpeg'
          },
          auth()
        );
        await axios.put(signedRequest, file, {
          headers: {
            'Content-Type': file.type || 'image/jpeg'
          }
        });
        const { data } = await request.put(
          `${URL}/build/${buildId}`,
          { thumbnailUrl },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async captureBuildThumbnailPreview({
      buildId,
      previewPath
    }: {
      buildId: number;
      previewPath: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/thumbnail/capture-preview`,
          { previewPath },
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

    async routeBuildChatUpload({
      buildId,
      messageText,
      files
    }: {
      buildId: number;
      messageText?: string;
      files: Array<{
        fileName: string;
        mimeType?: string | null;
        sizeBytes?: number | null;
      }>;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/chat/upload-route`,
          {
            messageText,
            files
          },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async createBuildChatAssistantNote({
      buildId,
      text
    }: {
      buildId: number;
      text: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/chat/assistant-note`,
          { text },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async createBuildChatUserNote({
      buildId,
      text
    }: {
      buildId: number;
      text: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/chat/user-note`,
          { text },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async createBuildChatReferenceNote({
      buildId,
      messageText,
      references,
      hidden
    }: {
      buildId: number;
      messageText?: string;
      references: Array<{
        fileName: string;
        url: string;
        mimeType?: string | null;
      }>;
      hidden?: boolean;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/chat/reference-note`,
          {
            messageText,
            references,
            hidden: Boolean(hidden)
          },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async cleanupBuildChatReferenceUploads({
      buildId,
      uploads
    }: {
      buildId: number;
      uploads: Array<{
        filePath: string;
        storedFileName: string;
      }>;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/chat/reference-upload-cleanup`,
          { uploads },
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

    async loadCollaboratingBuilds({
      limit = 20,
      cursor
    }: {
      limit?: number;
      cursor?: string;
    } = {}) {
      try {
        const params: Record<string, any> = { limit };
        if (cursor) {
          params.cursor = cursor;
        }
        const { data } = await request.get(`${URL}/build/list/collaborating`, {
          ...auth(),
          params
        });
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async loadMyPublicBuildsForPinning() {
      try {
        const { data } = await request.get(
          `${URL}/build/list/mine/public`,
          auth()
        );
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

    async downloadBuildProjectArchive(buildId: number) {
      try {
        const response = await request.get(
          `${URL}/build/${buildId}/project-export`,
          {
            ...auth(),
            responseType: 'arraybuffer',
            timeout: 0,
            meta: {
              enforceTimeout: false,
              allowExtendedTimeout: true
            }
          }
        );
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

    async callBuildRuntimeAiChat({
      buildId,
      promptId,
      message,
      history,
      systemPrompt
    }: {
      buildId: number;
      promptId?: number;
      message: string;
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
      systemPrompt?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/runtime-ai-chat`,
          { promptId, message, history, systemPrompt },
          auth()
        );
        return data;
      } catch (error: any) {
        const response = error?.response;
        if (response?.data?.code || response?.data?.aiUsagePolicy) {
          return Promise.reject({
            status: response.status,
            message:
              response.data.error ||
              response.data.message ||
              'AI chat failed',
            code: response.data.code,
            aiUsagePolicy: response.data.aiUsagePolicy
          });
        }
        return handleError(error);
      }
    },

    async callBuildRuntimeAiChatStream({
      buildId,
      promptId,
      message,
      history,
      systemPrompt,
      onEvent
    }: {
      buildId: number;
      promptId?: number;
      message: string;
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
      systemPrompt?: string;
      onEvent?: (event: BuildRuntimeAiChatStreamEvent) => void;
    }) {
      try {
        const response = await fetch(
          `${URL}/build/${buildId}/runtime-ai-chat/stream`,
          {
            method: 'POST',
            headers: getFetchAuthHeaders({
              Accept: 'application/x-ndjson',
              'Content-Type': 'application/json'
            }),
            body: JSON.stringify({ promptId, message, history, systemPrompt })
          }
        );
        if (!response.ok) {
          const errorPayload = await response.json().catch(() => null);
          const error: any = new Error(
            errorPayload?.error || 'AI chat stream failed'
          );
          if (errorPayload?.code) error.code = errorPayload.code;
          if (errorPayload?.aiUsagePolicy) {
            error.aiUsagePolicy = errorPayload.aiUsagePolicy;
          }
          throw error;
        }
        return await readBuildRuntimeAiChatStream({ response, onEvent });
      } catch (error: any) {
        if (error?.aiUsagePolicy || error?.code) {
          return Promise.reject(error);
        }
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
      } catch (error: any) {
        if (
          error?.response &&
          error.response.status !== 401 &&
          error.response.status !== 301
        ) {
          const responseData = error.response.data || {};
          const nextError: any = new Error(
            responseData.error ||
              responseData.message ||
              error.message ||
              'Unable to publish Build'
          );
          nextError.status = error.response.status;
          nextError.response = error.response;
          if (responseData.code) {
            nextError.code = responseData.code;
          }
          if (responseData.releaseStatus) {
            nextError.releaseStatus = responseData.releaseStatus;
          }
          if (Array.isArray(responseData.conflictMarkerPaths)) {
            nextError.conflictMarkerPaths = responseData.conflictMarkerPaths;
          }
          if (responseData.mergingContributionBuildId) {
            nextError.mergingContributionBuildId =
              responseData.mergingContributionBuildId;
          }
          return Promise.reject(nextError);
        }
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

    async purchaseBuildGenerationReset(buildId: number) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/purchase-generation-reset`,
          {},
          auth()
        );
        return data;
      } catch (error: any) {
        if (
          error?.response &&
          error.response.status !== 401 &&
          error.response.status !== 301
        ) {
          const nextError: any = new Error(
            error.response.data?.error ||
              error.response.data?.message ||
              error.message ||
              'Failed to recharge AI Energy'
          );
          nextError.status = error.response.status;
          if (error.response.data?.code) {
            nextError.code = error.response.data.code;
          }
          if (typeof error.response.data?.requiredCoins === 'number') {
            nextError.requiredCoins = error.response.data.requiredCoins;
          }
          if (typeof error.response.data?.currentCoins === 'number') {
            nextError.currentCoins = error.response.data.currentCoins;
          }
          if (error.response.data?.requestLimits) {
            nextError.requestLimits = error.response.data.requestLimits;
          }
          return Promise.reject(nextError);
        }
        return handleError(error);
      }
    },

    async loadPublicBuilds({
      sort = 'recent',
      scope = 'all',
      excludeMine = false,
      limit = 20,
      lastId,
      cursor
    }: {
      sort?: 'recent' | 'popular';
      scope?: 'all' | 'open_source';
      excludeMine?: boolean;
      limit?: number;
      lastId?: number;
      cursor?: string;
    } = {}) {
      try {
        const params: Record<string, any> = { sort, scope, limit };
        if (excludeMine) {
          params.excludeMine = 1;
        }
        if (cursor) {
          params.cursor = cursor;
        } else if (lastId) {
          params.lastId = lastId;
        }
        const { data } = cursor
          ? await request.post(`${URL}/build/public/list`, params, auth())
          : await request.get(`${URL}/build/public/list`, {
              ...auth(),
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

    async updateBuildCollaboration({
      buildId,
      collaborationMode,
      contributionAccess
    }: {
      buildId: number;
      collaborationMode: 'private' | 'contribution' | 'open_source';
      contributionAccess: 'anyone' | 'invite_only';
    }) {
      try {
        const { data } = await request.patch(
          `${URL}/build/${buildId}/collaboration`,
          { collaborationMode, contributionAccess },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async updateBuildLumineChatVisibility({
      buildId,
      visibility
    }: {
      buildId: number;
      visibility: 'private' | 'collaborators';
    }) {
      try {
        const { data } = await request.patch(
          `${URL}/build/${buildId}/lumine-chat-visibility`,
          { visibility },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async loadBuildLumineChatHistory(buildId: number) {
      try {
        const { data } = await request.get(
          `${URL}/build/${buildId}/lumine-chat-history`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async loadBuildContributors(buildId: number) {
      try {
        const { data } = await request.get(
          `${URL}/build/${buildId}/contributors`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async inviteBuildContributor({
      buildId,
      userId
    }: {
      buildId: number;
      userId: number;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/contributors`,
          { userId },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async revokeBuildContributor({
      buildId,
      userId
    }: {
      buildId: number;
      userId: number;
    }) {
      try {
        const { data } = await request.delete(
          `${URL}/build/${buildId}/contributors/${userId}`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async acceptBuildContributorInvite({
      buildId,
      inviteId
    }: {
      buildId: number;
      inviteId: number;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/contributor-invites/${inviteId}/accept`,
          {},
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async declineBuildContributorInvite({
      buildId,
      inviteId
    }: {
      buildId: number;
      inviteId: number;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/contributor-invites/${inviteId}/decline`,
          {},
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async loadMyBuildCollaborationRequest(buildId: number) {
      try {
        const { data } = await request.get(
          `${URL}/build/${buildId}/collaboration-requests/mine`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async createBuildCollaborationRequest({
      buildId,
      message
    }: {
      buildId: number;
      message?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/collaboration-requests`,
          { message },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async loadBuildCollaborationRequests({
      buildId,
      hidden = false
    }: {
      buildId: number;
      hidden?: boolean;
    }) {
      try {
        const { data } = await request.get(
          `${URL}/build/${buildId}/collaboration-requests`,
          {
            ...auth(),
            params: hidden ? { hidden: 1 } : undefined
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async acceptBuildCollaborationRequest({
      buildId,
      requestId
    }: {
      buildId: number;
      requestId: number;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/collaboration-requests/${requestId}/accept`,
          {},
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async rejectBuildCollaborationRequest({
      buildId,
      requestId
    }: {
      buildId: number;
      requestId: number;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/collaboration-requests/${requestId}/reject`,
          {},
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async hideBuildCollaborationRequest({
      buildId,
      requestId
    }: {
      buildId: number;
      requestId: number;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/collaboration-requests/${requestId}/hide`,
          {},
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async cancelBuildCollaborationRequest({
      buildId,
      requestId
    }: {
      buildId: number;
      requestId: number;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/collaboration-requests/${requestId}/cancel`,
          {},
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async createBuildContributionFork(input: {
      buildId: number;
      name: string;
    }) {
      const buildId = input.buildId;
      const name = input.name;
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/contributions/fork`,
          { name },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async loadBuildContributions(buildId: number) {
      try {
        const { data } = await request.get(
          `${URL}/build/${buildId}/contributions`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async loadBuildContribution({
      buildId,
      contributionBuildId
    }: {
      buildId: number;
      contributionBuildId: number;
    }) {
      try {
        const { data } = await request.get(
          `${URL}/build/${buildId}/contributions/${contributionBuildId}`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async updateBuildContributionFromMain({
      buildId,
      contributionBuildId
    }: {
      buildId: number;
      contributionBuildId: number;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/contributions/${contributionBuildId}/update-from-main`,
          {},
          auth()
        );
        return data;
      } catch (error: any) {
        if (
          error?.response?.data?.code ===
          'build_contribution_conflict_markers_remaining'
        ) {
          return error.response.data;
        }
        return handleError(error);
      }
    },

    async mergeBuildContribution({
      buildId,
      contributionBuildId,
      filePaths
    }: {
      buildId: number;
      contributionBuildId: number;
      filePaths?: string[];
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/contributions/${contributionBuildId}/merge`,
          { filePaths },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async completeBuildContributionMerge({
      buildId,
      contributionBuildId
    }: {
      buildId: number;
      contributionBuildId: number;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/contributions/${contributionBuildId}/complete-merge`,
          {},
          auth()
        );
        return data;
      } catch (error: any) {
        if (
          error?.response?.data?.code ===
          'build_contribution_conflict_markers_remaining'
        ) {
          return error.response.data;
        }
        return handleError(error);
      }
    },

    async loadBuildContributionForumThreads({
      buildId,
      contributionBuildId
    }: {
      buildId: number;
      contributionBuildId?: number | null;
    }) {
      try {
        const { data } = await request.get(
          `${URL}/build/${buildId}/contribution-forum-threads`,
          {
            ...auth(),
            params: contributionBuildId ? { contributionBuildId } : undefined
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async createBuildContributionForumThread({
      buildId,
      contributionBuildId,
      title,
      body
    }: {
      buildId: number;
      contributionBuildId?: number | null;
      title: string;
      body: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/contribution-forum-threads`,
          { contributionBuildId, title, body },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async loadBuildContributionForumThread({
      buildId,
      threadId
    }: {
      buildId: number;
      threadId: number;
    }) {
      try {
        const { data } = await request.get(
          `${URL}/build/${buildId}/contribution-forum-threads/${threadId}`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async createBuildContributionForumReply({
      buildId,
      threadId,
      body
    }: {
      buildId: number;
      threadId: number;
      body: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/contribution-forum-threads/${threadId}/replies`,
          { body },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async deleteBuildContributionForumThread({
      buildId,
      threadId
    }: {
      buildId: number;
      threadId: number;
    }) {
      try {
        const { data } = await request.delete(
          `${URL}/build/${buildId}/contribution-forum-threads/${threadId}`,
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async deleteBuildContributionForumReply({
      buildId,
      threadId,
      replyId
    }: {
      buildId: number;
      threadId: number;
      replyId: number;
    }) {
      try {
        const { data } = await request.delete(
          `${URL}/build/${buildId}/contribution-forum-threads/${threadId}/replies/${replyId}`,
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

    async uploadBuildRuntimeFiles({
      buildId,
      files,
      token,
      onUploadProgress
    }: {
      buildId: number;
      files: File[];
      token?: string;
      onUploadProgress?: (event: {
        file: File;
        loaded: number;
        total: number;
      }) => void;
    }) {
      try {
        const normalizedFiles = Array.isArray(files)
          ? files.filter(isRuntimeUploadFileCandidate)
          : [];
        if (normalizedFiles.length === 0) {
          console.warn('[build-runtime-files-upload] no uploadable files', {
            receivedCount: Array.isArray(files) ? files.length : 0
          });
          return { assets: [] };
        }

        const assets = [];
        const failed: Array<{ fileName: string; message: string }> = [];
        for (const file of normalizedFiles) {
          try {
            const asset = await uploadBuildRuntimeFile({
              buildId,
              file,
              token,
              onUploadProgress
            });
            if (asset) {
              assets.push(asset);
            }
          } catch (error: any) {
            failed.push({
              fileName: String(file?.name || 'file'),
              message: String(error?.message || 'Upload failed')
            });
          }
        }

        if (assets.length === 0 && failed.length > 0) {
          const error: any = new Error(
            failed[0]?.message || 'Failed to upload files.'
          );
          error.code = 'build_runtime_upload_failed';
          error.failed = failed;
          throw error;
        }

        return failed.length > 0 ? { assets, failed } : { assets };
      } catch (error) {
        return handleError(error);
      }
    },

    async listBuildRuntimeFiles({
      buildId,
      cursor,
      limit,
      token
    }: {
      buildId: number;
      cursor?: number | null;
      limit?: number;
      token?: string;
    }) {
      try {
        return await listBuildRuntimeFiles({
          buildId,
          cursor,
          limit,
          token
        });
      } catch (error) {
        return handleError(error);
      }
    },

    async deleteBuildRuntimeFile({
      buildId,
      assetId,
      token
    }: {
      buildId: number;
      assetId: number;
      token?: string;
    }) {
      try {
        return await deleteBuildRuntimeFile({
          buildId,
          assetId,
          token
        });
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
      pageSize,
      cursor,
      order,
      token
    }: {
      buildId: number;
      topicName?: string;
      topicId?: number;
      limit?: number;
      pageSize?: number;
      cursor?: { id?: number };
      order?: string;
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/shared-db/entries`,
          { topicName, topicId, limit, pageSize, cursor, order },
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

    async listBuildChatRooms({
      buildId,
      token
    }: {
      buildId: number;
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/chat/rooms/list`,
          {},
          getBuildApiConfig(token)
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async createBuildChatRoom({
      buildId,
      roomKey,
      name,
      token
    }: {
      buildId: number;
      roomKey: string;
      name?: string | null;
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/chat/rooms/create`,
          { roomKey, name },
          getBuildApiConfig(token)
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async listBuildChatMessages({
      buildId,
      roomKey,
      cursor,
      limit,
      token
    }: {
      buildId: number;
      roomKey: string;
      cursor?: { id?: number };
      limit?: number;
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/chat/messages/list`,
          { roomKey, cursor, limit },
          getBuildApiConfig(token)
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async sendBuildChatMessage({
      buildId,
      roomKey,
      roomName,
      text,
      metadata,
      clientMessageId,
      token
    }: {
      buildId: number;
      roomKey: string;
      roomName?: string | null;
      text: string;
      metadata?: Record<string, any> | null;
      clientMessageId?: string | null;
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/chat/messages/send`,
          { roomKey, roomName, text, metadata, clientMessageId },
          getBuildApiConfig(token)
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    async deleteBuildRuntimeChatMessage({
      buildId,
      messageId,
      token
    }: {
      buildId: number;
      messageId: number;
      token?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/build/${buildId}/api/chat/messages/delete`,
          { messageId },
          getBuildApiConfig(token)
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

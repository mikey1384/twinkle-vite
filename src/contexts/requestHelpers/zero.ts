import request from './axiosInstance';
import axios from 'axios';
import URL from '~/constants/URL';
import { RequestHelpers } from '~/types';
import {
  readBuildRuntimeAiStream,
  type BuildRuntimeAiStreamEvent
} from './buildRuntimeAiStream';

export default function zeroRequestHelpers({
  auth,
  handleError
}: RequestHelpers) {
  return {
    async loadWebsiteAgentStarters() {
      try {
        const { data } = await request.get(
          `${URL}/zero/website-agent/starters`,
          auth()
        );
        return Array.isArray(data?.ideas) ? data.ideas : [];
      } catch (error) {
        return handleError(error);
      }
    },
    async decideWebsiteAgentCard({
      messageId,
      cardId,
      approved,
      choice,
      previewedAssetProposalId,
      previewedProfileActionId,
      previewedPayloadHash
    }: {
      messageId: number;
      cardId: string;
      approved?: boolean;
      choice?: string;
      previewedAssetProposalId?: string;
      previewedProfileActionId?: string;
      previewedPayloadHash?: string;
    }) {
      try {
        const { data } = await request.post(
          `${URL}/zero/website-agent/cards/decide`,
          { messageId, cardId, approved, choice, previewedAssetProposalId, previewedProfileActionId, previewedPayloadHash },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async generateVideoSubtitles({
      chunk,
      targetLanguage,
      filename,
      onProgress,
      chunkIndex,
      totalChunks,
      processAudio,
      contentType
    }: {
      chunk: string;
      targetLanguage: string;
      filename: string;
      onProgress?: (progress: number) => void;
      chunkIndex?: number;
      totalChunks?: number;
      processAudio?: boolean;
      contentType?: string;
    }) {
      try {
        const { data } = await axios.post(
          `${URL}/zero/subtitle`,
          {
            chunk,
            targetLanguage,
            filename,
            chunkIndex,
            totalChunks,
            processAudio,
            contentType
          },
          {
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total && onProgress) {
                const percentCompleted = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total
                );
                onProgress(percentCompleted);
              }
            },
            ...auth()
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async splitSubtitles({
      srt,
      numSplits
    }: {
      srt: string;
      numSplits: number;
    }) {
      try {
        const response = await axios.put(
          `${URL}/zero/subtitle/split`,
          { srt, numSplits },
          { responseType: 'blob', ...auth() }
        );
        return response.data;
      } catch (error) {
        return handleError(error);
      }
    },
    async mergeSubtitles(srtFiles: string[]) {
      try {
        const { data } = await axios.put(
          `${URL}/zero/subtitle/merge`,
          { srt: srtFiles },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    async mergeVideoWithSubtitles({
      chunk,
      srtContent,
      sessionId,
      chunkIndex,
      totalChunks,
      contentType,
      processVideo,
      onProgress
    }: {
      chunk?: string; // Base64-encoded chunk of the video
      srtContent?: string; // Subtitle content, sent only with the last chunk
      sessionId: string; // Unique identifier for the upload session
      chunkIndex: number; // Index of the current chunk
      totalChunks: number; // Total number of chunks
      contentType: string; // MIME type of the video (e.g., 'video/mp4')
      processVideo: boolean; // True only for the last chunk to trigger merging
      onProgress?: (progress: number) => void; // Progress callback for chunk upload
    }) {
      try {
        const response = await axios.post(
          `${URL}/zero/subtitle/merge-video`,
          {
            chunk,
            srtContent,
            sessionId,
            chunkIndex,
            totalChunks,
            contentType,
            processVideo
          },
          {
            onDownloadProgress: (progressEvent) => {
              if (progressEvent.total && onProgress) {
                const percentCompleted = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total
                );
                onProgress(percentCompleted);
              }
            },
            ...auth() // Assuming this adds authentication headers
          }
        );

        if (response.data.videoUrl) {
          const downloadUrl = `${URL}${response.data.videoUrl}`;
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `merged_video_${sessionId}.mp4`; // Use sessionId for uniqueness
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }

        return response.data;
      } catch (error) {
        return handleError(error); // Assuming handleError is defined elsewhere
      }
    },
    // Quick Ask: a temporary chat with Zero that is not saved to the
    // member's chat history (twinkle-api helpers/ai/quickAsk.ts). The reply
    // streams as NDJSON in the Build runtime AI stream's frames.
    async streamQuickAsk({
      agent,
      sessionKey,
      message,
      askedAbout,
      signal,
      onEvent
    }: {
      agent?: 'Zero' | 'Ciel';
      sessionKey?: string;
      message: string;
      // what the member pressed Ask on (the server re-reads it as them)
      askedAbout?: Record<string, any> | null;
      signal?: AbortSignal;
      onEvent?: (event: BuildRuntimeAiStreamEvent & Record<string, any>) => void;
    }) {
      const headers = new Headers();
      Object.entries(auth()?.headers || {}).forEach(([key, value]) => {
        if (value != null) headers.set(key, String(value));
      });
      headers.set('Accept', 'application/x-ndjson');
      headers.set('Content-Type', 'application/json');
      const response = await fetch(`${URL}/zero/quick-ask/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          agent: agent || 'Zero',
          sessionKey: sessionKey || undefined,
          message,
          ...(askedAbout ? { askedAbout } : {})
        }),
        signal
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const error: any = new Error(
          payload?.error || 'Zero couldn’t answer just now. Try again.'
        );
        error.status = response.status;
        if (payload?.code) error.code = payload.code;
        throw error;
      }
      return readBuildRuntimeAiStream({ response, onEvent });
    },
    // Save to chat: copies one Quick Ask answer (the server reads it from its
    // own record) into the member's chat with Zero. No AI Energy.
    async saveQuickAskTurn(turnId: number) {
      try {
        const { data } = await request.post(
          `${URL}/zero/quick-ask/save`,
          { turnId },
          auth()
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
    // A day counter for opening Quick Ask; nothing else is stored.
    async recordQuickAskOpen() {
      try {
        await request.post(`${URL}/zero/quick-ask/open`, {}, auth());
      } catch {
        // telemetry only
      }
    },
    async textToSpeech(text: string, voice: string) {
      try {
        const { data } = await request.post(
          `${URL}/zero/tts`,
          { text, voice },
          {
            ...auth(),
            responseType: 'blob'
          }
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    }
  };
}

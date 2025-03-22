import request from './axiosInstance';
import axios from 'axios';
import URL from '~/constants/URL';
import { RequestHelpers } from '~/types';

export default function zeroRequestHelpers({
  auth,
  handleError
}: RequestHelpers) {
  return {
    async checkWorkshopAvailability({
      contentId,
      contentType
    }: {
      contentId: number;
      contentType: string;
    }) {
      if (!contentId || !contentType)
        return handleError('Invalid contentId or contentType');
      try {
        const { data } = await request.get(
          `${URL}/zero/workshop?contentId=${contentId}&contentType=${contentType}`,
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
      processAudio
    }: {
      chunk: string;
      targetLanguage: string;
      filename: string;
      onProgress?: (progress: number) => void;
      chunkIndex?: number;
      totalChunks?: number;
      processAudio?: boolean;
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
            processAudio
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
      chunk?: string;
      srtContent?: string;
      sessionId: string;
      chunkIndex: number;
      totalChunks: number;
      contentType: string;
      processVideo: boolean;
      onProgress?: (progress: number) => void;
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
            ...auth()
          }
        );

        if (response.data.videoUrl) {
          const downloadUrl = `${URL}${response.data.videoUrl}`;
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `merged_video_${sessionId}.mp4`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }

        return response.data;
      } catch (error) {
        return handleError(error);
      }
    },
    async textToSpeech(text: string, voice: string) {
      try {
        const { data } = await request.post(
          `${URL}/zero/tts`,
          { text, voice },
          {
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

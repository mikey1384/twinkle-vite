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
                // Calculate upload percentage
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
          { responseType: 'blob' }
        );
        return response.data;
      } catch (error) {
        return handleError(error);
      }
    },
    async mergeSubtitles(srtFiles: string[]) {
      try {
        const { data } = await axios.put(`${URL}/zero/subtitle/merge`, {
          srt: srtFiles
        });
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

        // Handle the download when the video URL is returned (last chunk)
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

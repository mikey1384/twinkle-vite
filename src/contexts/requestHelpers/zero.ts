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
      videoData,
      srtContent,
      filename,
      onProgress
    }: {
      videoData: string;
      srtContent: string;
      filename: string;
      onProgress?: (progress: number, stage: string) => void;
    }) {
      try {
        // First notify about upload starting
        if (onProgress) onProgress(0, 'Preparing to upload');

        // Send the entire file in one request, just like generateVideoSubtitles
        const response = await axios.post(
          `${URL}/zero/subtitle/merge-video`,
          {
            videoData,
            srtContent,
            filename
          },
          {
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total && onProgress) {
                const percentCompleted = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total
                );
                onProgress(percentCompleted, 'Uploading video');
              }
            },
            ...auth()
          }
        );

        // Once the response is received, handle the download
        if (onProgress) onProgress(100, 'Processing complete');

        const downloadUrl = `${URL}${response.data.videoUrl}`;

        // Create a temporary anchor element to trigger the download
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename || 'video-with-subtitles.mp4';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Return a placeholder blob since we're downloading directly
        return {
          ...response.data,
          videoBlob: new Blob([], { type: 'video/mp4' })
        };
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

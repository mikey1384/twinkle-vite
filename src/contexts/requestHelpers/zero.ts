import request from './axiosInstance';
import axios from 'axios';
import URL from '~/constants/URL';
import { RequestHelpers } from '~/types';
import { socket } from '~/constants/sockets/api';

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
        // Create a timestamp to identify this upload across all chunks
        const uploadTimestamp = Date.now();

        // First notify about upload starting
        if (onProgress) onProgress(0, 'Preparing to upload');

        // Setup socket listener for subtitle merge progress
        const handleProgress = (data: {
          progress: number;
          stage: string;
          error?: string;
        }) => {
          if (onProgress && data.progress > 0) {
            onProgress(data.progress, data.stage);
            if (data.stage === 'Complete') {
              // Cleanup socket listener when complete
              socket.off('subtitle_merge_progress', handleProgress);
            } else if (data.stage === 'error') {
              console.error('Error in subtitle merge:', data.error);
              socket.off('subtitle_merge_progress', handleProgress);
            }
          }
        };

        // Attach socket listener
        socket.on('subtitle_merge_progress', handleProgress);

        // Always use chunked upload approach for better consistency with subtitle endpoint
        const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
        const base64Data = videoData.split(',')[1] || '';
        const totalChunks = Math.ceil(base64Data.length / CHUNK_SIZE);
        const contentType =
          videoData.split(';')[0].split(':')[1] || 'video/mp4';

        // Upload each chunk
        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
          const start = chunkIndex * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, base64Data.length);
          const chunkData = base64Data.substring(start, end);
          const isLastChunk = chunkIndex === totalChunks - 1;

          // Prepare chunk data with proper format
          const chunkBase64 = `data:${contentType};base64,${chunkData}`;

          // Upload this chunk with retry logic
          let retries = 0;
          const maxRetries = 3;

          while (retries < maxRetries) {
            try {
              if (onProgress) {
                const overallProgress = Math.round(
                  (chunkIndex / totalChunks) * 40
                );
                onProgress(
                  overallProgress,
                  `Uploading chunk ${chunkIndex + 1}/${totalChunks}`
                );
              }

              const response = await axios.post(
                `${URL}/zero/subtitle/merge-video`,
                {
                  chunk: chunkBase64,
                  srtContent: isLastChunk ? srtContent : null, // Only send SRT with last chunk
                  filename,
                  chunkIndex,
                  totalChunks,
                  processVideo: isLastChunk, // Only process after last chunk
                  contentType,
                  uploadTimestamp // Add the timestamp to keep session ID consistent
                },
                {
                  ...auth()
                }
              );

              // If this is the last chunk, handle the response
              if (isLastChunk) {
                // The socket will handle the progress updates from here
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
              }

              // If successful, break the retry loop
              break;
            } catch (error) {
              retries++;
              console.error(
                `Chunk ${chunkIndex} upload failed (attempt ${retries}/${maxRetries}):`,
                error
              );

              if (retries >= maxRetries) {
                // Clean up socket listener if we're going to throw an error
                socket.off('subtitle_merge_progress', handleProgress);
                throw error;
              }

              // Exponential backoff
              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * Math.pow(2, retries))
              );

              if (onProgress) {
                onProgress(
                  Math.round((chunkIndex / totalChunks) * 40),
                  `Retrying chunk ${chunkIndex + 1}/${totalChunks} (attempt ${
                    retries + 1
                  }/${maxRetries})`
                );
              }
            }
          }
        }

        // This should never be reached if the last chunk was processed successfully
        socket.off('subtitle_merge_progress', handleProgress);
        throw new Error(
          'Unexpected error: Last chunk did not return proper response'
        );
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

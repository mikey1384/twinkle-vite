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

        // Check if the video data is large and needs chunking
        const isLargeFile = videoData.length > 10 * 1024 * 1024; // 10MB threshold

        if (isLargeFile) {
          // Chunked upload approach
          const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
          const base64Data = videoData.split(',')[1] || '';
          const totalChunks = Math.ceil(base64Data.length / CHUNK_SIZE);
          const sessionId = `${Date.now()}-${filename.replace(
            /[^a-zA-Z0-9]/g,
            '_'
          )}`;

          // Upload each chunk
          for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
            const start = chunkIndex * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, base64Data.length);
            const chunkData = base64Data.substring(start, end);
            const isLastChunk = chunkIndex === totalChunks - 1;

            // Prepare chunk data with proper format
            const chunkBase64 = `data:${
              videoData.split(';')[0].split(':')[1]
            };base64,${chunkData}`;

            // Upload this chunk with retry logic
            let retries = 0;
            const maxRetries = 3;

            while (retries < maxRetries) {
              try {
                if (onProgress) {
                  const overallProgress = Math.round(
                    (chunkIndex / totalChunks) * 50
                  );
                  onProgress(
                    overallProgress,
                    `Uploading chunk ${chunkIndex + 1}/${totalChunks}`
                  );
                }

                const response = await axios.post(
                  `${URL}/zero/subtitle/merge-video/chunk`,
                  {
                    chunk: chunkBase64,
                    srtContent: isLastChunk ? srtContent : null, // Only send SRT with last chunk
                    filename,
                    sessionId,
                    chunkIndex,
                    totalChunks,
                    processVideo: isLastChunk // Only process after last chunk
                  },
                  {
                    onUploadProgress: (progressEvent) => {
                      if (progressEvent.total && onProgress) {
                        // Calculate progress for this chunk
                        const chunkProgress = Math.round(
                          (progressEvent.loaded * 100) / progressEvent.total
                        );
                        // Map to overall progress (max 50% for upload phase)
                        const overallProgress = Math.round(
                          ((chunkIndex + chunkProgress / 100) / totalChunks) *
                            50
                        );
                        onProgress(
                          overallProgress,
                          `Uploading chunk ${chunkIndex + 1}/${totalChunks}`
                        );
                      }
                    },
                    ...auth()
                  }
                );

                // If this is the last chunk, handle the response
                if (isLastChunk) {
                  const downloadUrl = `${URL}/zero${response.data.videoUrl}`;

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
                  throw error;
                }

                // Exponential backoff
                await new Promise((resolve) =>
                  setTimeout(resolve, 1000 * Math.pow(2, retries))
                );

                if (onProgress) {
                  onProgress(
                    Math.round((chunkIndex / totalChunks) * 50),
                    `Retrying chunk ${chunkIndex + 1}/${totalChunks} (attempt ${
                      retries + 1
                    }/${maxRetries})`
                  );
                }
              }
            }
          }

          // This should never be reached if the last chunk was processed successfully
          throw new Error(
            'Unexpected error: Last chunk did not return proper response'
          );
        } else {
          // Original non-chunked approach for small files
          const { data } = await axios.post(
            `${URL}/zero/subtitle/merge-video`,
            {
              videoData,
              srtContent,
              filename
            },
            {
              onUploadProgress: (progressEvent) => {
                if (progressEvent.total && onProgress) {
                  // Calculate upload percentage (max 50% for upload phase)
                  const percentCompleted = Math.round(
                    (progressEvent.loaded * 50) / progressEvent.total
                  );
                  onProgress(percentCompleted, 'Uploading files');
                }
              },
              ...auth()
            }
          );

          const downloadUrl = `${URL}/zero${data.videoUrl}`;

          // Create a temporary anchor element to trigger the download
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = filename || 'video-with-subtitles.mp4';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          // Return a placeholder blob since we're downloading directly
          return { ...data, videoBlob: new Blob([], { type: 'video/mp4' }) };
        }
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

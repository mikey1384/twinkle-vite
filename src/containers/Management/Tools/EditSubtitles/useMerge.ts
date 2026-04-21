import { useCallback, useRef, type MutableRefObject } from 'react';
import { mergeStates } from '~/constants/state';
import { useAppContext } from '~/contexts/hooks';
import { generateSrtContent } from './srt';
import type { SrtSegment } from './types';

interface UseMergeArgs {
  videoFile: File | null;
  subtitles: SrtSegment[];
  sessionIdRef: MutableRefObject<string>;
  secondsToSrtTime: (seconds: number) => string;
  onSetError: (error: string) => void;
  onSetIsMergingInProgress: (inProgress: boolean) => void;
  onSetMergeProgress: (progress: number) => void;
  onSetMergeStage: (stage: string) => void;
}

interface MergeResponse {
  error?: string;
  videoUrl?: string;
}

export default function useMerge({
  videoFile,
  subtitles,
  sessionIdRef,
  secondsToSrtTime,
  onSetError,
  onSetIsMergingInProgress,
  onSetMergeProgress,
  onSetMergeStage
}: UseMergeArgs) {
  const mergeVideoWithSubtitles = useAppContext(
    (v) => v.requestHelpers.mergeVideoWithSubtitles
  );
  const mergeVideoWithSubtitlesRef = useRef(mergeVideoWithSubtitles);
  mergeVideoWithSubtitlesRef.current = mergeVideoWithSubtitles;

  const handleMergeVideoWithSubtitles = useCallback(async () => {
    try {
      mergeStates[sessionIdRef.current] = {
        inProgress: true,
        progress: 0,
        stage: 'Preparing files',
        completedTimestamp: 0
      };

      onSetIsMergingInProgress(true);
      onSetMergeProgress(0);
      onSetMergeStage('Preparing files');
      onSetError('');

      if (!videoFile) {
        onSetError('Video file is required for merging');
        mergeStates[sessionIdRef.current].inProgress = false;
        onSetIsMergingInProgress(false);
        return;
      }

      const generatedSrt = generateSrtContent(subtitles, secondsToSrtTime);
      const chunkSize = 5 * 1024 * 1024;
      const totalChunks = Math.ceil(videoFile.size / chunkSize);
      const sessionId = `${Date.now()}-${videoFile.name.replace(
        /[^a-zA-Z0-9]/g,
        '_'
      )}`;
      const uploadedChunkIndexes = new Set<number>();

      const uploadChunkWithRetry = async (
        chunk: Blob,
        chunkIndex: number,
        isLastChunk: boolean,
        maxRetries = 3
      ) => {
        let retries = 0;

        while (retries < maxRetries) {
          try {
            const reader = new FileReader();
            const chunkArrayBuffer = await new Promise<ArrayBuffer>(
              (resolve, reject) => {
                const timeout = setTimeout(
                  () => reject(new Error('File read timed out')),
                  30000
                );

                reader.onload = () => {
                  clearTimeout(timeout);
                  resolve(reader.result as ArrayBuffer);
                };
                reader.onerror = () => {
                  clearTimeout(timeout);
                  reject(new Error('File read error'));
                };

                reader.readAsArrayBuffer(chunk);
              }
            );

            let binary = '';
            const bytes = new Uint8Array(chunkArrayBuffer);
            for (let i = 0; i < bytes.length; i++) {
              binary += String.fromCharCode(bytes[i]);
            }

            const base64 = btoa(binary);
            const chunkBase64 = `data:${videoFile.type};base64,${base64}`;
            const response = (await mergeVideoWithSubtitlesRef.current({
              chunk: chunkBase64,
              srtContent: isLastChunk ? generatedSrt : undefined,
              sessionId,
              chunkIndex,
              totalChunks,
              contentType: videoFile.type,
              processVideo: isLastChunk,
              onProgress: (progress: number) => {
                const chunkProgress = progress / 100;
                const overallProgress = Math.round(
                  ((chunkIndex + chunkProgress) / totalChunks) * 100
                );

                onSetMergeProgress(overallProgress);
                if (mergeStates[sessionIdRef.current]) {
                  mergeStates[sessionIdRef.current].progress = overallProgress;
                }

                if (isLastChunk && progress >= 99) {
                  const stageText = 'Merging video with subtitles';
                  onSetMergeStage(stageText);
                  if (mergeStates[sessionIdRef.current]) {
                    mergeStates[sessionIdRef.current].stage = stageText;
                    mergeStates[sessionIdRef.current].progress = 100;
                  }
                  onSetMergeProgress(100);
                }
              }
            })) as MergeResponse | undefined;

            if (!response || response.error) {
              throw new Error(response?.error || 'Chunk upload failed');
            }

            return response;
          } catch (error) {
            retries += 1;
            console.error(
              `Chunk ${chunkIndex} failed (attempt ${retries}/${maxRetries}):`,
              error
            );

            if (retries >= maxRetries) {
              throw error;
            }

            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * Math.pow(2, retries))
            );

            const retryStage = `Retrying chunk ${
              chunkIndex + 1
            }/${totalChunks} (attempt ${retries + 1})`;
            onSetMergeStage(retryStage);
            if (mergeStates[sessionIdRef.current]) {
              mergeStates[sessionIdRef.current].stage = retryStage;
            }
          }
        }

        return undefined;
      };

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, videoFile.size);
        const chunk = videoFile.slice(start, end);
        const isLastChunk = chunkIndex === totalChunks - 1;

        const uploadStage = `Uploading chunk ${chunkIndex + 1} of ${totalChunks}`;
        onSetMergeStage(uploadStage);
        if (mergeStates[sessionIdRef.current]) {
          mergeStates[sessionIdRef.current].stage = uploadStage;
        }

        const response = await uploadChunkWithRetry(
          chunk,
          chunkIndex,
          isLastChunk
        );
        uploadedChunkIndexes.add(chunkIndex);

        if (isLastChunk && response?.videoUrl) {
          if (uploadedChunkIndexes.size !== totalChunks) {
            const missing = Array.from(
              { length: totalChunks },
              (_, index) => index
            ).filter((index) => !uploadedChunkIndexes.has(index));
            throw new Error(`Missing chunks: ${missing.join(', ')}`);
          }

          const completeStage = 'Merging complete';
          onSetMergeStage(completeStage);

          if (mergeStates[sessionIdRef.current]) {
            mergeStates[sessionIdRef.current].stage = completeStage;
            mergeStates[sessionIdRef.current].completedTimestamp = Date.now();
            mergeStates[sessionIdRef.current].progress = 100;
            mergeStates[sessionIdRef.current].inProgress = false;
          }

          setTimeout(() => {
            onSetIsMergingInProgress(false);
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error merging video with subtitles:', error);
      onSetError(
        error instanceof Error
          ? error.message
          : 'An error occurred while merging video with subtitles'
      );
      onSetIsMergingInProgress(false);
      if (mergeStates[sessionIdRef.current]) {
        mergeStates[sessionIdRef.current].inProgress = false;
        mergeStates[sessionIdRef.current].stage = 'Error occurred';
      }
    }
  }, [
    onSetError,
    onSetIsMergingInProgress,
    onSetMergeProgress,
    onSetMergeStage,
    secondsToSrtTime,
    sessionIdRef,
    subtitles,
    videoFile
  ]);

  const handleMerge = useCallback(() => {
    if (!videoFile || subtitles.length === 0) {
      onSetError('Please upload a video file and subtitle file first');
      return;
    }

    void handleMergeVideoWithSubtitles();
  }, [handleMergeVideoWithSubtitles, onSetError, subtitles.length, videoFile]);

  return { handleMerge };
}

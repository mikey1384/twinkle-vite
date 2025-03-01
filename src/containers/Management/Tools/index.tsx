import React, { useState, useEffect, useRef } from 'react';
import { useAppContext, useManagementContext } from '~/contexts';
import EditSubtitles from './EditSubtitles';
import GenerateSubtitles from './GenerateSubtitles';
import SplitMergeSubtitles from './SplitMergeSubtitles';
import TranslationProgressArea from './TranslationProgressArea';
import MergingProgressArea from './MergingProgressArea';
import BackToTopButton from './BackToTopButton';
import ResultModal from './ResultModal';
import FinalSubtitlesDisplay from './FinalSubtitlesDisplay';
import {
  SrtSegment,
  parseSrt,
  buildSrt,
  secondsToSrtTime,
  srtTimeToSeconds
} from './utils';

export default function Tools() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<number>(0);
  const [progressStage, setProgressStage] = useState<string>('');
  const [translationProgress, setTranslationProgress] = useState<number>(0);
  const [translationStage, setTranslationStage] = useState<string>('');
  const [finalSrt, setFinalSrt] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('original');
  const [showOriginalText, setShowOriginalText] = useState(true);
  const [numSplits, setNumSplits] = useState(2);
  const [mergeFiles, setMergeFiles] = useState<File[]>([]);
  const [splitFile, setSplitFile] = useState<File | null>(null);
  const [isTranslationInProgress, setIsTranslationInProgress] = useState(false);
  const [isMergingInProgress, setIsMergingInProgress] = useState(false);
  const [mergeProgress, setMergeProgress] = useState<number>(0);
  const [mergeStage, setMergeStage] = useState<string>('');
  const generateVideoSubtitles = useAppContext(
    (v) => v.requestHelpers.generateVideoSubtitles
  );
  const splitSubtitles = useAppContext((v) => v.requestHelpers.splitSubtitles);
  const mergeSubtitles = useAppContext((v) => v.requestHelpers.mergeSubtitles);
  const [loading, setLoading] = useState(false);

  // State for subtitle editing
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null); // Stabilized video URL
  const [srtContent, setSrtContent] = useState<string>('');
  const [subtitles, setSubtitles] = useState<SrtSegment[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const playTimeoutRef = useRef<number | null>(null);
  const [editingTimes, setEditingTimes] = useState<{ [key: string]: string }>(
    {}
  );

  // Modal popup states
  const [showResultModal, setShowResultModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState('');
  const [modalActions, setModalActions] = useState<
    Array<{
      label: string;
      action: () => void;
      primary?: boolean;
    }>
  >([]);

  const MAX_MB = 2500;
  const MAX_FILE_SIZE = MAX_MB * 1024 * 1024;

  // Get subtitle translation progress from Management context
  const subtitleProgress = useManagementContext(
    (v) => v.state.subtitleTranslationProgress
  );

  // Get subtitle merge progress from Management context
  const subtitleMergeProgress = useManagementContext(
    (v) => v.state.subtitleMergeProgress
  );

  // Update local progress when management context changes
  useEffect(() => {
    if (subtitleProgress) {
      setTranslationProgress(subtitleProgress.progress);
      setTranslationStage(subtitleProgress.stage);

      // If the progress is not 0, we're in a translation process
      if (subtitleProgress.progress > 0) {
        setIsTranslationInProgress(true);
      }

      // If progress reaches 100%, we're done
      if (subtitleProgress.progress === 100) {
        // Add a small delay before hiding the progress bar
        setTimeout(() => {
          setIsTranslationInProgress(false);
        }, 2000);
      }

      if (subtitleProgress.error) {
        setError(subtitleProgress.error);
      }
    }
  }, [subtitleProgress]);

  // Update local merge progress when management context changes
  useEffect(() => {
    if (subtitleMergeProgress) {
      setMergeProgress(subtitleMergeProgress.progress);
      setMergeStage(subtitleMergeProgress.stage);

      // If the progress is not 0, we're in a merging process
      if (subtitleMergeProgress.progress > 0) {
        setIsMergingInProgress(true);
      }

      // If progress reaches 100%, we're done
      if (subtitleMergeProgress.progress === 100) {
        // Add a small delay before hiding the progress bar
        setTimeout(() => {
          setIsMergingInProgress(false);
        }, 2000);
      }

      if (subtitleMergeProgress.error) {
        setError(subtitleMergeProgress.error);
      }
    }
  }, [subtitleMergeProgress]);

  // Manage video URL creation and cleanup
  useEffect(() => {
    if (videoFile) {
      // Revoke any existing URL before creating a new one
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }

      try {
        // Create URL immediately first
        let url: string | null = null;
        try {
          url = URL.createObjectURL(videoFile);
          setVideoUrl(url);
          setError(''); // Clear any previous errors
        } catch (immediateError) {
          console.error(
            'Error creating object URL immediately:',
            immediateError
          );
          // Don't set error yet, we'll try again with a delay
        }

        // If immediate creation failed or as a backup, try again with a delay
        setTimeout(() => {
          // Only try again if the immediate attempt failed
          if (!url) {
            try {
              url = URL.createObjectURL(videoFile);
              setVideoUrl(url);
              setError(''); // Clear any previous errors
            } catch (delayedError) {
              console.error(
                'Error creating object URL (delayed):',
                delayedError
              );
              setError(
                'Failed to load video file. Please try again with a different format.'
              );
            }
          }
        }, 100);
      } catch (error) {
        console.error('Error in URL creation process:', error);
        setError('Failed to load video file. Please try again.');
      }

      return () => {
        if (videoUrl) {
          URL.revokeObjectURL(videoUrl);
        }
      };
    } else {
      // Clean up URL when videoFile is null
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
        setVideoUrl(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoFile]);

  // --- Generate Subtitles ---
  async function handleFileUpload() {
    setError('');
    setFinalSrt('');
    setProgress(0);
    setProgressStage('');
    setTranslationProgress(0);
    setTranslationStage('');
    setIsTranslationInProgress(true);

    if (!selectedFile) {
      setError('No file selected');
      setIsTranslationInProgress(false);
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`File exceeds ${MAX_MB}MB limit`);
      setIsTranslationInProgress(false);
      return;
    }

    // Load the video immediately to start buffering while we process the subtitles
    setVideoFile(selectedFile);

    // Check if the file is large (over 100MB)
    const isLargeFile = selectedFile.size > 100 * 1024 * 1024;
    if (isLargeFile) {
      console.log(
        `Large video file detected (${Math.round(
          selectedFile.size / (1024 * 1024)
        )}MB). Using chunked upload.`
      );

      try {
        setLoading(true);
        setProgressStage('Preparing file for chunked upload');

        // Define chunk size (5MB)
        const CHUNK_SIZE = 5 * 1024 * 1024;
        const totalChunks = Math.ceil(selectedFile.size / CHUNK_SIZE);
        const uploadedChunkIndexes = new Set();

        // Create a unique session ID for this upload
        const sessionId = `${Date.now()}-${selectedFile.name.replace(
          /[^a-zA-Z0-9]/g,
          '_'
        )}`;
        const sessionFilename = `${sessionId}`;

        console.log(`Starting chunked upload with session ID: ${sessionId}`);
        console.log(`Total chunks to upload: ${totalChunks}`);

        // Helper function to retry failed uploads
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

              // Use ArrayBuffer for better memory efficiency with large files
              const chunkArrayBuffer = await new Promise<ArrayBuffer>(
                (resolve, reject) => {
                  // Set a timeout to detect stalled reads
                  const timeout = setTimeout(() => {
                    reject(new Error('File read operation timed out'));
                  }, 30000); // 30 second timeout

                  reader.onload = () => {
                    clearTimeout(timeout);
                    if (reader.result instanceof ArrayBuffer) {
                      resolve(reader.result);
                    } else {
                      reject(new Error('Failed to read file as ArrayBuffer'));
                    }
                  };
                  reader.onerror = (e) => {
                    clearTimeout(timeout);
                    reject(new Error(`File read error: ${e}`));
                  };
                  reader.readAsArrayBuffer(chunk);
                }
              );

              // Convert ArrayBuffer to base64 - using a more efficient approach
              let binary = '';
              const bytes = new Uint8Array(chunkArrayBuffer);
              const len = bytes.byteLength;

              // Process in smaller chunks to avoid memory issues
              for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
              }

              const base64 = btoa(binary);
              const chunkBase64 = `data:${selectedFile.type};base64,${base64}`;

              // Upload the chunk
              const response = await generateVideoSubtitles({
                chunk: chunkBase64,
                targetLanguage,
                filename: sessionFilename,
                chunkIndex,
                totalChunks,
                contentType: selectedFile.type,
                processAudio: isLastChunk,
                onProgress: (progress: number) => {
                  // Calculate overall progress based on chunks
                  const chunkProgress = progress / 100;
                  const overallProgress = Math.round(
                    ((chunkIndex + chunkProgress) / totalChunks) * 100
                  );
                  setProgress(overallProgress);

                  if (isLastChunk && progress >= 99) {
                    setProgressStage('Processing audio');
                    setProgress(100);

                    // Set initial translation stage
                    setTranslationStage('Starting transcription');
                    setTranslationProgress(0);
                    // The real progress updates will now come through the socket connection
                    // from the subtitle_translation_progress_update events
                  }
                }
              });

              // Check for errors in the response
              if (!response || response.error) {
                throw new Error(
                  response?.error || 'Unknown error during upload'
                );
              }

              return response;
            } catch (error) {
              retries++;
              console.error(
                `Chunk ${chunkIndex} upload failed (attempt ${retries}/${maxRetries}):`,
                error
              );

              if (retries >= maxRetries) {
                throw error;
              }

              // Wait before retrying (exponential backoff)
              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * Math.pow(2, retries))
              );
              setProgressStage(
                `Retrying chunk ${chunkIndex + 1}/${totalChunks} (attempt ${
                  retries + 1
                }/${maxRetries})`
              );
            }
          }
        };

        // Upload chunks sequentially to ensure order
        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
          const start = chunkIndex * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, selectedFile.size);
          const chunk = selectedFile.slice(start, end);
          const isLastChunk = chunkIndex === totalChunks - 1;

          setProgressStage(
            `Uploading chunk ${chunkIndex + 1} of ${totalChunks}`
          );

          try {
            // Upload the chunk with retry mechanism
            const response = await uploadChunkWithRetry(
              chunk,
              chunkIndex,
              isLastChunk
            );

            // Mark this chunk as successfully uploaded
            uploadedChunkIndexes.add(chunkIndex);

            console.log(
              `Successfully uploaded chunk ${chunkIndex + 1}/${totalChunks}`
            );

            // If we have SRT data from the last chunk, process it
            if (isLastChunk && response.srt) {
              // Verify all chunks were uploaded
              if (uploadedChunkIndexes.size !== totalChunks) {
                const missing = [];
                for (let i = 0; i < totalChunks; i++) {
                  if (!uploadedChunkIndexes.has(i)) {
                    missing.push(i);
                  }
                }
                console.error(`Missing chunks: ${missing.join(', ')}`);
                throw new Error(
                  `Upload incomplete. Missing ${missing.length} chunks.`
                );
              }

              const parsedSegments = parseSrt(
                response.srt,
                targetLanguage,
                showOriginalText
              );
              setFinalSrt(buildSrt(parsedSegments));

              // Set the subtitles - the video should already be loaded and buffering
              setSrtContent(buildSrt(parsedSegments));
              setSubtitles(parsedSegments);

              // Translation is now complete
              setTranslationStage('Complete');
              setTranslationProgress(100);
              setIsTranslationInProgress(false);
            }
          } catch (error) {
            console.error('Error during chunked upload:', error);
            setError(
              error instanceof Error
                ? error.message
                : 'An error occurred during chunked upload'
            );
            setIsTranslationInProgress(false);
          }
        }
      } catch (error) {
        console.error('Error during chunked upload:', error);
        setError(
          error instanceof Error
            ? error.message
            : 'An error occurred during chunked upload'
        );
        setIsTranslationInProgress(false);
      } finally {
        setLoading(false);
      }
      return;
    }

    // For smaller files, use the original method
    setLoading(true);
    setProgressStage('Preparing file');

    try {
      const reader = new FileReader();
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      setProgressStage('Uploading file');

      const response = await generateVideoSubtitles({
        chunk: fileBase64,
        targetLanguage,
        filename: selectedFile.name,
        contentType: selectedFile.type,
        processAudio: true,
        onProgress: (progress: number) => {
          setProgress(progress);
          if (progress >= 99) {
            setProgressStage('Processing audio');
            setProgress(100);

            // Set initial translation stage
            setTranslationStage('Starting transcription');
            setTranslationProgress(0);
            // The real progress updates will now come through the socket connection
            // from the subtitle_translation_progress_update events
          }
        }
      });

      if (!response || !response.srt) {
        throw new Error('No SRT data received from server');
      }

      // Translation is now complete, final states will be set by socket updates
      // but we'll set this as a fallback
      setTranslationStage('Complete');
      setTranslationProgress(100);
      setIsTranslationInProgress(false);

      const parsedSegments = parseSrt(
        response.srt,
        targetLanguage,
        showOriginalText
      );
      setFinalSrt(buildSrt(parsedSegments));

      // Set the subtitles - the video should already be loaded and buffering
      setSrtContent(buildSrt(parsedSegments));
      setSubtitles(parsedSegments);
    } catch (error) {
      console.error('Error:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'An error occurred while generating subtitles'
      );
      setIsTranslationInProgress(false);
    } finally {
      setLoading(false);
    }
  }

  // --- Split SRT ---
  async function handleSplitSrt() {
    if (!splitFile) {
      setError('Please select an SRT file to split');
      return;
    }

    try {
      setLoading(true);
      const srtContent = await splitFile.text();
      const blob = await splitSubtitles({
        srt: srtContent,
        numSplits
      });

      // Instead of immediately downloading, show a popup
      setModalTitle(`Split Complete: ${splitFile.name}`);
      setModalContent(
        `The file has been successfully split into ${numSplits} parts.`
      );
      setModalActions([
        {
          label: 'Download ZIP',
          action: () => {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'subtitle_splits.zip';
            link.click();
            window.URL.revokeObjectURL(url);
            setShowResultModal(false);
          },
          primary: true
        },
        {
          label: 'Close',
          action: () => setShowResultModal(false)
        }
      ]);
      setShowResultModal(true);
    } catch (err) {
      console.error(err);
      setError('Error splitting subtitles');
    } finally {
      setLoading(false);
    }
  }

  // --- Download SRT ---
  function handleDownload() {
    if (!finalSrt || finalSrt.trim() === '') {
      console.error('Error: finalSrt is empty or undefined');
      setError('Error: No subtitle content to download');
      return;
    }

    const blob = new Blob([finalSrt], { type: 'text/plain;charset=utf-8' });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'subtitles.srt';
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // --- Subtitle Editing Functions ---
  function handlePlayerReady(player: any) {
    setCurrentPlayer(player);
    player.on('play', () => setIsPlaying(true));
    player.on('pause', () => setIsPlaying(false));
    player.on('ended', () => setIsPlaying(false));

    // Add time update listener
    player.on('timeupdate', () => {
      const timeDisplay = document.getElementById('current-timestamp');
      if (timeDisplay && player) {
        const currentTime = player.currentTime();
        // Display time in SRT format
        timeDisplay.textContent = secondsToSrtTime(currentTime);
      }
    });
  }

  function handleEditSubtitle(
    index: number,
    field: 'start' | 'end' | 'text',
    value: number | string
  ) {
    if (field === 'text') {
      const newSubtitles = subtitles.map((sub, i) =>
        i === index ? { ...sub, text: value as string } : sub
      );
      setSubtitles(newSubtitles);
      return;
    }

    // Store the intermediate editing value
    const editKey = `${index}-${field}`;
    setEditingTimes((prev) => ({ ...prev, [editKey]: value as string }));

    // Try to parse the value as SRT time format first
    let numValue: number;
    if (typeof value === 'string' && value.includes(':')) {
      // This looks like an SRT timestamp, try to parse it
      numValue = srtTimeToSeconds(value);
    } else {
      // Try to parse as a plain number
      numValue = parseFloat(value as string);
    }

    if (isNaN(numValue) || numValue < 0) {
      return;
    }

    // Get the current subtitle and adjacent ones
    const currentSub = subtitles[index];
    const prevSub = index > 0 ? subtitles[index - 1] : null;
    const nextSub = index < subtitles.length - 1 ? subtitles[index + 1] : null;

    // Validate based on field type
    if (field === 'start') {
      // Allow setting start time to match previous subtitle's start time
      if (prevSub && numValue < prevSub.start) return;
      // Start time can't be after current end time
      if (numValue >= currentSub.end) return;
    } else if (field === 'end') {
      // End time can't be before current start time
      if (numValue <= currentSub.start) return;
      // Allow extending end time to match next subtitle's end time
      if (nextSub && numValue > nextSub.end) return;
    }

    const newSubtitles = subtitles.map((sub, i) =>
      i === index ? { ...sub, [field]: numValue } : sub
    );
    setSubtitles(newSubtitles);
  }

  function handleTimeInputBlur(index: number, field: 'start' | 'end') {
    const editKey = `${index}-${field}`;
    setEditingTimes((prev) => {
      const newTimes = { ...prev };
      delete newTimes[editKey];
      return newTimes;
    });
  }

  function handleSeekToSubtitle(startTime: number) {
    if (currentPlayer) {
      currentPlayer.currentTime(startTime);
    }
  }

  function handlePlaySubtitle(startTime: number, endTime: number) {
    if (!currentPlayer) return;

    // Clear any existing timeout
    if (playTimeoutRef.current) {
      window.clearTimeout(playTimeoutRef.current);
      playTimeoutRef.current = null;
    }

    // If we're already playing, pause first
    if (isPlaying) {
      currentPlayer.pause();
      setIsPlaying(false);
      return;
    }

    // Seek to start time and play
    currentPlayer.currentTime(startTime);
    currentPlayer.play();
    setIsPlaying(true);

    // Set timeout to pause at end time
    const duration = (endTime - startTime) * 1000; // Convert to milliseconds
    playTimeoutRef.current = window.setTimeout(() => {
      currentPlayer.pause();
      setIsPlaying(false);
      playTimeoutRef.current = null;
    }, duration);
  }

  function handleUpdateSubtitles() {
    // Generate fresh SRT content from current subtitles
    const updatedSrt = buildSrt(subtitles);
    // Update the SRT content to update the video player
    setSrtContent(updatedSrt);

    // Force refresh the video player if it exists
    if (currentPlayer) {
      const currentTime = currentPlayer.currentTime();
      // Small delay to ensure the SRT content is updated
      setTimeout(() => {
        currentPlayer.currentTime(currentTime);
      }, 100);
    }
  }

  function handleSaveEditedSrt() {
    const updatedSrt = buildSrt(subtitles);
    const blob = new Blob([updatedSrt], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'edited_subtitles.srt';
    link.click();
    window.URL.revokeObjectURL(url);
  }

  function handleInsertSubtitle(index: number) {
    const currentSub = subtitles[index];
    const nextSub = subtitles[index + 1];

    // Calculate new timings
    let newStart, newEnd;
    if (nextSub) {
      // If there's a next subtitle, insert between current and next
      newStart = currentSub.end;
      newEnd = Math.min(nextSub.start, currentSub.end + 2); // 2 seconds default duration, but don't overlap
    } else {
      // If it's the last subtitle, add after it
      newStart = currentSub.end;
      newEnd = currentSub.end + 2; // 2 seconds default duration
    }

    // Create new subtitle block
    const newSubtitle: SrtSegment = {
      index: currentSub.index + 1,
      start: newStart,
      end: newEnd,
      text: ''
    };

    // Insert new subtitle and reindex all subsequent subtitles
    const updatedSubtitles = [
      ...subtitles.slice(0, index + 1),
      newSubtitle,
      ...subtitles.slice(index + 1).map((sub) => ({
        ...sub,
        index: sub.index + 1
      }))
    ];

    setSubtitles(updatedSubtitles);
  }

  function handleRemoveSubtitle(index: number) {
    if (
      !window.confirm('Are you sure you want to remove this subtitle block?')
    ) {
      return;
    }

    const updatedSubtitles = subtitles
      .filter((_, i) => i !== index)
      .map((sub, i) => ({
        ...sub,
        index: i + 1 // Reindex remaining subtitles
      }));

    setSubtitles(updatedSubtitles);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playTimeoutRef.current) {
        window.clearTimeout(playTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      style={{
        padding: 20,
        paddingTop: isTranslationInProgress ? 160 : 20
      }}
    >
      <div id="top-padding" style={{ height: '60px', marginBottom: '20px' }} />

      <h1>Tools</h1>

      <GenerateSubtitles
        MAX_MB={MAX_MB}
        selectedFile={selectedFile}
        targetLanguage={targetLanguage}
        showOriginalText={showOriginalText}
        loading={loading}
        onSetSelectedFile={setSelectedFile}
        onSetTargetLanguage={setTargetLanguage}
        onSetShowOriginalText={setShowOriginalText}
        onFileUpload={handleFileUpload}
      />

      <SplitMergeSubtitles
        splitFile={splitFile}
        numSplits={numSplits}
        mergeFiles={mergeFiles}
        loading={loading}
        onSetSplitFile={setSplitFile}
        onSetNumSplits={setNumSplits}
        onSetMergeFiles={setMergeFiles}
        onSplitSrt={handleSplitSrt}
        targetLanguage={targetLanguage}
        showOriginalText={showOriginalText}
        onSetLoading={setLoading}
        onSetError={setError}
        onSetFinalSrt={setFinalSrt}
        onSetSrtContent={setSrtContent}
        onSetSubtitles={setSubtitles}
        onSetModalTitle={setModalTitle}
        onSetModalContent={setModalContent}
        onSetModalActions={setModalActions}
        onSetShowResultModal={setShowResultModal}
        parseSrt={parseSrt}
        mergeSubtitles={mergeSubtitles}
      />

      <EditSubtitles
        videoFile={videoFile}
        videoUrl={videoUrl}
        srtContent={srtContent}
        subtitles={subtitles}
        isPlaying={isPlaying}
        editingTimes={editingTimes}
        targetLanguage={targetLanguage}
        showOriginalText={showOriginalText}
        isMergingInProgress={isMergingInProgress}
        onSetVideoFile={setVideoFile}
        onSetVideoUrl={setVideoUrl}
        onSetSrtContent={setSrtContent}
        onSetSubtitles={setSubtitles}
        onSetError={setError}
        onPlayerReady={handlePlayerReady}
        onEditSubtitle={handleEditSubtitle}
        onTimeInputBlur={handleTimeInputBlur}
        onSeekToSubtitle={handleSeekToSubtitle}
        onPlaySubtitle={handlePlaySubtitle}
        onUpdateSubtitles={handleUpdateSubtitles}
        onRemoveSubtitle={handleRemoveSubtitle}
        onInsertSubtitle={handleInsertSubtitle}
        onSaveEditedSrt={handleSaveEditedSrt}
        secondsToSrtTime={secondsToSrtTime}
        parseSrt={parseSrt}
        onSetIsMergingInProgress={setIsMergingInProgress}
        onSetMergeProgress={setMergeProgress}
        onSetMergeStage={setMergeStage}
      />

      {error && <p style={{ color: 'red', marginTop: 10 }}>{error}</p>}

      <TranslationProgressArea
        isTranslationInProgress={isTranslationInProgress}
        progress={progress}
        progressStage={progressStage}
        translationProgress={translationProgress}
        translationStage={translationStage}
        onSetIsTranslationInProgress={setIsTranslationInProgress}
        subtitleProgress={subtitleProgress}
      />

      <MergingProgressArea
        isMergingInProgress={isMergingInProgress}
        mergeProgress={mergeProgress}
        mergeStage={mergeStage}
        onSetIsMergingInProgress={setIsMergingInProgress}
        isTranslationInProgress={isTranslationInProgress}
      />

      <BackToTopButton
        showButton={subtitles.length > 0}
        onClick={() => {
          const topPadding = document.getElementById('top-padding');
          if (topPadding) {
            topPadding.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

      {showResultModal && (
        <ResultModal
          modalTitle={modalTitle}
          modalContent={modalContent}
          modalActions={modalActions}
          onClose={() => setShowResultModal(false)}
        />
      )}

      {/* Final Subtitles Display - Only show for split/merge operations, not for extraction */}
      {finalSrt && !videoFile && !showResultModal && (
        <FinalSubtitlesDisplay
          finalSrt={finalSrt}
          targetLanguage={targetLanguage}
          showOriginalText={showOriginalText}
          onDownload={handleDownload}
          onSetSrtContent={setSrtContent}
          onSetSubtitles={setSubtitles}
          parseSrt={parseSrt}
        />
      )}
      {finalSrt && videoFile && !subtitles.length && (
        <div style={{ marginTop: 15 }}>
          <p
            style={{
              padding: '10px',
              backgroundColor: '#e8f4f8',
              borderLeft: '4px solid #17a2b8',
              borderRadius: '4px'
            }}
          >
            <strong>Tip:</strong> Your video and subtitles are ready for editing
            in the &ldquo;Edit Subtitles&rdquo; section below.
          </p>
        </div>
      )}
      <div style={{ height: 100 }} />
    </div>
  );
}

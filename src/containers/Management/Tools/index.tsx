import React, { useState, useEffect, useRef } from 'react';
import { useAppContext, useManagementContext } from '~/contexts';
import VideoPlayerWithSubtitles from './VideoPlayerWithSubtitles';

interface SrtSegment {
  index: number;
  start: number;
  end: number;
  text: string;
}

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
  const mergeVideoWithSubtitles = useAppContext(
    (v) => v.requestHelpers.mergeVideoWithSubtitles
  );
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

  // --- Merge SRT ---
  async function handleMergeSrt() {
    if (mergeFiles.length < 2) {
      setError('Select at least 2 files to merge');
      return;
    }

    try {
      setLoading(true);

      const fileContents = await Promise.all(
        mergeFiles.map((file) => file.text())
      );

      const { srt } = await mergeSubtitles(fileContents);

      setFinalSrt(srt);

      // Show the merged result in a popup
      const parsedSegments = parseSrt(srt, targetLanguage, showOriginalText);
      setModalTitle('Merged Subtitles');
      setModalContent(srt);
      setModalActions([
        {
          label: 'Download SRT',
          action: () => {
            const blob = new Blob([srt], { type: 'text/plain;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'subtitles.srt';
            link.click();
            window.URL.revokeObjectURL(url);

            setShowResultModal(false);
          }
        },
        {
          label: 'Edit in Subtitle Editor',
          action: () => {
            // Load the merged result into the subtitle editor

            setSrtContent(srt);
            setSubtitles(parsedSegments);
            setShowResultModal(false);

            // Scroll to the editor section
            setTimeout(() => {
              const editorSection = document.getElementById(
                'subtitle-editor-section'
              );
              if (editorSection) {
                editorSection.scrollIntoView({ behavior: 'smooth' });
              }
            }, 300);
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
      setError('Error merging subtitles');
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

  // --- Merge Video with Subtitles ---
  function handleOpenMergeModal() {
    if (!videoFile || !srtContent) {
      setError('Both video and subtitles are required for merging');
      return;
    }
    // Instead of showing the modal, directly merge with default settings
    handleMergeVideoWithSubtitles();
  }

  async function handleMergeVideoWithSubtitles() {
    try {
      setIsMergingInProgress(true);
      setMergeProgress(0);
      setMergeStage('Preparing files');
      setError('');

      if (!videoFile) {
        setError('Video file is required for merging');
        setIsMergingInProgress(false);
        return;
      }

      // Convert video to base64
      const reader = new FileReader();
      const videoBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(videoFile);
      });

      setMergeStage('Uploading files');
      setMergeProgress(10);

      // Call the API to merge video with subtitles
      const response = await mergeVideoWithSubtitles({
        videoData: videoBase64,
        srtContent: srtContent,
        filename: videoFile.name
      });

      // Log the response for debugging purposes
      console.log('Merge complete, server returned:', response.videoUrl);

      // The download will be triggered automatically by the browser
      // No need to manually create a download link - the server handles this

      // Show a simple notification
      setMergeStage('Processing complete');
      setTimeout(() => {
        setIsMergingInProgress(false);
      }, 2000);
    } catch (error) {
      console.error('Error merging video with subtitles:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'An error occurred while merging video with subtitles'
      );
      setIsMergingInProgress(false);
    }
  }

  // --- JSX Return ---
  return (
    <div
      style={{
        padding: 20,
        // Add padding to the top when translation is in progress
        paddingTop: isTranslationInProgress ? 160 : 20
      }}
    >
      {/* Proper padding element to ensure we can scroll to the very top */}
      <div
        id="top-padding"
        style={{ height: '60px', marginBottom: '20px' }}
      ></div>

      <h1>Tools</h1>

      {/* Generate Subtitles Section */}
      <div style={{ marginBottom: 20 }}>
        <h2>Generate Subtitles</h2>
        <div style={{ marginBottom: 10 }}>
          <label>1. Select Video File (up to {MAX_MB}MB): </label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                setSelectedFile(e.target.files[0]);
              }
            }}
          />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>2. Output Language: </label>
          <select
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
          >
            <option value="original">Same as Audio</option>
            <option value="english">Translate to English</option>
            <option value="korean">Translate to Korean</option>
            <option value="spanish">Translate to Spanish</option>
            <option value="french">Translate to French</option>
            <option value="german">Translate to German</option>
            <option value="chinese">Translate to Chinese</option>
            <option value="japanese">Translate to Japanese</option>
            <option value="russian">Translate to Russian</option>
            <option value="portuguese">Translate to Portuguese</option>
            <option value="italian">Translate to Italian</option>
            <option value="arabic">Translate to Arabic</option>
          </select>

          {targetLanguage !== 'original' && targetLanguage !== 'english' && (
            <div style={{ marginTop: 5 }}>
              <label>
                <input
                  type="checkbox"
                  checked={showOriginalText}
                  onChange={(e) => setShowOriginalText(e.target.checked)}
                  style={{ marginRight: 5 }}
                />
                Show original text
              </label>
            </div>
          )}
        </div>
        <button onClick={handleFileUpload} disabled={!selectedFile || loading}>
          {loading ? 'Processing...' : 'Generate Subtitles'}
        </button>
      </div>

      {/* Split/Merge Operations Section */}
      <div style={{ marginTop: 20, marginBottom: 20 }}>
        <h2>Split/Merge Operations</h2>

        <div style={{ marginBottom: 20 }}>
          <h3>Split SRT</h3>
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', marginBottom: 5 }}>
              1. Select SRT file to split:{' '}
            </label>
            <input
              type="file"
              accept=".srt"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setSplitFile(e.target.files[0]);
                }
              }}
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ marginRight: 10 }}>2. Number of splits: </label>
            <input
              type="number"
              min="2"
              value={numSplits}
              onChange={(e) =>
                setNumSplits(Math.max(2, parseInt(e.target.value) || 2))
              }
            />
          </div>
          <button onClick={handleSplitSrt} disabled={loading || !splitFile}>
            Split into {numSplits} parts
          </button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <h3>Merge SRT Files</h3>
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', marginBottom: 5 }}>
              Select multiple SRT files to merge (hold Ctrl/Cmd to select
              multiple):
            </label>
            <input
              type="file"
              multiple
              accept=".srt"
              onChange={(e) => {
                if (e.target.files) {
                  setMergeFiles(Array.from(e.target.files));
                }
              }}
            />
          </div>
          {mergeFiles.length > 0 && (
            <div style={{ marginBottom: 10, fontSize: '0.9em', color: '#666' }}>
              Selected files ({mergeFiles.length}):
              <ul style={{ margin: '5px 0', paddingLeft: 20 }}>
                {mergeFiles.map((file, index) => (
                  <li key={index}>{file.name}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={handleMergeSrt}
            disabled={loading || mergeFiles.length < 2}
          >
            Merge {mergeFiles.length} Files
          </button>
        </div>
      </div>

      {/* Edit Subtitles Section */}
      <div style={{ marginTop: 20 }} id="subtitle-editor-section">
        <h2>Edit Subtitles</h2>
        {/* File input fields - Show when not in extraction mode or when video is loaded but no subtitles */}
        {(!videoFile || (videoFile && subtitles.length === 0)) && (
          <div style={{ marginBottom: 20 }}>
            {!videoFile && (
              <div style={{ marginBottom: 10 }}>
                <label>Load Video: </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setVideoFile(e.target.files[0]);
                    }
                  }}
                />
              </div>
            )}
            <div style={{ marginBottom: 10 }}>
              <label>Load SRT: </label>
              <input
                type="file"
                accept=".srt"
                onChange={async (e) => {
                  try {
                    if (e.target.files?.[0]) {
                      const file = e.target.files[0];
                      const text = await file.text();
                      setSrtContent(text);
                      const parsed = parseSrt(
                        text,
                        targetLanguage,
                        showOriginalText
                      );
                      setSubtitles(parsed);

                      // If no subtitles were parsed, show an error
                      if (parsed.length === 0) {
                        setError(
                          'No valid subtitles found in the file. Please check the file format.'
                        );
                      } else {
                        setError(''); // Clear any previous errors
                      }
                    }
                  } catch (err: any) {
                    console.error('Error loading SRT file:', err);
                    setError(
                      `Error loading subtitles: ${
                        err.message || 'Unknown error'
                      }`
                    );
                  }
                }}
              />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {videoUrl && (
            <div
              style={{
                position: 'sticky',
                top: '10px',
                zIndex: 100,
                backgroundColor: 'rgba(255, 255, 255, 0.85)', // Semi-transparent white
                backdropFilter: 'blur(5px)', // Add subtle blur effect
                padding: '10px',
                borderBottom: '1px solid rgba(238, 238, 238, 0.8)',
                marginBottom: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                maxHeight: '50vh',
                overflow: 'visible',
                transition: 'max-height 0.3s ease',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)' // Subtle shadow for depth
              }}
            >
              <VideoPlayerWithSubtitles
                videoUrl={videoUrl}
                srtContent={srtContent}
                onPlayerReady={handlePlayerReady}
              />

              {/* Current timestamp display */}
              <div
                style={{
                  marginTop: '5px',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  backgroundColor: 'rgba(248, 249, 250, 0.7)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(222, 226, 230, 0.7)',
                  display: 'inline-block'
                }}
              >
                Current time: <span id="current-timestamp">00:00:00,000</span>
              </div>

              {/* Add file change buttons */}
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  marginTop: '10px',
                  width: '50%',
                  justifyContent: 'center'
                }}
              >
                <button
                  onClick={() => {
                    // Create a hidden file input and trigger it
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'video/*';
                    input.onchange = (e) => {
                      const files = (e.target as HTMLInputElement).files;
                      if (files && files[0]) {
                        // First clear any previous errors
                        setError('');

                        // If we have an existing video URL, revoke it
                        if (videoUrl) {
                          URL.revokeObjectURL(videoUrl);
                          setVideoUrl(null);
                        }

                        // Then set the new video file after a short delay
                        setTimeout(() => {
                          setVideoFile(files[0]);
                        }, 200);
                      }
                    };
                    input.click();
                  }}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'rgba(108, 117, 125, 0.85)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9em',
                    backdropFilter: 'blur(2px)',
                    transition: 'background-color 0.2s'
                  }}
                >
                  Change Video
                </button>
                <button
                  onClick={() => {
                    // Create a hidden file input and trigger it
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.srt';
                    input.onchange = async (e) => {
                      const files = (e.target as HTMLInputElement).files;
                      if (files && files[0]) {
                        const file = files[0];
                        const text = await file.text();
                        setSrtContent(text);
                        const parsed = parseSrt(
                          text,
                          targetLanguage,
                          showOriginalText
                        );
                        setSubtitles(parsed);
                      }
                    };
                    input.click();
                  }}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'rgba(23, 162, 184, 0.85)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9em',
                    backdropFilter: 'blur(2px)',
                    transition: 'background-color 0.2s'
                  }}
                >
                  Change Subtitles
                </button>
              </div>
            </div>
          )}

          {subtitles.length > 0 && (
            <div style={{ marginTop: '20px', paddingBottom: '80px' }}>
              <h3>Subtitles</h3>
              <div style={{ marginBottom: 10 }}>
                {subtitles.map((sub, index) => (
                  <React.Fragment key={index}>
                    <div
                      style={{
                        marginBottom: 10,
                        padding: 10,
                        border: '1px solid rgba(221, 221, 221, 0.8)',
                        borderRadius: 4,
                        backgroundColor: 'rgba(249, 249, 249, 0.85)',
                        backdropFilter: 'blur(3px)',
                        transition:
                          'transform 0.15s ease, box-shadow 0.15s ease',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow =
                          '0 3px 8px rgba(0, 0, 0, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow =
                          '0 1px 3px rgba(0, 0, 0, 0.05)';
                      }}
                    >
                      <div
                        style={{
                          marginBottom: 5,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span style={{ fontWeight: 'bold' }}>#{sub.index}</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleRemoveSubtitle(index)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontSize: '0.9em'
                            }}
                            title="Remove this subtitle block"
                          >
                            Remove
                          </button>
                          <button
                            onClick={() => handleInsertSubtitle(index)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#17a2b8',
                              color: 'white',
                              border: 'none',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontSize: '0.9em'
                            }}
                            title="Insert new subtitle block after this one"
                          >
                            Insert Below
                          </button>
                        </div>
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <textarea
                          value={sub.text}
                          onChange={(e) =>
                            handleEditSubtitle(index, 'text', e.target.value)
                          }
                          style={{
                            width: '100%',
                            minHeight: '60px',
                            padding: '8px',
                            borderRadius: 4,
                            border: '1px solid rgba(221, 221, 221, 0.8)',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            resize: 'vertical',
                            fontFamily: 'monospace',
                            fontSize: 'inherit',
                            lineHeight: '1.4',
                            whiteSpace: 'pre-wrap'
                          }}
                          placeholder="Enter subtitle text (press Enter for line breaks)"
                        />
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: 10,
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <label style={{ marginRight: 5 }}>Start:</label>
                          <input
                            type="text"
                            value={
                              editingTimes[`${index}-start`] ??
                              secondsToSrtTime(sub.start)
                            }
                            onChange={(e) =>
                              handleEditSubtitle(index, 'start', e.target.value)
                            }
                            onBlur={() => handleTimeInputBlur(index, 'start')}
                            style={{ width: 150 }}
                          />
                        </div>
                        <div>
                          <label style={{ marginRight: 5 }}>End:</label>
                          <input
                            type="text"
                            value={
                              editingTimes[`${index}-end`] ??
                              secondsToSrtTime(sub.end)
                            }
                            onChange={(e) =>
                              handleEditSubtitle(index, 'end', e.target.value)
                            }
                            onBlur={() => handleTimeInputBlur(index, 'end')}
                            style={{ width: 150 }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button
                            onClick={() => handleSeekToSubtitle(sub.start)}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#6c757d',
                              color: 'white',
                              border: 'none',
                              borderRadius: 4,
                              cursor: 'pointer'
                            }}
                            title="Move playhead to this subtitle's start time"
                          >
                            Move to
                          </button>
                          <button
                            onClick={() =>
                              handlePlaySubtitle(sub.start, sub.end)
                            }
                            style={{
                              padding: '4px 8px',
                              backgroundColor: isPlaying
                                ? '#dc3545'
                                : '#007bff',
                              color: 'white',
                              border: 'none',
                              borderRadius: 4,
                              cursor: 'pointer',
                              minWidth: '60px'
                            }}
                            title={
                              isPlaying
                                ? 'Pause playback'
                                : 'Play this subtitle segment'
                            }
                          >
                            {isPlaying ? 'Pause' : 'Play'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Fixed Action Bar */}
        {subtitles.length > 0 && (
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '15px 20px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(8px)',
              borderTop: '1px solid rgba(238, 238, 238, 0.8)',
              display: 'flex',
              gap: 10,
              justifyContent: 'center',
              zIndex: 100,
              boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.08)'
            }}
          >
            <button
              onClick={handleUpdateSubtitles}
              style={{
                padding: '8px 16px',
                backgroundColor: 'rgba(40, 167, 69, 0.9)',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              Update Video Subtitles
            </button>
            <button
              onClick={handleSaveEditedSrt}
              style={{
                padding: '8px 16px',
                backgroundColor: 'rgba(0, 123, 255, 0.9)',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              Save Edited SRT
            </button>
            <button
              onClick={handleOpenMergeModal}
              style={{
                padding: '8px 16px',
                backgroundColor: 'rgba(108, 117, 125, 0.9)',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              disabled={!videoFile || !srtContent || isMergingInProgress}
            >
              Merge Video with Subtitles
            </button>
          </div>
        )}
      </div>

      {/* Error and Progress Displays */}
      {error && <p style={{ color: 'red', marginTop: 10 }}>{error}</p>}

      {/* Fixed Progress Area - Always visible when translation is in progress */}
      {isTranslationInProgress && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1100,
            padding: '15px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(5px)',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '5px'
            }}
          >
            <h3 style={{ margin: 0 }}>Translation in Progress</h3>
            <button
              onClick={() => setIsTranslationInProgress(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ×
            </button>
          </div>

          {/* Audio Processing Progress */}
          {(progress > 0 || progressStage) && (
            <div
              style={{
                padding: '10px 15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                border: '1px solid #dee2e6'
              }}
            >
              <div style={{ marginBottom: 5 }}>
                <strong>Audio Processing:</strong>{' '}
                {progressStage || 'Starting...'}
              </div>
              <div
                style={{
                  height: '20px',
                  backgroundColor: '#e9ecef',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progress}%`,
                    backgroundColor: progress === 100 ? '#28a745' : '#007bff',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
              <div
                style={{ fontSize: '0.9em', marginTop: 5, textAlign: 'right' }}
              >
                {progress.toFixed(1)}%
              </div>
            </div>
          )}

          {/* Translation Progress */}
          {(translationProgress > 0 || translationStage) && (
            <div
              style={{
                padding: '10px 15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                border: '1px solid #dee2e6'
              }}
            >
              <div style={{ marginBottom: 5 }}>
                <strong>Progress:</strong>{' '}
                {translationStage || 'Initializing...'}
                {subtitleProgress?.current && subtitleProgress?.total ? (
                  <span>
                    {' '}
                    ({subtitleProgress.current}/{subtitleProgress.total})
                  </span>
                ) : null}
                {subtitleProgress?.warning ? (
                  <div
                    style={{
                      color: '#856404',
                      backgroundColor: '#fff3cd',
                      padding: '5px',
                      marginTop: '5px',
                      borderRadius: '3px'
                    }}
                  >
                    Warning: {subtitleProgress.warning}
                  </div>
                ) : null}
              </div>
              <div
                style={{
                  height: '20px',
                  backgroundColor: '#e9ecef',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${translationProgress}%`,
                    backgroundColor:
                      translationProgress === 100 ? '#28a745' : '#17a2b8',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
              <div
                style={{ fontSize: '0.9em', marginTop: 5, textAlign: 'right' }}
              >
                {translationProgress.toFixed(1)}%
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fixed Progress Area for Video Merging */}
      {isMergingInProgress && (
        <div
          style={{
            position: 'fixed',
            top: isTranslationInProgress ? 160 : 0,
            left: 0,
            right: 0,
            zIndex: 1090, // Below translation progress if both are visible
            padding: '15px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(5px)',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '5px'
            }}
          >
            <h3 style={{ margin: 0 }}>Merging Video with Subtitles</h3>
            <button
              onClick={() => setIsMergingInProgress(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ×
            </button>
          </div>

          {/* Merge Progress */}
          <div
            style={{
              padding: '10px 15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              border: '1px solid #dee2e6'
            }}
          >
            <div style={{ marginBottom: 5 }}>
              <strong>Progress:</strong> {mergeStage || 'Initializing...'}
            </div>
            <div
              style={{
                height: '20px',
                backgroundColor: '#e9ecef',
                borderRadius: '4px',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${mergeProgress}%`,
                  backgroundColor:
                    mergeProgress === 100 ? '#28a745' : '#6c757d',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
            <div
              style={{ fontSize: '0.9em', marginTop: 5, textAlign: 'right' }}
            >
              {mergeProgress.toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {/* Back to Top Button */}
      {subtitles.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            zIndex: 1000
          }}
        >
          <button
            onClick={() => {
              const topPadding = document.getElementById('top-padding');
              if (topPadding) {
                topPadding.scrollIntoView({ behavior: 'smooth' });
              } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            style={{
              padding: '10px 15px',
              backgroundColor: 'rgba(108, 117, 125, 0.85)',
              backdropFilter: 'blur(3px)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              transition: 'background-color 0.2s, transform 0.2s',
              transform: 'translateZ(0)' // Hardware acceleration
            }}
            title="Back to Top"
          >
            ↑
          </button>
        </div>
      )}

      {/* Result Modal */}
      {showResultModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1050,
            backdropFilter: 'blur(3px)'
          }}
          onClick={(e) => {
            // Close modal when clicking outside
            if (e.target === e.currentTarget) {
              setShowResultModal(false);
            }
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 8,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              width: '80%',
              maxWidth: 800,
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                padding: '15px 20px',
                borderBottom: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <h3 style={{ margin: 0 }}>{modalTitle}</h3>
              <button
                onClick={() => setShowResultModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>
            <div
              style={{
                padding: '20px',
                overflowY: 'auto',
                maxHeight: 'calc(80vh - 130px)'
              }}
            >
              {modalTitle.includes('Split Complete') ? (
                <div>{modalContent}</div>
              ) : (
                <pre
                  style={{
                    maxHeight: '50vh',
                    overflowY: 'auto',
                    background: '#f7f7f7',
                    border: '1px solid #ccc',
                    padding: 10,
                    borderRadius: 4,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  {modalContent}
                </pre>
              )}
            </div>
            <div
              style={{
                padding: '15px 20px',
                borderTop: '1px solid #eee',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10
              }}
            >
              {modalActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: action.primary ? '#007bff' : '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Final Subtitles Display - Only show for split/merge operations, not for extraction */}
      {finalSrt && !videoFile && !showResultModal && (
        <div style={{ marginTop: 20 }}>
          <h3>Final Subtitles</h3>
          <pre
            style={{
              maxHeight: 300,
              overflowY: 'auto',
              background: '#f7f7f7',
              border: '1px solid #ccc',
              padding: 10
            }}
          >
            {finalSrt}
          </pre>
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button onClick={handleDownload}>Download .srt</button>
            <button
              onClick={() => {
                // Load the final SRT into the subtitle editor

                const parsedSegments = parseSrt(
                  finalSrt,
                  targetLanguage,
                  showOriginalText
                );

                setSrtContent(finalSrt);
                setSubtitles(parsedSegments);

                const editorSection = document.getElementById(
                  'subtitle-editor-section'
                );
                if (editorSection) {
                  editorSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                padding: '8px 16px',
                cursor: 'pointer'
              }}
            >
              Edit Subtitles
            </button>
          </div>
        </div>
      )}

      {/* Tip for extracted subtitles - Only show briefly before scrolling to editor */}
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

// --- Helper Functions ---
function buildSrt(segments: SrtSegment[]): string {
  if (!segments || !Array.isArray(segments) || segments.length === 0) {
    return '';
  }

  // Sort segments by start time and ensure valid data
  const validSegments = segments
    .filter(
      (seg) =>
        typeof seg.start === 'number' &&
        typeof seg.end === 'number' &&
        !isNaN(seg.start) &&
        !isNaN(seg.end) &&
        seg.start >= 0 &&
        seg.end > seg.start
    )
    .sort((a, b) => a.start - b.start);

  if (validSegments.length === 0) {
    return '';
  }

  return validSegments
    .map((seg, i) => {
      const index = i + 1;
      const startStr = secondsToSrtTime(seg.start);
      const endStr = secondsToSrtTime(seg.end);
      return `${index}\n${startStr} --> ${endStr}\n${(
        seg.text || ''
      ).trim()}\n`;
    })
    .join('\n');
}

function secondsToSrtTime(totalSec: number): string {
  if (isNaN(totalSec) || totalSec < 0) {
    totalSec = 0;
  }

  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = Math.floor(totalSec % 60);
  const milliseconds = Math.round((totalSec - Math.floor(totalSec)) * 1000);
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  const mmm = String(milliseconds).padStart(3, '0');
  return `${hh}:${mm}:${ss},${mmm}`;
}

function parseSrt(
  srtString: string,
  targetLanguage: string = 'original',
  showOriginalText: boolean = true
): SrtSegment[] {
  if (!srtString || typeof srtString !== 'string') {
    return [];
  }

  const segments: SrtSegment[] = [];
  // Normalize line endings and handle different formats
  const normalizedSrt = srtString.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalizedSrt.trim().split(/\n\s*\n/);

  blocks.forEach((block, blockIndex) => {
    if (!block.trim()) return;

    const lines = block.split('\n');
    if (lines.length < 2) return;

    // Find the timing line (contains -->)
    const timingLineIndex = lines.findIndex((line) => line.includes('-->'));
    if (timingLineIndex === -1) return;

    // Parse index (use block index + 1 if not a valid number)
    const indexLine = lines[0].trim();
    const index = /^\d+$/.test(indexLine)
      ? parseInt(indexLine, 10)
      : blockIndex + 1;

    // Parse timing
    const timingLine = lines[timingLineIndex].trim();
    const timeParts = timingLine.split('-->');
    if (timeParts.length !== 2) return;

    const startStr = timeParts[0]?.trim();
    const endStr = timeParts[1]?.trim();
    if (!startStr || !endStr) return;

    const startSec = srtTimeToSeconds(startStr);
    const endSec = srtTimeToSeconds(endStr);
    if (isNaN(startSec) || isNaN(endSec) || startSec >= endSec) return;

    // Get text (all lines after timing line)
    let text = lines
      .slice(timingLineIndex + 1)
      .join('\n')
      .trim();

    // Process text based on translation marker
    if (text.includes('###TRANSLATION_MARKER###')) {
      const [_originalText, translatedText] = text.split(
        '###TRANSLATION_MARKER###'
      );

      // For English translation, only show translated text
      if (targetLanguage === 'english') {
        text = translatedText.trim();
      }
      // For other languages with showOriginalText unchecked, only show translated text
      else if (targetLanguage !== 'original' && !showOriginalText) {
        text = translatedText.trim();
      }
      // Otherwise (non-English with showOriginalText checked), keep both with a line break
      else {
        text = text.replace(/###TRANSLATION_MARKER###/g, '\n');
      }
    }

    segments.push({ index, start: startSec, end: endSec, text });
  });

  return segments;
}

function srtTimeToSeconds(timeStr: string): number {
  try {
    const parts = timeStr.split(',');
    if (parts.length !== 2) return NaN;

    const [hms, msStr] = parts;
    const [hh, mm, ss] = hms.split(':');

    if (!hh || !mm || !ss || !msStr) return NaN;

    const hours = parseInt(hh, 10);
    const minutes = parseInt(mm, 10);
    const seconds = parseInt(ss, 10);
    const milliseconds = parseInt(msStr, 10);

    if (
      isNaN(hours) ||
      isNaN(minutes) ||
      isNaN(seconds) ||
      isNaN(milliseconds)
    ) {
      return NaN;
    }

    return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
  } catch (e) {
    console.error('Error parsing SRT time:', e);
    return NaN;
  }
}

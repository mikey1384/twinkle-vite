import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import VideoPlayerWithSubtitles from './VideoPlayerWithSubtitles';
import { useAppContext } from '~/contexts/hooks';
import { buildSrt, srtTimeToSeconds } from '../utils';
import { css } from '@emotion/css';
import Button from '../Button';
import StylizedFileInput from '../StylizedFileInput';
import ButtonGroup from '../ButtonGroup';
import SubtitleEditor from './SubtitleEditor';
import { mergeStates } from '~/constants/state';

// Add container styles - removing borders and making it minimal
const containerStyles = css`
  margin-top: 20px;
`;

// Add a distinct style for the merge button to make it stand out
const buttonGradientStyles = {
  base: css`
    position: relative;
    font-weight: 500;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: all 0.2s ease;
    color: white !important;

    &:hover:not(:disabled) {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      color: white !important;
    }

    &:active:not(:disabled) {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      color: white !important;
    }

    &:disabled {
      opacity: 0.65;
      cursor: not-allowed;
      color: rgba(255, 255, 255, 0.9) !important;
    }
  `,
  primary: css`
    background: linear-gradient(
      135deg,
      rgba(0, 123, 255, 0.9),
      rgba(0, 80, 188, 0.9)
    ) !important;

    &:hover:not(:disabled) {
      background: linear-gradient(
        135deg,
        rgba(0, 143, 255, 0.95),
        rgba(0, 103, 204, 0.95)
      ) !important;
    }

    &:disabled {
      background: linear-gradient(
        135deg,
        rgba(0, 123, 255, 0.6),
        rgba(0, 80, 188, 0.6)
      ) !important;
    }
  `,
  success: css`
    background: linear-gradient(
      135deg,
      rgba(40, 167, 69, 0.9),
      rgba(30, 126, 52, 0.9)
    ) !important;

    &:hover:not(:disabled) {
      background: linear-gradient(
        135deg,
        rgba(50, 187, 79, 0.95),
        rgba(40, 146, 62, 0.95)
      ) !important;
    }

    &:disabled {
      background: linear-gradient(
        135deg,
        rgba(40, 167, 69, 0.6),
        rgba(30, 126, 52, 0.6)
      ) !important;
    }
  `,
  secondary: css`
    background: linear-gradient(
      135deg,
      rgba(108, 117, 125, 0.9),
      rgba(84, 91, 98, 0.9)
    ) !important;

    &:hover:not(:disabled) {
      background: linear-gradient(
        135deg,
        rgba(128, 137, 145, 0.95),
        rgba(104, 111, 118, 0.95)
      ) !important;
    }

    &:disabled {
      background: linear-gradient(
        135deg,
        rgba(108, 117, 125, 0.6),
        rgba(84, 91, 98, 0.6)
      ) !important;
    }
  `,
  danger: css`
    background: linear-gradient(
      135deg,
      rgba(220, 53, 69, 0.9),
      rgba(189, 33, 48, 0.9)
    ) !important;

    &:hover:not(:disabled) {
      background: linear-gradient(
        135deg,
        rgba(240, 73, 89, 0.95),
        rgba(209, 53, 68, 0.95)
      ) !important;
    }

    &:disabled {
      background: linear-gradient(
        135deg,
        rgba(220, 53, 69, 0.6),
        rgba(189, 33, 48, 0.6)
      ) !important;
    }
  `,
  purple: css`
    background: linear-gradient(
      135deg,
      rgba(130, 71, 229, 0.9),
      rgba(91, 31, 193, 0.9)
    ) !important;

    &:hover:not(:disabled) {
      background: linear-gradient(
        135deg,
        rgba(150, 91, 249, 0.95),
        rgba(111, 51, 213, 0.95)
      ) !important;
    }

    &:disabled {
      background: linear-gradient(
        135deg,
        rgba(130, 71, 229, 0.6),
        rgba(91, 31, 193, 0.6)
      ) !important;
    }
  `
};

// Replace the previous mergeButtonStyles with the new purple gradient style
const mergeButtonStyles = css`
  ${buttonGradientStyles.base}
  ${buttonGradientStyles.purple}
`;

interface SrtSegment {
  index: number;
  start: number;
  end: number;
  text: string;
}

interface EditSubtitlesProps {
  videoFile: File | null;
  videoUrl: string | null;
  srtContent: string;
  subtitles: SrtSegment[];
  isPlaying: boolean;
  editingTimes: Record<string, string>;
  targetLanguage: string;
  showOriginalText: boolean;
  isMergingInProgress: boolean;
  onSetCurrentPlayer: (player: any) => void;
  onSetEditingTimes: any;
  onSetVideoFile: (file: File) => void;
  onSetVideoUrl: (url: string | null) => void;
  onSetSrtContent: (content: string) => void;
  onSetSubtitles: (subtitles: SrtSegment[]) => void;
  onSetError: (error: string) => void;
  secondsToSrtTime: (seconds: number) => string;
  parseSrt: (
    srtString: string,
    targetLanguage: string,
    showOriginalText: boolean
  ) => SrtSegment[];
  onSetIsMergingInProgress: (inProgress: boolean) => void;
  onSetMergeProgress: (progress: number) => void;
  onSetMergeStage: (stage: string) => void;
  onSetIsPlaying: (isPlaying: boolean) => void;
  currentPlayer: any;
}

export default function EditSubtitles({
  videoFile,
  videoUrl,
  srtContent,
  subtitles,
  isPlaying,
  editingTimes,
  targetLanguage,
  showOriginalText,
  isMergingInProgress,
  onSetCurrentPlayer,
  onSetEditingTimes,
  onSetVideoFile,
  onSetVideoUrl,
  onSetSrtContent,
  onSetSubtitles,
  onSetError,
  secondsToSrtTime,
  parseSrt,
  onSetIsMergingInProgress,
  onSetMergeProgress,
  onSetMergeStage,
  onSetIsPlaying,
  currentPlayer
}: EditSubtitlesProps) {
  const playTimeoutRef = useRef<number | null>(null);
  const mergeVideoWithSubtitles = useAppContext(
    (v) => v.requestHelpers.mergeVideoWithSubtitles
  );

  // Create a session ID for this component instance
  const sessionIdRef = useRef<string>(`merge-${Date.now()}`);

  // Manage global merge state during mount/unmount
  useEffect(() => {
    // On mount, check if there are stale merge states showing in the UI
    if (isMergingInProgress) {
      // Reset UI state if it doesn't correspond to an active merge
      if (
        !mergeStates[sessionIdRef.current] ||
        !mergeStates[sessionIdRef.current].inProgress
      ) {
        onSetIsMergingInProgress(false);
        onSetMergeProgress(0);
        onSetMergeStage('');
      }
    }

    // Setup merge state if it doesn't exist
    if (!mergeStates[sessionIdRef.current]) {
      mergeStates[sessionIdRef.current] = {
        inProgress: false,
        progress: 0,
        stage: '',
        completedTimestamp: 0
      };
    }

    // Cleanup on unmount
    return () => {
      // Clear any timeouts
      if (playTimeoutRef.current) {
        window.clearTimeout(playTimeoutRef.current);
      }

      // Check if merge was completed and update global state
      if (mergeStates[sessionIdRef.current]) {
        // If progress is 100% or stage indicates completion, mark as not in progress
        if (
          mergeStates[sessionIdRef.current].progress >= 100 ||
          mergeStates[sessionIdRef.current].stage === 'Merging complete'
        ) {
          mergeStates[sessionIdRef.current].inProgress = false;
        }
      }
    };
  }, [
    isMergingInProgress,
    onSetIsMergingInProgress,
    onSetMergeProgress,
    onSetMergeStage
  ]);

  // Memoize handler functions to prevent recreating them on each render
  const handleEditSubtitle = useCallback(
    (
      index: number,
      field: 'start' | 'end' | 'text',
      value: number | string
    ) => {
      if (field === 'text') {
        const newSubtitles = subtitles.map((sub, i) =>
          i === index ? { ...sub, text: value as string } : sub
        );
        onSetSubtitles(newSubtitles);
        return;
      }

      // Store the intermediate editing value
      const editKey = `${index}-${field}`;
      onSetEditingTimes((prev: any) => ({
        ...prev,
        [editKey]: value as string
      }));

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
      const nextSub =
        index < subtitles.length - 1 ? subtitles[index + 1] : null;

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
      onSetSubtitles(newSubtitles);
    },
    [subtitles, onSetSubtitles, onSetEditingTimes]
  );

  const handleTimeInputBlur = useCallback(
    (index: number, field: 'start' | 'end') => {
      const editKey = `${index}-${field}`;
      onSetEditingTimes((prev: any) => {
        const newTimes = { ...prev };
        delete newTimes[editKey];
        return newTimes;
      });
    },
    [onSetEditingTimes]
  );

  const handleRemoveSubtitle = useCallback(
    (index: number) => {
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

      onSetSubtitles(updatedSubtitles);
    },
    [subtitles, onSetSubtitles]
  );

  const handleInsertSubtitle = useCallback(
    (index: number) => {
      const currentSub = subtitles[index];
      const nextSub = subtitles[index + 1];

      let newStart, newEnd;
      if (nextSub) {
        newStart = currentSub.end;
        newEnd = Math.min(nextSub.start, currentSub.end + 2);
      } else {
        newStart = currentSub.end;
        newEnd = currentSub.end + 2;
      }

      const newSubtitle: SrtSegment = {
        index: currentSub.index + 1,
        start: newStart,
        end: newEnd,
        text: ''
      };

      const updatedSubtitles = [
        ...subtitles.slice(0, index + 1),
        newSubtitle,
        ...subtitles.slice(index + 1).map((sub) => ({
          ...sub,
          index: sub.index + 1
        }))
      ];

      onSetSubtitles(updatedSubtitles);
    },
    [subtitles, onSetSubtitles]
  );

  const handleSeekToSubtitle = useCallback(
    (startTime: number) => {
      if (currentPlayer) {
        currentPlayer.currentTime(startTime);
      }
    },
    [currentPlayer]
  );

  const handlePlaySubtitle = useCallback(
    (startTime: number, endTime: number) => {
      if (!currentPlayer) return;

      // Clear any existing timeout
      if (playTimeoutRef.current) {
        window.clearTimeout(playTimeoutRef.current);
        playTimeoutRef.current = null;
      }

      // If we're already playing, pause first
      if (isPlaying) {
        currentPlayer.pause();
        onSetIsPlaying(false);
        return;
      }

      // Seek to start time and play
      currentPlayer.currentTime(startTime);
      currentPlayer.play();
      onSetIsPlaying(true);

      // Set timeout to pause at end time
      const duration = (endTime - startTime) * 1000; // Convert to milliseconds
      playTimeoutRef.current = window.setTimeout(() => {
        currentPlayer.pause();
        onSetIsPlaying(false);
        playTimeoutRef.current = null;
      }, duration);
    },
    [currentPlayer, isPlaying, onSetIsPlaying, playTimeoutRef]
  );

  useEffect(() => {
    return () => {
      if (playTimeoutRef.current) {
        window.clearTimeout(playTimeoutRef.current);
      }
    };
  }, []);

  // Only update the subtitle list component when necessary
  const subtitlesList = useMemo(() => {
    return subtitles.map((sub, index) => (
      <React.Fragment key={`subtitle-${sub.index}`}>
        <SubtitleEditor
          sub={sub}
          index={index}
          editingTimes={editingTimes}
          isPlaying={isPlaying}
          secondsToSrtTime={secondsToSrtTime}
          onEditSubtitle={handleEditSubtitle}
          onTimeInputBlur={handleTimeInputBlur}
          onRemoveSubtitle={handleRemoveSubtitle}
          onInsertSubtitle={handleInsertSubtitle}
          onSeekToSubtitle={handleSeekToSubtitle}
          onPlaySubtitle={handlePlaySubtitle}
        />
      </React.Fragment>
    ));
  }, [
    subtitles,
    editingTimes,
    isPlaying,
    secondsToSrtTime,
    handleEditSubtitle,
    handleTimeInputBlur,
    handleRemoveSubtitle,
    handleInsertSubtitle,
    handleSeekToSubtitle,
    handlePlaySubtitle
  ]);

  // Add an effect to automatically update subtitles whenever they change
  useEffect(() => {
    if (subtitles.length > 0) {
      const updatedSrt = buildSrt(subtitles);
      onSetSrtContent(updatedSrt);

      if (currentPlayer) {
        const currentTime = currentPlayer.currentTime();
        currentPlayer.currentTime(currentTime);
      }
    }
  }, [subtitles, onSetSrtContent, currentPlayer]);

  return (
    <div className={containerStyles} id="subtitle-editor-section">
      {/* File input fields - Show when not in extraction mode or when video is loaded but no subtitles */}
      {(!videoFile || (videoFile && subtitles.length === 0)) && (
        <div style={{ marginBottom: 20 }}>
          {!videoFile && (
            <div style={{ marginBottom: 10 }}>
              <StylizedFileInput
                accept="video/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    onSetVideoFile(e.target.files[0]);
                  }
                }}
                label="Load Video:"
                buttonText="Choose Video"
                selectedFile={null}
              />
            </div>
          )}
          <div style={{ marginBottom: 10 }}>
            <StylizedFileInput
              accept=".srt"
              onChange={async (e) => {
                try {
                  if (e.target.files?.[0]) {
                    const file = e.target.files[0];
                    const text = await file.text();
                    onSetSrtContent(text);
                    const parsed = parseSrt(
                      text,
                      targetLanguage,
                      showOriginalText
                    );
                    onSetSubtitles(parsed);

                    // If no subtitles were parsed, show an error
                    if (parsed.length === 0) {
                      onSetError(
                        'No valid subtitles found in the file. Please check the file format.'
                      );
                    } else {
                      onSetError(''); // Clear any previous errors
                    }
                  }
                } catch (err: any) {
                  console.error('Error loading SRT file:', err);
                  onSetError(
                    `Error loading subtitles: ${err.message || 'Unknown error'}`
                  );
                }
              }}
              label="Load SRT:"
              buttonText="Choose SRT File"
              selectedFile={null}
            />
          </div>
        </div>
      )}

      {/* Video Player Section */}
      {videoUrl && (
        <div
          className={css`
            position: sticky;
            top: 10px;
            z-index: 100;
            background-color: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(5px);
            padding: 15px;
            border-radius: 8px;
            border-bottom: 1px solid rgba(238, 238, 238, 0.8);
            margin-bottom: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            max-height: 50vh;
            overflow: visible;
            transition: max-height 0.3s ease;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          `}
        >
          <VideoPlayerWithSubtitles
            videoUrl={videoUrl}
            srtContent={srtContent}
            onPlayerReady={handlePlayerReady}
          />

          <div
            className={css`
              margin-top: 10px;
              font-size: 14px;
              font-family: monospace;
              background-color: rgba(248, 249, 250, 0.9);
              padding: 6px 10px;
              border-radius: 4px;
              border: 1px solid rgba(222, 226, 230, 0.7);
              display: inline-block;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            `}
          >
            Current time: <span id="current-timestamp">00:00:00,000</span>
          </div>

          <ButtonGroup
            align="center"
            className={css`
              margin-top: 15px;
            `}
          >
            <StylizedFileInput
              accept="video/*"
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  // First clear any previous errors
                  onSetError('');

                  // If we have an existing video URL, revoke it
                  if (videoUrl) {
                    URL.revokeObjectURL(videoUrl);
                    onSetVideoUrl(null);
                  }

                  // Then set the new video file after a short delay
                  setTimeout(() => {
                    onSetVideoFile(files[0]);
                  }, 200);
                }
              }}
              buttonText="Change Video"
              selectedFile={null}
            />
            <StylizedFileInput
              accept=".srt"
              onChange={async (e) => {
                try {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    const file = files[0];
                    const text = await file.text();
                    onSetSrtContent(text);
                    const parsed = parseSrt(
                      text,
                      targetLanguage,
                      showOriginalText
                    );
                    onSetSubtitles(parsed);
                  }
                } catch (err: any) {
                  console.error('Error loading SRT file:', err);
                  onSetError(
                    `Error loading subtitles: ${err.message || 'Unknown error'}`
                  );
                }
              }}
              buttonText="Change SRT"
              selectedFile={null}
            />
            <Button
              onClick={() => {
                if (currentPlayer) {
                  if (isPlaying) {
                    currentPlayer.pause();
                    onSetIsPlaying(false);
                  } else {
                    currentPlayer.play();
                    onSetIsPlaying(true);
                  }
                }
              }}
              variant="primary"
              size="md"
              className={`${buttonGradientStyles.base} ${
                buttonGradientStyles.primary
              } ${css`
                display: inline-flex;
                align-items: center;
                justify-content: center;
                height: 40px;
                min-width: 80px;
                transition: all 0.2s ease;

                svg {
                  margin-right: 6px;
                }
              `}`}
            >
              {isPlaying ? (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                  </svg>
                  Pause
                </>
              ) : (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  Play
                </>
              )}
            </Button>
          </ButtonGroup>
        </div>
      )}

      {/* Subtitles editing section - directly integrated into the main container */}
      {subtitles.length > 0 && (
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 15
            }}
          >
            <h3 style={{ margin: 0 }}>Subtitles ({subtitles.length})</h3>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 15,
              marginBottom: 80
            }}
          >
            {subtitlesList}
          </div>
        </>
      )}

      {/* Fixed Action Bar */}
      {subtitles.length > 0 && (
        <div
          className={css`
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 15px 20px;
            background-color: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(8px);
            border-top: 1px solid rgba(238, 238, 238, 0.8);
            display: flex;
            gap: 10px;
            justify-content: center;
            z-index: 100;
            box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.08);
          `}
        >
          <Button
            onClick={handleSaveEditedSrt}
            variant="primary"
            size="lg"
            className={`${buttonGradientStyles.base} ${buttonGradientStyles.primary}`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: '8px' }}
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Save Edited SRT
          </Button>
          <Button
            onClick={handleOpenMergeModal}
            variant="secondary"
            size="lg"
            disabled={!videoFile || !srtContent || isMergingInProgress}
            className={mergeButtonStyles}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: '8px' }}
            >
              <path d="M14 3v4a1 1 0 0 0 1 1h4" />
              <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
              <path d="M12 11v6" />
              <path d="M9 14l3 -3l3 3" />
            </svg>
            Merge Video with Subtitles
          </Button>
        </div>
      )}
    </div>
  );

  function handlePlayerReady(player: any) {
    onSetCurrentPlayer(player);
    player.on('play', () => onSetIsPlaying(true));
    player.on('pause', () => onSetIsPlaying(false));
    player.on('ended', () => onSetIsPlaying(false));

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

  function handleOpenMergeModal() {
    if (!videoFile || !srtContent) {
      onSetError('Both video and subtitles are required for merging');
      return;
    }
    // Instead of showing the modal, directly merge with default settings
    handleMergeVideoWithSubtitles();
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

  async function handleMergeVideoWithSubtitles() {
    try {
      // Update global merge state
      mergeStates[sessionIdRef.current] = {
        inProgress: true,
        progress: 0,
        stage: 'Preparing files',
        completedTimestamp: 0
      };

      // Update UI state
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

      // Chunking logic for large files
      const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB, same as handleFileUpload
      const totalChunks = Math.ceil(videoFile.size / CHUNK_SIZE);
      const sessionId = `${Date.now()}-${videoFile.name.replace(
        /[^a-zA-Z0-9]/g,
        '_'
      )}`;
      const uploadedChunkIndexes = new Set(); // Track uploaded chunks

      // Function to upload a chunk with retries
      const uploadChunkWithRetry = async (
        chunk: Blob,
        chunkIndex: number,
        isLastChunk: boolean,
        srtContent: string,
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

            // Convert chunk to base64
            let binary = '';
            const bytes = new Uint8Array(chunkArrayBuffer);
            for (let i = 0; i < bytes.length; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            const base64 = btoa(binary);
            const chunkBase64 = `data:${videoFile.type};base64,${base64}`;

            // Call the chunk-handling merge endpoint
            const response = await mergeVideoWithSubtitles({
              chunk: chunkBase64,
              srtContent: isLastChunk ? srtContent : undefined, // Send SRT with last chunk
              sessionId,
              chunkIndex,
              totalChunks,
              contentType: videoFile.type,
              processVideo: isLastChunk, // Trigger merge on last chunk
              onProgress: (progress: number) => {
                const chunkProgress = progress / 100;
                const overallProgress = Math.round(
                  ((chunkIndex + chunkProgress) / totalChunks) * 100
                );

                // Update both UI and global state
                onSetMergeProgress(overallProgress);
                if (mergeStates[sessionIdRef.current]) {
                  mergeStates[sessionIdRef.current].progress = overallProgress;
                }

                if (isLastChunk && progress >= 99) {
                  const stageText = 'Merging video with subtitles';
                  onSetMergeStage(stageText);
                  if (mergeStates[sessionIdRef.current]) {
                    mergeStates[sessionIdRef.current].stage = stageText;
                  }
                  onSetMergeProgress(100);
                  if (mergeStates[sessionIdRef.current]) {
                    mergeStates[sessionIdRef.current].progress = 100;
                  }
                }
              }
            });

            if (!response || response.error) {
              throw new Error(response?.error || 'Chunk upload failed');
            }

            return response;
          } catch (error) {
            retries++;
            console.error(
              `Chunk ${chunkIndex} failed (attempt ${retries}/${maxRetries}):`,
              error
            );
            if (retries >= maxRetries) throw error;
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
      };

      // Upload each chunk
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, videoFile.size);
        const chunk = videoFile.slice(start, end);
        const isLastChunk = chunkIndex === totalChunks - 1;

        const uploadStage = `Uploading chunk ${
          chunkIndex + 1
        } of ${totalChunks}`;
        onSetMergeStage(uploadStage);
        if (mergeStates[sessionIdRef.current]) {
          mergeStates[sessionIdRef.current].stage = uploadStage;
        }

        const response = await uploadChunkWithRetry(
          chunk,
          chunkIndex,
          isLastChunk,
          srtContent
        );
        uploadedChunkIndexes.add(chunkIndex);

        if (isLastChunk && response.videoUrl) {
          // Verify all chunks uploaded
          if (uploadedChunkIndexes.size !== totalChunks) {
            const missing = Array.from(
              { length: totalChunks },
              (_, i) => i
            ).filter((i) => !uploadedChunkIndexes.has(i));
            throw new Error(`Missing chunks: ${missing.join(', ')}`);
          }

          const completeStage = 'Merging complete';
          onSetMergeStage(completeStage);

          // Mark as completed in global state - IMMEDIATELY set inProgress to false
          if (mergeStates[sessionIdRef.current]) {
            mergeStates[sessionIdRef.current].stage = completeStage;
            mergeStates[sessionIdRef.current].completedTimestamp = Date.now();
            mergeStates[sessionIdRef.current].progress = 100;
            mergeStates[sessionIdRef.current].inProgress = false; // Mark as not in progress immediately
          }

          // Just keep the UI showing for 2 seconds before hiding it
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

      // Update both UI and global state to show error
      onSetIsMergingInProgress(false);
      if (mergeStates[sessionIdRef.current]) {
        mergeStates[sessionIdRef.current].inProgress = false;
        mergeStates[sessionIdRef.current].stage = 'Error occurred';
      }
    }
  }
}

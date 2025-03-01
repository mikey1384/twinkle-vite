import React, { useEffect, useRef } from 'react';
import VideoPlayerWithSubtitles from './VideoPlayerWithSubtitles';
import { useAppContext } from '~/contexts/hooks';
import { buildSrt, srtTimeToSeconds } from '../utils';

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

  useEffect(() => {
    return () => {
      if (playTimeoutRef.current) {
        window.clearTimeout(playTimeoutRef.current);
      }
    };
  }, []);

  return (
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
                    onSetVideoFile(e.target.files[0]);
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
                      onSetSrtContent(text);
                      const parsed = parseSrt(
                        text,
                        targetLanguage,
                        showOriginalText
                      );
                      onSetSubtitles(parsed);
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
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
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
                          onClick={() => handlePlaySubtitle(sub.start, sub.end)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: isPlaying ? '#dc3545' : '#007bff',
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
  );

  function handleEditSubtitle(
    index: number,
    field: 'start' | 'end' | 'text',
    value: number | string
  ) {
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
    onSetSubtitles(newSubtitles);
  }

  function handleInsertSubtitle(index: number) {
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
  }

  function handleOpenMergeModal() {
    if (!videoFile || !srtContent) {
      onSetError('Both video and subtitles are required for merging');
      return;
    }
    // Instead of showing the modal, directly merge with default settings
    handleMergeVideoWithSubtitles();
  }

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

    onSetSubtitles(updatedSubtitles);
  }

  async function handleMergeVideoWithSubtitles() {
    try {
      onSetIsMergingInProgress(true);
      onSetMergeProgress(0);
      onSetMergeStage('Preparing files');
      onSetError('');

      if (!videoFile) {
        onSetError('Video file is required for merging');
        onSetIsMergingInProgress(false);
        return;
      }

      // Convert video to base64
      const reader = new FileReader();
      const videoBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(videoFile);
      });

      onSetMergeStage('Uploading files');
      onSetMergeProgress(10);

      await mergeVideoWithSubtitles({
        videoData: videoBase64,
        srtContent: srtContent,
        filename: videoFile.name
      });
      onSetMergeStage('Processing complete');
      setTimeout(() => {
        onSetIsMergingInProgress(false);
      }, 2000);
    } catch (error) {
      console.error('Error merging video with subtitles:', error);
      onSetError(
        error instanceof Error
          ? error.message
          : 'An error occurred while merging video with subtitles'
      );
      onSetIsMergingInProgress(false);
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

  function handleSeekToSubtitle(startTime: number) {
    if (currentPlayer) {
      currentPlayer.currentTime(startTime);
    }
  }

  function handleTimeInputBlur(index: number, field: 'start' | 'end') {
    const editKey = `${index}-${field}`;
    onSetEditingTimes((prev: any) => {
      const newTimes = { ...prev };
      delete newTimes[editKey];
      return newTimes;
    });
  }

  function handleUpdateSubtitles() {
    const updatedSrt = buildSrt(subtitles);
    onSetSrtContent(updatedSrt);

    if (currentPlayer) {
      const currentTime = currentPlayer.currentTime();
      setTimeout(() => {
        currentPlayer.currentTime(currentTime);
      }, 100);
    }
  }
}

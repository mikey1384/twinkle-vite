import React, { useCallback, useEffect, useRef, useState } from 'react';
import { debounce } from 'lodash';
import { mergeStates, subtitleVideoPlayer, subtitlesState } from '~/constants/state';
import { srtTimeToSeconds } from '../utils';
import ActionBar from './ActionBar';
import FileInputs from './FileInputs';
import PlayerPanel from './PlayerPanel';
import { generateSrtContent } from './srt';
import { containerStyles } from './styles';
import SubtitleList from './SubtitleList';
import type {
  EditSubtitlesProps,
  FocusedInputState,
  SubtitleField,
  TimeField
} from './types';
import useMerge from './useMerge';

export default function EditSubtitles({
  videoFile,
  videoUrl,
  isPlaying,
  editingTimes,
  targetLanguage,
  showOriginalText,
  isMergingInProgress,
  onSetEditingTimes,
  onSetVideoFile,
  onSetVideoUrl,
  onSetError,
  secondsToSrtTime,
  parseSrt,
  onSetIsMergingInProgress,
  onSetMergeProgress,
  onSetMergeStage,
  onSetIsPlaying,
  subtitles,
  onSetSubtitles
}: EditSubtitlesProps) {
  const playTimeoutRef = useRef<number | null>(null);
  const sessionIdRef = useRef<string>(`merge-${Date.now()}`);
  const [fileKey, setFileKey] = useState<number>(Date.now());
  const debouncedTimeUpdateRef = useRef<Record<string, (value: string) => void>>(
    {}
  );
  const [isShiftingDisabled, setIsShiftingDisabled] = useState(false);
  const focusedInputRef = useRef<FocusedInputState>({
    index: null,
    field: null
  });
  const [shiftAmount, setShiftAmount] = useState<number>(0);

  const { handleMerge } = useMerge({
    videoFile,
    subtitles,
    sessionIdRef,
    secondsToSrtTime,
    onSetError,
    onSetIsMergingInProgress,
    onSetMergeProgress,
    onSetMergeStage
  });

  useEffect(() => {
    if (isMergingInProgress) {
      if (
        !mergeStates[sessionIdRef.current] ||
        !mergeStates[sessionIdRef.current].inProgress
      ) {
        onSetIsMergingInProgress(false);
        onSetMergeProgress(0);
        onSetMergeStage('');
      }
    }

    if (!mergeStates[sessionIdRef.current]) {
      mergeStates[sessionIdRef.current] = {
        inProgress: false,
        progress: 0,
        stage: '',
        completedTimestamp: 0
      };
    }

    const playTimeout = playTimeoutRef.current;
    const sessionId = sessionIdRef.current;

    return () => {
      if (playTimeout) {
        window.clearTimeout(playTimeout);
      }

      if (mergeStates[sessionId]) {
        if (
          mergeStates[sessionId].progress >= 100 ||
          mergeStates[sessionId].stage === 'Merging complete'
        ) {
          mergeStates[sessionId].inProgress = false;
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMergingInProgress]);

  useEffect(() => {
    if (
      Object.keys(editingTimes).length > 0 &&
      Object.keys(subtitlesState.editingTimes).length === 0
    ) {
      subtitlesState.editingTimes = { ...editingTimes };
    }
  }, [editingTimes]);

  useEffect(() => {
    return () => {
      if (playTimeoutRef.current) {
        window.clearTimeout(playTimeoutRef.current);
        playTimeoutRef.current = null;
      }
    };
  }, [subtitles]);

  useEffect(() => {
    if (subtitles.length > 0) {
      const currentEditingKeys = Object.keys(subtitlesState.editingTimes || {});
      const validIndices = subtitles.map((_, index) => index);

      const hasInvalidEdits = currentEditingKeys.some((key) => {
        const parts = key.split('-');
        const index = parseInt(parts[0], 10);
        return isNaN(index) || !validIndices.includes(index);
      });

      if (hasInvalidEdits) {
        subtitlesState.editingTimes = {};
        onSetEditingTimes({});
      }
    }
  }, [onSetEditingTimes, subtitles]);

  const handleTimeInputBlur = useCallback(
    (index: number, field: TimeField) => {
      const editKey = `${index}-${field}`;
      const currentEditValue = subtitlesState.editingTimes[editKey];

      if (currentEditValue) {
        let numValue: number;
        if (
          typeof currentEditValue === 'string' &&
          currentEditValue.includes(':')
        ) {
          numValue = srtTimeToSeconds(currentEditValue);
        } else {
          numValue = parseFloat(currentEditValue);
        }

        if (!isNaN(numValue) && numValue >= 0) {
          const currentSub = subtitles[index];
          const prevSub = index > 0 ? subtitles[index - 1] : null;
          let isValid = true;
          let newEnd = currentSub.end;

          if (field === 'start') {
            if (prevSub && numValue < prevSub.start) {
              isValid = false;
            }

            if (numValue >= currentSub.end) {
              const originalDuration = currentSub.end - currentSub.start;
              newEnd = numValue + originalDuration;
            }
          }

          if (isValid) {
            if (field === 'start' && numValue >= currentSub.end) {
              onSetSubtitles((current) =>
                current.map((sub, i) =>
                  i === index ? { ...sub, start: numValue, end: newEnd } : sub
                )
              );
            } else {
              onSetSubtitles((current) =>
                current.map((sub, i) =>
                  i === index ? { ...sub, [field]: numValue } : sub
                )
              );
            }
            subtitlesState.lastEdited = Date.now();
          }
        }
      }

      const newEditingTimes = { ...subtitlesState.editingTimes };
      delete newEditingTimes[editKey];
      subtitlesState.editingTimes = newEditingTimes;

      onSetEditingTimes((prev) => {
        const newTimes = { ...prev };
        delete newTimes[editKey];
        return newTimes;
      });
    },
    [onSetEditingTimes, onSetSubtitles, subtitles]
  );

  const handleRemoveSubtitle = useCallback(
    (index: number) => {
      if (
        !window.confirm('Are you sure you want to remove this subtitle block?')
      ) {
        return;
      }

      const updatedSubtitles = subtitles.filter((_, i) => i !== index);
      onSetSubtitles(
        updatedSubtitles.map((sub, i) => ({
          ...sub,
          index: i + 1
        }))
      );
      subtitlesState.lastEdited = Date.now();
    },
    [onSetSubtitles, subtitles]
  );

  const handleInsertSubtitle = useCallback(
    (index: number) => {
      const currentSub = subtitles[index];
      const nextSub =
        index < subtitles.length - 1 ? subtitles[index + 1] : null;

      const newStart = currentSub.end;
      const newEnd = nextSub ? nextSub.start : currentSub.end + 2;

      const newSubtitle = {
        index: index + 2,
        start: newStart,
        end: newEnd,
        text: ''
      };

      const updatedSubtitles = [
        ...subtitles.slice(0, index + 1),
        newSubtitle,
        ...subtitles.slice(index + 1)
      ];

      onSetSubtitles(
        updatedSubtitles.map((sub, i) => ({
          ...sub,
          index: i + 1
        }))
      );
      subtitlesState.lastEdited = Date.now();
    },
    [onSetSubtitles, subtitles]
  );

  const handleSeekToSubtitle = useCallback((startTime: number) => {
    if (!subtitleVideoPlayer.instance) {
      console.warn('Cannot seek - player not available in global state');
      return;
    }

    const player = subtitleVideoPlayer.instance;

    try {
      if (typeof player.currentTime !== 'function') {
        console.error('Player currentTime method not available');
        return;
      }

      player.currentTime(startTime);
    } catch (error) {
      console.error('Error seeking to time:', error);
    }
  }, []);

  const handleSrtFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      event.target.value = '';

      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const srtContent = loadEvent.target?.result as string;

        try {
          subtitlesState.segments = [];
          subtitlesState.editingTimes = {};
          subtitlesState.lastEdited = Date.now();

          onSetSubtitles([]);
          onSetEditingTimes({});

          const parsed = parseSrt(srtContent, targetLanguage, showOriginalText);

          setTimeout(() => {
            onSetSubtitles(parsed);
            subtitlesState.segments = [...parsed];
            setFileKey(Date.now());
          }, 50);
        } catch (error) {
          console.error('Error parsing SRT:', error);
          onSetError('Invalid SRT file');
        }
      };
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        onSetError('Error reading SRT file');
      };
      reader.readAsText(file);
    },
    [
      onSetEditingTimes,
      onSetError,
      onSetSubtitles,
      parseSrt,
      showOriginalText,
      targetLanguage
    ]
  );

  const handleSaveEditedSrt = useCallback(() => {
    try {
      const srtContent = generateSrtContent(subtitles, secondsToSrtTime);
      const blob = new Blob([srtContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'edited_subtitles.srt';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error saving SRT file:', error);
      onSetError('Error saving SRT file');
    }
  }, [onSetError, secondsToSrtTime, subtitles]);

  useEffect(() => {
    if (subtitles.length > 0) {
      if (
        subtitleVideoPlayer.instance &&
        typeof subtitleVideoPlayer.instance.currentTime === 'function'
      ) {
        try {
          const currentTime = subtitleVideoPlayer.instance.currentTime();
          subtitleVideoPlayer.instance.currentTime(currentTime);
        } catch (error) {
          console.warn('Error updating player time:', error);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtitles, subtitleVideoPlayer.instance]);

  const handleShiftAllSubtitles = useCallback(() => {
    if (!shiftAmount || subtitles.length === 0) {
      return;
    }

    const shiftedSubtitles = subtitles.map((segment) => ({
      ...segment,
      start: Math.max(0, segment.start + shiftAmount),
      end: Math.max(0.001, segment.end + shiftAmount)
    }));

    onSetSubtitles(shiftedSubtitles);
    setShiftAmount(0);
  }, [onSetSubtitles, shiftAmount, subtitles]);

  const handleVideoSelect = useCallback(
    (file: File) => {
      onSetVideoFile(file);
    },
    [onSetVideoFile]
  );

  const handleVideoChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      onSetError('');

      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
        onSetVideoUrl(null);
      }

      setTimeout(() => {
        onSetVideoFile(file);
      }, 200);
    },
    [onSetError, onSetVideoFile, onSetVideoUrl, videoUrl]
  );

  const handleTogglePlay = useCallback(() => {
    if (!subtitleVideoPlayer.instance) {
      return;
    }

    if (isPlaying) {
      subtitleVideoPlayer.instance.pause();
      onSetIsPlaying(false);
    } else {
      subtitleVideoPlayer.instance.play();
      onSetIsPlaying(true);
    }
  }, [isPlaying, onSetIsPlaying]);

  return (
    <div className={containerStyles} id="subtitle-editor-section">
      <FileInputs
        fileKey={fileKey}
        subtitlesCount={subtitles.length}
        videoFile={videoFile}
        onSrtChange={handleSrtFileInputChange}
        onVideoSelect={handleVideoSelect}
      />
      <PlayerPanel
        fileKey={fileKey}
        isPlaying={isPlaying}
        shiftAmount={shiftAmount}
        subtitles={subtitles}
        videoUrl={videoUrl}
        onPlayerReady={handlePlayerReady}
        onShiftAllSubtitles={handleShiftAllSubtitles}
        onShiftAmountChange={setShiftAmount}
        onSrtChange={handleSrtFileInputChange}
        onTogglePlay={handleTogglePlay}
        onVideoChange={handleVideoChange}
      />
      <SubtitleList
        editingTimes={editingTimes}
        fileKey={fileKey}
        isPlaying={isPlaying}
        isShiftingDisabled={isShiftingDisabled}
        subtitles={subtitles}
        secondsToSrtTime={secondsToSrtTime}
        onEditSubtitle={handleEditSubtitle}
        onInsertSubtitle={handleInsertSubtitle}
        onPlaySubtitle={handlePlaySubtitle}
        onRemoveSubtitle={handleRemoveSubtitle}
        onSeekToSubtitle={handleSeekToSubtitle}
        onShiftSubtitle={handleShiftSubtitle}
        onTimeInputBlur={handleTimeInputBlur}
      />
      <ActionBar
        hasVideoFile={Boolean(videoFile)}
        isMergingInProgress={isMergingInProgress}
        subtitlesCount={subtitles.length}
        onMerge={handleMerge}
        onSave={handleSaveEditedSrt}
      />
    </div>
  );

  function handlePlayerReady(player: any) {
    if (!player) {
      console.warn('Invalid player received in handlePlayerReady');
      return;
    }

    if (
      typeof player.currentTime !== 'function' ||
      typeof player.play !== 'function' ||
      typeof player.pause !== 'function'
    ) {
      console.error('Player is missing required methods');
      return;
    }

    player.on('play', () => {
      onSetIsPlaying(true);
    });

    player.on('pause', () => {
      onSetIsPlaying(false);
    });

    player.on('ended', () => {
      onSetIsPlaying(false);
    });

    player.on('timeupdate', () => {
      const timeDisplay = document.getElementById('current-timestamp');
      if (timeDisplay && player) {
        try {
          const currentTime = player.currentTime();
          timeDisplay.textContent = secondsToSrtTime(currentTime);
        } catch (error) {
          console.error('Error updating timestamp display:', error);
        }
      }
    });

    player.on('error', (error: any) => {
      console.error('Video player error:', error, player.error());
    });
  }

  function handlePlaySubtitle(startTime: number, endTime: number) {
    if (!subtitleVideoPlayer.instance) {
      console.warn('No player instance available in global state');
      return;
    }

    const player = subtitleVideoPlayer.instance;

    try {
      if (
        typeof player.currentTime !== 'function' ||
        typeof player.play !== 'function' ||
        typeof player.pause !== 'function'
      ) {
        console.error(
          'Player methods not available - invalid player reference'
        );
        return;
      }
    } catch (error) {
      console.error('Error accessing player methods:', error);
      return;
    }

    if (playTimeoutRef.current) {
      window.clearTimeout(playTimeoutRef.current);
      playTimeoutRef.current = null;
    }

    if (isPlaying) {
      try {
        player.pause();
        onSetIsPlaying(false);
      } catch (error) {
        console.error('Error pausing player:', error);
      }
      return;
    }

    try {
      player.currentTime(startTime);
      const playPromise = player.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            onSetIsPlaying(true);
          })
          .catch((error: unknown) => {
            console.error('Error starting playback:', error);
            onSetIsPlaying(false);
          });
      } else {
        onSetIsPlaying(true);
      }

      const duration = (endTime - startTime) * 1000;

      playTimeoutRef.current = window.setTimeout(() => {
        try {
          if (player && typeof player.pause === 'function') {
            player.pause();
          } else {
            console.warn('Cannot pause - player not available in timeout');
          }
          onSetIsPlaying(false);
        } catch (error) {
          console.error('Error pausing player after timeout:', error);
        }
        playTimeoutRef.current = null;
      }, duration);
    } catch (error) {
      console.error('Error during subtitle playback:', error);
      onSetIsPlaying(false);
    }
  }

  function handleEditSubtitle(
    index: number,
    field: SubtitleField,
    value: number | string
  ) {
    focusedInputRef.current = { index, field };

    if (field === 'text') {
      onSetSubtitles((current) =>
        current.map((sub, i) =>
          i === index ? { ...sub, text: value as string } : sub
        )
      );
      subtitlesState.lastEdited = Date.now();
      return;
    }

    const editKey = `${index}-${field}`;
    subtitlesState.editingTimes[editKey] = value as string;

    onSetEditingTimes((prev) => ({
      ...prev,
      [editKey]: value as string
    }));

    const debounceKey = `${index}-${field}`;

    if (!debouncedTimeUpdateRef.current[debounceKey]) {
      debouncedTimeUpdateRef.current[debounceKey] = debounce(
        (nextValue: string) => {
          let numValue: number;
          if (typeof nextValue === 'string' && nextValue.includes(':')) {
            numValue = srtTimeToSeconds(nextValue);
          } else {
            numValue = parseFloat(nextValue);
          }

          if (isNaN(numValue) || numValue < 0) {
            return;
          }

          const currentSub = subtitles[index];
          const prevSub = index > 0 ? subtitles[index - 1] : null;

          if (field === 'start') {
            if (prevSub && numValue < prevSub.start) {
              return;
            }

            let newEnd = currentSub.end;
            if (numValue >= currentSub.end) {
              const originalDuration = currentSub.end - currentSub.start;
              newEnd = numValue + originalDuration;
            }

            onSetSubtitles((current) =>
              current.map((sub, i) =>
                i === index ? { ...sub, start: numValue, end: newEnd } : sub
              )
            );
          } else {
            onSetSubtitles((current) =>
              current.map((sub, i) =>
                i === index ? { ...sub, [field]: numValue } : sub
              )
            );
          }

          subtitlesState.lastEdited = Date.now();
          setTimeout(restoreFocus, 50);
        },
        300
      );
    }

    debouncedTimeUpdateRef.current[debounceKey](String(value));
  }

  function handleShiftSubtitle(index: number, shiftSeconds: number) {
    if (isShiftingDisabled) {
      return;
    }

    setIsShiftingDisabled(true);

    try {
      onSetSubtitles((current) => {
        const currentSub = current[index];
        const newStart = Math.max(0, currentSub.start + shiftSeconds);

        if (newStart === 0 && currentSub.start + shiftSeconds < 0) {
          return current;
        }

        const newEnd = currentSub.end + shiftSeconds;
        const updatedSegments = [...current];

        updatedSegments[index] = {
          ...currentSub,
          start: newStart,
          end: newEnd
        };

        if (shiftSeconds < 0) {
          let i = index - 1;
          while (i >= 0) {
            const prevSub = updatedSegments[i];
            const nextSub = updatedSegments[i + 1];
            const prevDuration = prevSub.end - prevSub.start;

            if (
              Math.abs(prevSub.end - nextSub.start) < 0.001 ||
              prevSub.end > nextSub.start
            ) {
              const newPrevEnd = nextSub.start;
              const newPrevStart = Math.max(0, newPrevEnd - prevDuration);

              if (newPrevStart === 0 && newPrevEnd - prevDuration < 0) {
                break;
              }

              updatedSegments[i] = {
                ...prevSub,
                start: newPrevStart,
                end: newPrevEnd
              };
              i -= 1;
            } else {
              break;
            }
          }
        }

        if (shiftSeconds > 0) {
          let i = index + 1;
          while (i < updatedSegments.length) {
            const prevSub = updatedSegments[i - 1];
            const nextSub = updatedSegments[i];
            const nextDuration = nextSub.end - nextSub.start;

            if (
              Math.abs(prevSub.end - nextSub.start) < 0.001 ||
              prevSub.end > nextSub.start
            ) {
              const newNextStart = Math.max(
                nextSub.start + shiftSeconds,
                prevSub.end
              );

              updatedSegments[i] = {
                ...nextSub,
                start: newNextStart,
                end: newNextStart + nextDuration
              };
              i += 1;
            } else {
              break;
            }
          }
        }

        return updatedSegments;
      });

      subtitlesState.lastEdited = Date.now();

      if (subtitleVideoPlayer.instance) {
        if (typeof subtitleVideoPlayer.instance.currentTime !== 'function') {
          console.error('Player currentTime method not available');
          setIsShiftingDisabled(false);
          return;
        }

        const newStart = Math.max(0, subtitles[index].start + shiftSeconds);
        subtitleVideoPlayer.instance.currentTime(newStart);

        const timeDisplay = document.getElementById('current-timestamp');
        if (timeDisplay) {
          timeDisplay.textContent = secondsToSrtTime(newStart);
        }
      }
    } catch (error) {
      console.error('Error during subtitle shift:', error);
      setIsShiftingDisabled(false);
      return;
    }

    setTimeout(() => {
      setIsShiftingDisabled(false);
    }, 50);
  }

  function restoreFocus() {
    const { index, field } = focusedInputRef.current;
    if (index === null || field === null) {
      return;
    }

    const inputId = `subtitle-${index}-${field}`;
    const inputToFocus = document.getElementById(inputId);

    if (inputToFocus instanceof HTMLElement) {
      inputToFocus.focus();

      if (inputToFocus instanceof HTMLInputElement) {
        const length = inputToFocus.value.length;
        inputToFocus.setSelectionRange(length, length);
      }
    }
  }
}

import type { Dispatch, SetStateAction } from 'react';
import type { SrtSegment } from '~/types';

export type { SrtSegment } from '~/types';

export type EditingTimes = Record<string, string>;
export type SubtitleField = 'start' | 'end' | 'text';
export type TimeField = 'start' | 'end';

export interface FocusedInputState {
  index: number | null;
  field: SubtitleField | null;
}

export type SetEditingTimes = Dispatch<SetStateAction<EditingTimes>>;
export type SetSubtitles = Dispatch<SetStateAction<SrtSegment[]>>;

export interface EditSubtitlesProps {
  videoFile: File | null;
  videoUrl: string | null;
  isPlaying: boolean;
  editingTimes: EditingTimes;
  targetLanguage: string;
  showOriginalText: boolean;
  isMergingInProgress: boolean;
  onSetEditingTimes: SetEditingTimes;
  onSetVideoFile: (file: File) => void;
  onSetVideoUrl: (url: string | null) => void;
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
  subtitles: SrtSegment[];
  onSetSubtitles: SetSubtitles;
}

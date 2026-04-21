import React from 'react';
import SubtitleEditor from './SubtitleEditor';
import type {
  EditingTimes,
  SrtSegment,
  SubtitleField,
  TimeField
} from './types';

interface Props {
  editingTimes: EditingTimes;
  fileKey: number;
  isPlaying: boolean;
  isShiftingDisabled: boolean;
  subtitles: SrtSegment[];
  secondsToSrtTime: (seconds: number) => string;
  onEditSubtitle: (
    index: number,
    field: SubtitleField,
    value: number | string
  ) => void;
  onInsertSubtitle: (index: number) => void;
  onPlaySubtitle: (startTime: number, endTime: number) => void;
  onRemoveSubtitle: (index: number) => void;
  onSeekToSubtitle: (startTime: number) => void;
  onShiftSubtitle: (index: number, shiftSeconds: number) => void;
  onTimeInputBlur: (index: number, field: TimeField) => void;
}

export default function SubtitleList({
  editingTimes,
  fileKey,
  isPlaying,
  isShiftingDisabled,
  subtitles,
  secondsToSrtTime,
  onEditSubtitle,
  onInsertSubtitle,
  onPlaySubtitle,
  onRemoveSubtitle,
  onSeekToSubtitle,
  onShiftSubtitle,
  onTimeInputBlur
}: Props) {
  if (subtitles.length === 0) {
    return null;
  }

  return (
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
        {subtitles.map((sub, index) => (
          <React.Fragment
            key={`subtitle-${index}-${sub.start}-${sub.end}-${fileKey}`}
          >
            <SubtitleEditor
              sub={sub}
              index={index}
              editingTimes={editingTimes}
              isPlaying={isPlaying}
              secondsToSrtTime={secondsToSrtTime}
              onEditSubtitle={onEditSubtitle}
              onTimeInputBlur={onTimeInputBlur}
              onRemoveSubtitle={onRemoveSubtitle}
              onInsertSubtitle={onInsertSubtitle}
              onSeekToSubtitle={onSeekToSubtitle}
              onPlaySubtitle={onPlaySubtitle}
              onShiftSubtitle={onShiftSubtitle}
              isShiftingDisabled={isShiftingDisabled}
            />
          </React.Fragment>
        ))}
      </div>
    </>
  );
}

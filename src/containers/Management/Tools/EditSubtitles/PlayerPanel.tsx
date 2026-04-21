import React from 'react';
import { css } from '@emotion/css';
import Button from '../Button';
import ButtonGroup from '../ButtonGroup';
import StylizedFileInput from '../StylizedFileInput';
import VideoPlayerWithSubtitles from './VideoPlayerWithSubtitles';
import { buttonStyles } from './styles';
import type { SrtSegment } from './types';

interface Props {
  fileKey: number;
  isPlaying: boolean;
  shiftAmount: number;
  subtitles: SrtSegment[];
  videoUrl: string | null;
  onPlayerReady: React.ComponentProps<
    typeof VideoPlayerWithSubtitles
  >['onPlayerReady'];
  onShiftAllSubtitles: () => void;
  onShiftAmountChange: (value: number) => void;
  onSrtChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePlay: () => void;
  onVideoChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const panelStyles = css`
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
`;

const timestampStyles = css`
  margin-top: 10px;
  font-size: 14px;
  font-family: monospace;
  background-color: rgba(248, 249, 250, 0.9);
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid rgba(222, 226, 230, 0.7);
  display: inline-block;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const playerControlsStyles = css`
  margin-top: 15px;
`;

const playPauseButtonStyles = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  min-width: 80px;
  transition: all 0.2s ease;

  svg {
    margin-right: 6px;
  }
`;

const shiftControlsStyles = css`
  display: flex;
  align-items: center;
  margin-top: 15px;
  padding: 10px;
  background-color: rgba(248, 249, 250, 0.9);
  border-radius: 8px;
  border: 1px solid rgba(222, 226, 230, 0.7);
  width: 100%;
`;

const shiftLabelStyles = css`
  margin-right: 10px;
  font-weight: bold;
  white-space: nowrap;
`;

const shiftAmountInputStyles = css`
  width: 80px;
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid var(--ui-border);
  margin-right: 10px;
`;

const shiftUnitStyles = css`
  margin-right: 15px;
  white-space: nowrap;
`;

const shiftActionStyles = css`
  height: 36px;
  display: flex;
  align-items: center;
`;

const shiftSummaryStyles = css`
  margin-left: auto;
  font-size: 12px;
  color: #6c757d;
`;

export default function PlayerPanel({
  fileKey,
  isPlaying,
  shiftAmount,
  subtitles,
  videoUrl,
  onPlayerReady,
  onShiftAllSubtitles,
  onShiftAmountChange,
  onSrtChange,
  onTogglePlay,
  onVideoChange
}: Props) {
  if (!videoUrl) {
    return null;
  }

  return (
    <div className={panelStyles}>
      <VideoPlayerWithSubtitles
        key={`video-player-${videoUrl}`}
        videoUrl={videoUrl}
        subtitles={subtitles}
        onPlayerReady={onPlayerReady}
      />

      <div className={timestampStyles}>
        Current time: <span id="current-timestamp">00:00:00,000</span>
      </div>

      <ButtonGroup align="center" className={playerControlsStyles}>
        <StylizedFileInput
          accept="video/*"
          onChange={onVideoChange}
          buttonText="Change Video"
          selectedFile={null}
        />
        <StylizedFileInput
          key={fileKey}
          accept=".srt"
          onChange={onSrtChange}
          buttonText="Change SRT"
          selectedFile={null}
        />
        <Button
          onClick={onTogglePlay}
          variant="primary"
          size="md"
          className={`${buttonStyles.base} ${buttonStyles.primary} ${playPauseButtonStyles}`}
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

      <div className={shiftControlsStyles}>
        <label className={shiftLabelStyles}>Shift All Subtitles:</label>
        <input
          type="number"
          value={shiftAmount}
          onChange={(event) =>
            onShiftAmountChange(parseFloat(event.target.value) || 0)
          }
          step="0.5"
          className={shiftAmountInputStyles}
          placeholder="±seconds"
          title="Enter positive values to shift forward, negative values to shift backward"
        />
        <span className={shiftUnitStyles}>seconds</span>
        <Button
          onClick={onShiftAllSubtitles}
          variant="primary"
          size="sm"
          disabled={!shiftAmount || subtitles.length === 0}
          className={`${buttonStyles.base} ${buttonStyles.primary} ${shiftActionStyles}`}
        >
          {shiftAmount >= 0 ? 'Shift Forward' : 'Shift Backward'}
        </Button>
        <div className={shiftSummaryStyles}>
          {shiftAmount > 0
            ? `+${shiftAmount}s`
            : shiftAmount < 0
            ? `${shiftAmount}s`
            : '±0s'}
        </div>
      </div>
    </div>
  );
}

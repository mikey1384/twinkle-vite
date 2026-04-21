import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { debounce } from 'lodash';
import { mobileMaxWidth } from '~/constants/css';
import Button from '../Button';
import ButtonGroup from '../ButtonGroup';
import { buttonStyles } from './styles';
import type {
  EditingTimes,
  SrtSegment,
  SubtitleField,
  TimeField
} from './types';

interface SubtitleEditorProps {
  sub: SrtSegment;
  index: number;
  editingTimes: EditingTimes;
  isPlaying: boolean;
  secondsToSrtTime: (seconds: number) => string;
  onEditSubtitle: (
    index: number,
    field: SubtitleField,
    value: number | string
  ) => void;
  onTimeInputBlur: (index: number, field: TimeField) => void;
  onRemoveSubtitle: (index: number) => void;
  onInsertSubtitle: (index: number) => void;
  onSeekToSubtitle: (startTime: number) => void;
  onPlaySubtitle: (startTime: number, endTime: number) => void;
  onShiftSubtitle: (index: number, shiftSeconds: number) => void;
  isShiftingDisabled: boolean;
}

const textInputStyles = {
  width: '100%',
  minHeight: '60px',
  padding: '8px',
  borderRadius: 4,
  border: '1px solid rgba(221, 221, 221, 0.8)',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  resize: 'vertical' as const,
  fontFamily: 'monospace',
  fontSize: 'inherit',
  lineHeight: '1.4',
  whiteSpace: 'pre-wrap' as const
};

const timeInputStyles = css`
  width: 150px;
  padding: 6px 8px;
  border-radius: 4px;
  border: 1px solid rgba(221, 221, 221, 0.8);
  background-color: rgba(255, 255, 255, 0.9);
  font-family: monospace;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: rgba(0, 123, 255, 0.8);
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
`;

function SubtitleEditor({
  sub,
  index,
  editingTimes,
  isPlaying,
  secondsToSrtTime,
  onEditSubtitle,
  onTimeInputBlur,
  onRemoveSubtitle,
  onInsertSubtitle,
  onSeekToSubtitle,
  onPlaySubtitle,
  onShiftSubtitle,
  isShiftingDisabled
}: SubtitleEditorProps) {
  const [text, setText] = useState(sub.text);

  useEffect(() => {
    setText(sub.text);
  }, [sub.text]);

  const debouncedTextUpdate = useRef(
    debounce((subtitleIndex: number, nextText: string) => {
      onEditSubtitle(subtitleIndex, 'text', nextText);
    }, 300)
  ).current;

  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 15px;
        border-radius: 6px;
        border: 1px solid rgba(222, 226, 230, 0.7);
        background-color: rgba(248, 249, 250, 0.5);
        transition: all 0.2s ease;

        &:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          background-color: rgba(248, 249, 250, 0.8);
        }
      `}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div style={{ fontWeight: 'bold' }}>#{sub.index}</div>
        <ButtonGroup spacing="sm">
          <Button
            onClick={() => onRemoveSubtitle(index)}
            size="sm"
            variant="danger"
            title="Remove this subtitle"
            className={`${buttonStyles.base} ${buttonStyles.danger}`}
          >
            Delete
          </Button>
          <Button
            onClick={() => onInsertSubtitle(index)}
            size="sm"
            variant="primary"
            title="Insert a new subtitle after this one"
            className={`${buttonStyles.base} ${buttonStyles.primary}`}
          >
            Insert
          </Button>
        </ButtonGroup>
      </div>

      <div>
        <textarea
          value={text}
          onChange={handleTextChange}
          style={textInputStyles}
          placeholder="Enter subtitle text (press Enter for line breaks)"
          id={`subtitle-${index}-text`}
        />
      </div>

      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center'
        }}
        className={css`
          @media (max-width: ${mobileMaxWidth}) {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
        `}
      >
        <div>
          <label style={{ marginRight: 5, fontWeight: 500 }}>Start:</label>
          <input
            type="text"
            value={
              editingTimes[`${index}-start`] ?? secondsToSrtTime(sub.start)
            }
            onChange={(event) =>
              onEditSubtitle(index, 'start', event.target.value)
            }
            onBlur={() => onTimeInputBlur(index, 'start')}
            className={timeInputStyles}
            id={`subtitle-${index}-start`}
          />
        </div>
        <div>
          <label style={{ marginRight: 5, fontWeight: 500 }}>End:</label>
          <input
            type="text"
            value={editingTimes[`${index}-end`] ?? secondsToSrtTime(sub.end)}
            onChange={(event) =>
              onEditSubtitle(index, 'end', event.target.value)
            }
            onBlur={() => onTimeInputBlur(index, 'end')}
            className={timeInputStyles}
            id={`subtitle-${index}-end`}
          />
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          <Button
            onClick={() => onShiftSubtitle(index, -0.1)}
            size="sm"
            variant="secondary"
            title="Shift backward by 0.1 second"
            style={{ padding: '2px 5px', minWidth: '30px' }}
            className="shift-button"
            disabled={isShiftingDisabled}
          >
            -0.1s
          </Button>
          <Button
            onClick={() => onShiftSubtitle(index, -0.5)}
            size="sm"
            variant="secondary"
            title="Shift backward by 0.5 second"
            style={{ padding: '2px 5px', minWidth: '30px' }}
            className="shift-button"
            disabled={isShiftingDisabled}
          >
            -0.5s
          </Button>
          <Button
            onClick={() => onShiftSubtitle(index, 0.1)}
            size="sm"
            variant="secondary"
            title="Shift forward by 0.1 second"
            style={{ padding: '2px 5px', minWidth: '30px' }}
            className="shift-button"
            disabled={isShiftingDisabled}
          >
            +0.1s
          </Button>
          <Button
            onClick={() => onShiftSubtitle(index, 0.5)}
            size="sm"
            variant="secondary"
            title="Shift forward by 0.5 second"
            style={{ padding: '2px 5px', minWidth: '30px' }}
            className="shift-button"
            disabled={isShiftingDisabled}
          >
            +0.5s
          </Button>
        </div>

        <ButtonGroup
          spacing="sm"
          className={css`
            @media (max-width: ${mobileMaxWidth}) {
              width: 100%;
              display: flex;
              justify-content: space-between;
            }
          `}
        >
          <Button
            onClick={() => onSeekToSubtitle(sub.start)}
            size="sm"
            variant="secondary"
            title="Move playhead to this subtitle's start time"
            className={css`
              @media (max-width: ${mobileMaxWidth}) {
                flex: 1;
                margin-right: 8px;
              }
            `}
          >
            Seek
          </Button>
          <Button
            onClick={() => onPlaySubtitle(sub.start, sub.end)}
            size="sm"
            variant={isPlaying ? 'danger' : 'primary'}
            style={{ minWidth: '60px' }}
            title={isPlaying ? 'Pause playback' : 'Play this subtitle segment'}
            className={`${buttonStyles.base} ${
              isPlaying ? buttonStyles.danger : buttonStyles.primary
            } ${css`
              @media (max-width: ${mobileMaxWidth}) {
                flex: 1;
              }
            `}`}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );

  function handleTextChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const nextText = event.target.value;
    setText(nextText);
    debouncedTextUpdate(index, nextText);
  }
}

export default React.memo(SubtitleEditor, (prevProps, nextProps) => {
  return (
    prevProps.isPlaying === nextProps.isPlaying &&
    prevProps.sub.start === nextProps.sub.start &&
    prevProps.sub.end === nextProps.sub.end &&
    prevProps.sub.index === nextProps.sub.index &&
    prevProps.isShiftingDisabled === nextProps.isShiftingDisabled &&
    prevProps.editingTimes[`${prevProps.index}-start`] ===
      nextProps.editingTimes[`${nextProps.index}-start`] &&
    prevProps.editingTimes[`${prevProps.index}-end`] ===
      nextProps.editingTimes[`${nextProps.index}-end`]
  );
});

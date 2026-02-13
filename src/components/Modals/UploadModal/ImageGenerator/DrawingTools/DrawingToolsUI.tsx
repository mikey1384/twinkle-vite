import React, { useRef } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import type { ToolType } from './types';
import { COMMON_COLORS } from './constants';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import { isMobile, isTablet } from '~/helpers';

const deviceIsMobile = isMobile(navigator) || isTablet(navigator);

interface DrawingToolsUIProps {
  tool: ToolType;
  setTool: (tool: ToolType) => void;
  color: string;
  onColorChange: (color: string, commit?: boolean) => void;
  lineWidth: number;
  setLineWidth: (w: number) => void;
  fontSize: number;
  setFontSize: (s: number) => void;
  disabled: boolean;
  recentColors: string[];
  onUndo: () => void;
  onRedo: () => void;
  canvasHistory: any[];
  redoHistory: any[];
  clearCanvas: () => void;
  isAddingText: boolean;
  textInput: string;
  setTextInput: (t: string) => void;
  addTextToCanvas: () => void;
  cancelTextInput: () => void;
  onReset?: () => void;
  zoomPercent?: number;
  onZoomChange?: (percent: number) => void;
}

export default function DrawingToolsUI({
  tool,
  setTool,
  color,
  onColorChange,
  lineWidth,
  setLineWidth,
  fontSize,
  setFontSize,
  disabled,
  recentColors,
  onUndo,
  onRedo,
  canvasHistory,
  redoHistory,
  clearCanvas,
  isAddingText,
  textInput,
  setTextInput,
  addTextToCanvas,
  cancelTextInput,
  onReset,
  zoomPercent = 100,
  onZoomChange
}: DrawingToolsUIProps) {
  const pickerActiveRef = useRef(false);

  return (
    <>
      <div
        className={css`
          display: flex;
          flex-direction: column;
          gap: 1rem;
        `}
      >
        <div
          className={css`
            display: flex;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.5rem;
            border: 1px solid var(--ui-border);
            border-radius: 8px;
            overflow-x: auto;
            position: sticky;
            top: 0;
            background: #fff;
            z-index: 10;
          `}
        >
          {[
            { value: 'pencil', icon: 'pencil-alt', label: 'Draw' },
            { value: 'eraser', icon: 'eraser', label: 'Erase' },
            { value: 'text', icon: 'font', label: 'Text' },
            { value: 'colorPicker', icon: 'eye-dropper', label: 'Pick' },
            { value: 'fill', icon: 'fill-drip', label: 'Fill' }
          ].map((toolOption) => (
            <Button
              key={toolOption.value}
              onClick={() => setTool(toolOption.value as ToolType)}
              disabled={disabled}
              color={tool === toolOption.value ? 'blue' : 'white'}
              variant="ghost"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.75rem',
                minWidth: '5rem',
                height: 'auto',
                fontSize: '0.85rem',
                fontWeight: 500
              }}
            >
              <Icon icon={toolOption.icon} size="lg" />
              <span>{toolOption.label}</span>
            </Button>
          ))}
        </div>

        <div
          className={css`
            display: flex;
            gap: 1rem;
            align-items: center;
            flex-wrap: wrap;
            padding: 1rem;
            border: 1px solid var(--ui-border);
            border-radius: 8px;
          `}
        >
          <div
            className={css`
              display: flex;
              flex-direction: column;
              gap: 0.75rem;
              min-width: 200px;
            `}
          >
            <label
              className={css`
                font-size: 0.85rem;
                font-weight: 600;
                color: ${Color.darkGray()};
                text-transform: uppercase;
                letter-spacing: 0.05em;
                text-align: center;
              `}
            >
              Color
            </label>
            <div
              className={css`
                display: flex;
                align-items: center;
                gap: 0.75rem;
                justify-content: center;
              `}
            >
              <div
                className={css`
                  position: relative;
                  width: 56px;
                  height: 56px;
                  border-radius: 8px;
                  border: 1px solid var(--ui-border);
                  overflow: hidden;
                `}
              >
                <input
                  type="color"
                  value={color}
                  onFocus={() => {
                    pickerActiveRef.current = true;
                  }}
                  onBlur={(e) => {
                    const v = (e.target as HTMLInputElement).value;
                    onColorChange(v, true);
                    pickerActiveRef.current = false;
                  }}
                  onChange={(e) => {
                    const v = (e.target as HTMLInputElement).value;
                    onColorChange(
                      v,
                      pickerActiveRef.current ? false : true
                    );
                  }}
                  onInput={(e) => {
                    const v = (e.target as HTMLInputElement).value;
                    onColorChange(v, false);
                  }}
                  disabled={disabled}
                  className={css`
                    width: 100%;
                    height: 100%;
                    border: none;
                    padding: 0;
                    cursor: pointer;
                    background: none;

                    &::-webkit-color-swatch-wrapper {
                      padding: 0;
                    }

                    &::-webkit-color-swatch {
                      border: none;
                    }
                  `}
                />
              </div>
              <div
                className={css`
                  font-size: 0.8rem;
                  color: ${Color.darkGray()};
                  font-weight: 500;
                `}
              >
                Custom
              </div>
            </div>
            <div
              className={css`
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
              `}
            >
              <div
                className={css`
                  font-size: 0.8rem;
                  font-weight: 500;
                  color: ${Color.darkGray()};
                  text-align: center;
                `}
              >
                Quick Colors
              </div>
              <div
                className={css`
                  display: flex;
                  gap: 0.5rem;
                  justify-content: center;
                  flex-wrap: wrap;
                `}
              >
                {COMMON_COLORS.map((commonColor) => (
                  <button
                    key={commonColor}
                    onClick={() => onColorChange(commonColor, true)}
                    disabled={disabled}
                    className={css`
                      width: 32px;
                      height: 32px;
                      border-radius: 4px;
                      border: 1px solid
                        ${color === commonColor
                          ? Color.logoBlue()
                          : 'var(--ui-border)'};
                      background: ${commonColor};
                      cursor: pointer;
                      position: relative;

                      ${commonColor === '#ffffff'
                        ? `box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1);`
                        : ''}

                      &:hover:not(:disabled) {
                        transform: scale(1.1);
                        border-color: ${Color.logoBlue()};
                      }

                      &:disabled {
                        opacity: 0.4;
                        cursor: not-allowed;
                      }
                    `}
                  />
                ))}
              </div>
            </div>
            {recentColors.length > 0 && (
              <div
                className={css`
                  display: flex;
                  flex-direction: column;
                  gap: 0.5rem;
                `}
              >
                <div
                  className={css`
                    font-size: 0.7rem;
                    font-weight: 500;
                    color: ${Color.darkGray()};
                    text-align: center;
                  `}
                >
                  Recent Colors
                </div>
                <div
                  className={css`
                    display: flex;
                    gap: 0.5rem;
                    justify-content: center;
                    flex-wrap: wrap;
                  `}
                >
                  {recentColors.map((recentColor, index) => (
                    <button
                      key={`${recentColor}-${index}`}
                      onClick={() => onColorChange(recentColor, true)}
                      disabled={disabled}
                      className={css`
                        width: 26px;
                        height: 26px;
                        border-radius: 4px;
                        border: 1px solid
                          ${color === recentColor
                            ? Color.logoBlue()
                            : 'var(--ui-border)'};
                        background: ${recentColor};
                        cursor: pointer;

                        &:hover:not(:disabled) {
                          transform: scale(1.15);
                          border-color: ${Color.logoBlue()};
                        }

                        &:disabled {
                          opacity: 0.4;
                          cursor: not-allowed;
                        }
                      `}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          <div
            className={css`
              display: flex;
              flex-direction: column;
              gap: 0.5rem;
              min-width: 120px;
            `}
          >
            <label
              className={css`
                font-size: 0.85rem;
                font-weight: 600;
                color: ${Color.darkGray()};
                text-transform: uppercase;
                letter-spacing: 0.05em;
                text-align: center;
              `}
            >
              Size
            </label>
            <div
              className={css`
                display: flex;
                align-items: center;
                gap: 0.75rem;
              `}
            >
              <input
                type="range"
                min="1"
                max="20"
                value={lineWidth}
                onChange={(e) => setLineWidth(Number(e.target.value))}
                disabled={disabled}
                className={css`
                  flex: 1;
                  height: 6px;
                  background: ${Color.logoBlue(0.3)};
                  border-radius: 2px;
                  outline: none;
                  cursor: pointer;
                  -webkit-appearance: none;

                  &::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 20px;
                    height: 20px;
                    background: ${Color.logoBlue()};
                    border-radius: 50%;
                    cursor: pointer;
                    transition: transform 0.1s ease;
                  }

                  &::-webkit-slider-thumb:hover {
                    transform: scale(1.2);
                  }
                `}
              />
              <span
                className={css`
                  font-size: 0.875rem;
                  font-weight: 600;
                  color: ${Color.darkGray()};
                  min-width: 2rem;
                  text-align: center;
                `}
              >
                {lineWidth}
              </span>
            </div>
          </div>
          {tool === 'text' && (
            <div
              className={css`
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                min-width: 100px;
              `}
            >
              <label
                className={css`
                  font-size: 0.75rem;
                  font-weight: 600;
                  color: ${Color.darkGray()};
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
                  text-align: center;
                `}
              >
                Font
              </label>
              <div
                className={css`
                  display: flex;
                  align-items: center;
                  gap: 0.75rem;
                `}
              >
                <input
                  type="range"
                  min="12"
                  max="72"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  disabled={disabled}
                  className={css`
                    flex: 1;
                    height: 6px;
                    background: ${Color.green(0.3)};
                    border-radius: 2px;
                    outline: none;
                    cursor: pointer;
                    -webkit-appearance: none;

                    &::-webkit-slider-thumb {
                      -webkit-appearance: none;
                      width: 20px;
                      height: 20px;
                      background: ${Color.green()};
                      border-radius: 50%;
                      cursor: pointer;
                      transition: transform 0.1s ease;
                    }

                    &::-webkit-slider-thumb:hover {
                      transform: scale(1.2);
                    }
                  `}
                />
                <span
                  className={css`
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: ${Color.darkGray()};
                    min-width: 2rem;
                    text-align: center;
                  `}
                >
                  {fontSize}
                </span>
              </div>
            </div>
          )}
          {onZoomChange && (
            <div
              className={css`
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                min-width: 100px;
              `}
            >
              <label
                className={css`
                  font-size: 0.85rem;
                  font-weight: 600;
                  color: ${Color.darkGray()};
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
                  text-align: center;
                `}
              >
                Zoom
              </label>
              <div
                className={css`
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
                  justify-content: center;
                `}
              >
                <button
                  onClick={() =>
                    onZoomChange(Math.max(25, zoomPercent - 25))
                  }
                  disabled={disabled || zoomPercent <= 25}
                  className={css`
                    width: 28px;
                    height: 28px;
                    border-radius: 4px;
                    border: 1px solid var(--ui-border);
                    background: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1rem;
                    font-weight: 600;
                    color: ${Color.darkGray()};

                    &:hover:not(:disabled) {
                      background: ${Color.highlightGray()};
                    }

                    &:disabled {
                      opacity: 0.4;
                      cursor: not-allowed;
                    }
                  `}
                >
                  <Icon icon="minus" size="sm" />
                </button>
                <span
                  className={css`
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: ${Color.darkGray()};
                    min-width: 3rem;
                    text-align: center;
                  `}
                >
                  {zoomPercent}%
                </span>
                <button
                  onClick={() =>
                    onZoomChange(Math.min(deviceIsMobile ? 100 : 400, zoomPercent + 25))
                  }
                  disabled={disabled || zoomPercent >= (deviceIsMobile ? 100 : 400)}
                  className={css`
                    width: 28px;
                    height: 28px;
                    border-radius: 4px;
                    border: 1px solid var(--ui-border);
                    background: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1rem;
                    font-weight: 600;
                    color: ${Color.darkGray()};

                    &:hover:not(:disabled) {
                      background: ${Color.highlightGray()};
                    }

                    &:disabled {
                      opacity: 0.4;
                      cursor: not-allowed;
                    }
                  `}
                >
                  <Icon icon="plus" size="sm" />
                </button>
              </div>
            </div>
          )}
          <div
            className={css`
              display: flex;
              flex-direction: column;
              gap: 0.5rem;
              margin-left: auto;
            `}
          >
            <div
              className={css`
                display: flex;
                gap: 0.5rem;
              `}
            >
              <Button
                onClick={onUndo}
                disabled={disabled || canvasHistory.length === 0}
                color="darkBlue"
                style={{ padding: '0.75rem 1.25rem' }}
              >
                <Icon icon="undo" />
                <span style={{ marginLeft: '0.5rem' }}>Undo</span>
              </Button>
              <Button
                onClick={onRedo}
                disabled={disabled || !redoHistory || redoHistory.length === 0}
                color="darkBlue"
                style={{ padding: '0.75rem 1.25rem' }}
              >
                <Icon icon="redo" />
                <span style={{ marginLeft: '0.5rem' }}>Redo</span>
              </Button>
              <Button
                onClick={clearCanvas}
                disabled={disabled}
                color="darkGray"
                style={{ padding: '0.75rem 1.25rem' }}
              >
                <Icon icon="trash-alt" />
                <span style={{ marginLeft: '0.5rem' }}>Clear</span>
              </Button>
            </div>
            {onReset && (
              <div
                className={css`
                  display: flex;
                  justify-content: flex-end;
                `}
              >
                <Button
                  onClick={onReset}
                  disabled={disabled}
                  color="orange"
                  style={{ padding: '0.75rem 1.25rem' }}
                >
                  <Icon icon="undo" />
                  <span style={{ marginLeft: '0.5rem' }}>Reset</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      {isAddingText && (
        <div
          className={css`
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 1px solid var(--ui-border);
            border-radius: 8px;
            padding: 1.5rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            z-index: 1001;
            min-width: 320px;
          `}
        >
          <div
            className={css`
              margin-bottom: 1rem;
              font-weight: 600;
              color: ${Color.darkGray()};
              font-size: 1.1rem;
            `}
          >
            Add Text
          </div>
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Enter text..."
            autoFocus
            className={css`
              width: 100%;
              padding: 0.75rem;
              border: 1px solid var(--ui-border);
              border-radius: 8px;
              margin-bottom: 1.5rem;
              font-size: 1rem;
              outline: none;

              &:focus {
                border-color: ${Color.logoBlue()};
              }
            `}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addTextToCanvas();
              else if (e.key === 'Escape') cancelTextInput();
            }}
          />
          <div
            className={css`
              margin-bottom: 1.5rem;
            `}
          >
            <div
              className={css`
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.5rem;
              `}
            >
              <label
                className={css`
                  font-size: 0.875rem;
                  font-weight: 500;
                  color: ${Color.darkGray()};
                `}
              >
                Font Size
              </label>
              <span
                className={css`
                  font-size: 0.875rem;
                  font-weight: 600;
                  color: ${Color.darkGray()};
                  min-width: 2rem;
                  text-align: center;
                `}
              >
                {fontSize}px
              </span>
            </div>
            <input
              type="range"
              min="12"
              max="72"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className={css`
                width: 100%;
                height: 6px;
                background: ${Color.green(0.3)};
                border-radius: 2px;
                outline: none;
                cursor: pointer;
                -webkit-appearance: none;

                &::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  width: 20px;
                  height: 20px;
                  background: ${Color.green()};
                  border-radius: 50%;
                  cursor: pointer;
                  transition: transform 0.1s ease;
                }

                &::-webkit-slider-thumb:hover {
                  transform: scale(1.2);
                }
              `}
            />
          </div>
          <div
            className={css`
              display: flex;
              gap: 0.5rem;
              justify-content: flex-end;
            `}
          >
            <Button onClick={cancelTextInput} variant="ghost">
              Cancel
            </Button>
            <Button
              onClick={addTextToCanvas}
              disabled={!textInput.trim()}
              color="blue"
            >
              Add Text
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

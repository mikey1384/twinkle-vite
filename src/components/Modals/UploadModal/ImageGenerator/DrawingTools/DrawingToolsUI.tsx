import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import type { ToolType } from './types';
import { COMMON_COLORS } from './constants';

interface DrawingToolsUIProps {
  tool: ToolType;
  setTool: (tool: ToolType) => void;
  color: string;
  handleColorChange: (color: string) => void;
  lineWidth: number;
  setLineWidth: (w: number) => void;
  fontSize: number;
  setFontSize: (s: number) => void;
  disabled: boolean;
  recentColors: string[];
  handleUndo: () => void;
  canvasHistory: any[];
  clearCanvas: () => void;
  isAddingText: boolean;
  textInput: string;
  setTextInput: (t: string) => void;
  addTextToCanvas: () => void;
  cancelTextInput: () => void;
}

export default function DrawingToolsUI({
  tool,
  setTool,
  color,
  handleColorChange,
  lineWidth,
  setLineWidth,
  fontSize,
  setFontSize,
  disabled,
  recentColors,
  handleUndo,
  canvasHistory,
  clearCanvas,
  isAddingText,
  textInput,
  setTextInput,
  addTextToCanvas,
  cancelTextInput
}: DrawingToolsUIProps) {
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
            gap: 0.5rem;
            padding: 0.75rem;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border: 1px solid ${Color.borderGray()};
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          `}
        >
          {[
            { value: 'pencil', icon: '✏️', label: 'Draw' },
            { value: 'eraser', icon: '🧽', label: 'Erase' },
            { value: 'text', icon: '📝', label: 'Text' },
            { value: 'colorPicker', icon: '🎨', label: 'Pick' },
            { value: 'fill', icon: '🪣', label: 'Fill' }
          ].map((toolOption) => (
            <button
              key={toolOption.value}
              onClick={() => setTool(toolOption.value as ToolType)}
              disabled={disabled}
              className={css`
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.25rem;
                padding: 0.75rem 0.5rem;
                min-width: 4rem;
                background: ${tool === toolOption.value
                  ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                  : 'transparent'};
                color: ${tool === toolOption.value
                  ? 'white'
                  : Color.darkGray()};
                border: 2px solid
                  ${tool === toolOption.value ? '#3b82f6' : 'transparent'};
                border-radius: 8px;
                cursor: pointer;
                font-size: 0.75rem;
                font-weight: 500;
                transition: all 0.2s ease;

                &:hover:not(:disabled) {
                  background: ${tool === toolOption.value
                    ? 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)'
                    : 'rgba(59, 130, 246, 0.1)'};
                  border-color: ${tool === toolOption.value
                    ? '#2563eb'
                    : '#3b82f6'};
                  transform: translateY(-1px);
                  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
                }

                &:disabled {
                  opacity: 0.4;
                  cursor: not-allowed;
                }

                .emoji {
                  font-size: 1.25rem;
                  line-height: 1;
                }
              `}
            >
              <span className="emoji">{toolOption.icon}</span>
              <span>{toolOption.label}</span>
            </button>
          ))}
        </div>

        <div
          className={css`
            display: flex;
            gap: 1rem;
            align-items: center;
            flex-wrap: wrap;
            padding: 1rem;
            background: white;
            border: 1px solid ${Color.borderGray()};
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
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
                font-size: 0.75rem;
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
                  width: 48px;
                  height: 48px;
                  border-radius: 12px;
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                  transition: transform 0.2s ease;

                  &:hover {
                    transform: scale(1.05);
                  }
                `}
              >
                <input
                  type="color"
                  value={color}
                  onChange={(e) => handleColorChange(e.target.value)}
                  disabled={disabled}
                  className={css`
                    width: 100%;
                    height: 100%;
                    border: none;
                    border-radius: 12px;
                    cursor: pointer;

                    &::-webkit-color-swatch-wrapper {
                      padding: 0;
                      border-radius: 12px;
                    }

                    &::-webkit-color-swatch {
                      border: none;
                      border-radius: 12px;
                    }
                  `}
                />
              </div>
              <div
                className={css`
                  font-size: 0.75rem;
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
                  font-size: 0.7rem;
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
                    onClick={() => handleColorChange(commonColor)}
                    disabled={disabled}
                    className={css`
                      width: 28px;
                      height: 28px;
                      border-radius: 8px;
                      border: 2px solid
                        ${color === commonColor ? '#3b82f6' : 'transparent'};
                      background: ${commonColor};
                      cursor: pointer;
                      transition: all 0.2s ease;
                      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
                      position: relative;

                      ${commonColor === '#ffffff'
                        ? `box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(0, 0, 0, 0.1);`
                        : ''}

                      &:hover:not(:disabled) {
                        transform: scale(1.1);
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                        border-color: #3b82f6;
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
                      onClick={() => handleColorChange(recentColor)}
                      disabled={disabled}
                      className={css`
                        width: 24px;
                        height: 24px;
                        border-radius: 6px;
                        border: 2px solid
                          ${color === recentColor ? '#3b82f6' : 'transparent'};
                        background: ${recentColor};
                        cursor: pointer;
                        transition: all 0.2s ease;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

                        &:hover:not(:disabled) {
                          transform: scale(1.15);
                          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
                          border-color: #3b82f6;
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
                font-size: 0.75rem;
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
                  background: linear-gradient(
                    to right,
                    #e2e8f0 0%,
                    #3b82f6 100%
                  );
                  border-radius: 3px;
                  outline: none;
                  cursor: pointer;

                  &::-webkit-slider-thumb {
                    appearance: none;
                    width: 18px;
                    height: 18px;
                    background: linear-gradient(
                      135deg,
                      #3b82f6 0%,
                      #1d4ed8 100%
                    );
                    border-radius: 50%;
                    cursor: pointer;
                    box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
                    transition: all 0.2s ease;
                  }

                  &::-webkit-slider-thumb:hover {
                    transform: scale(1.1);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
                  }

                  &::-moz-range-thumb {
                    width: 18px;
                    height: 18px;
                    background: linear-gradient(
                      135deg,
                      #3b82f6 0%,
                      #1d4ed8 100%
                    );
                    border-radius: 50%;
                    cursor: pointer;
                    border: none;
                    box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
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
                    background: linear-gradient(
                      to right,
                      #e2e8f0 0%,
                      #10b981 100%
                    );
                    border-radius: 3px;
                    outline: none;
                    cursor: pointer;

                    &::-webkit-slider-thumb {
                      appearance: none;
                      width: 18px;
                      height: 18px;
                      background: linear-gradient(
                        135deg,
                        #10b981 0%,
                        #059669 100%
                      );
                      border-radius: 50%;
                      cursor: pointer;
                      box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
                      transition: all 0.2s ease;
                    }

                    &::-webkit-slider-thumb:hover {
                      transform: scale(1.1);
                      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
                    }

                    &::-moz-range-thumb {
                      width: 18px;
                      height: 18px;
                      background: linear-gradient(
                        135deg,
                        #10b981 0%,
                        #059669 100%
                      );
                      border-radius: 50%;
                      cursor: pointer;
                      border: none;
                      box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
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
          <div
            className={css`
              display: flex;
              gap: 0.5rem;
              margin-left: auto;
            `}
          >
            <button
              onClick={handleUndo}
              disabled={disabled || canvasHistory.length === 0}
              className={css`
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.75rem 1rem;
                background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                font-size: 0.875rem;
                transition: all 0.2s ease;
                box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);

                &:hover:not(:disabled) {
                  background: linear-gradient(135deg, #5b21b6 0%, #4c1d95 100%);
                  transform: translateY(-1px);
                  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
                }

                &:disabled {
                  opacity: 0.4;
                  cursor: not-allowed;
                  transform: none;
                  box-shadow: none;
                }
              `}
            >
              <span>↶</span>
              Undo
            </button>
            <button
              onClick={clearCanvas}
              disabled={disabled}
              className={css`
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.75rem 1rem;
                background: linear-gradient(135deg, #64748b 0%, #475569 100%);
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                font-size: 0.875rem;
                transition: all 0.2s ease;
                box-shadow: 0 2px 8px rgba(100, 116, 139, 0.2);

                &:hover:not(:disabled) {
                  background: linear-gradient(135deg, #475569 0%, #334155 100%);
                  transform: translateY(-1px);
                  box-shadow: 0 4px 16px rgba(100, 116, 139, 0.3);
                }

                &:disabled {
                  opacity: 0.4;
                  cursor: not-allowed;
                  transform: none;
                  box-shadow: none;
                }
              `}
            >
              <span>🗑️</span>
              Clear
            </button>
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
            border: 2px solid ${Color.borderGray()};
            border-radius: 8px;
            padding: 1rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1001;
            min-width: 300px;
          `}
        >
          <div
            className={css`
              margin-bottom: 0.5rem;
              font-weight: 500;
              color: ${Color.darkGray()};
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
              padding: 0.5rem;
              border: 1px solid ${Color.borderGray()};
              border-radius: 4px;
              margin-bottom: 1rem;
              font-size: 1rem;
            `}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addTextToCanvas();
              else if (e.key === 'Escape') cancelTextInput();
            }}
          />
          <div
            className={css`
              margin-bottom: 1rem;
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
                background: linear-gradient(to right, #e2e8f0 0%, #10b981 100%);
                border-radius: 3px;
                outline: none;
                cursor: pointer;

                &::-webkit-slider-thumb {
                  appearance: none;
                  width: 18px;
                  height: 18px;
                  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                  border-radius: 50%;
                  cursor: pointer;
                  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
                  transition: all 0.2s ease;
                }

                &::-webkit-slider-thumb:hover {
                  transform: scale(1.1);
                  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
                }

                &::-moz-range-thumb {
                  width: 18px;
                  height: 18px;
                  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                  border-radius: 50%;
                  cursor: pointer;
                  border: none;
                  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
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
            <button
              onClick={cancelTextInput}
              className={css`
                background: transparent;
                color: ${Color.darkGray()};
                border: 1px solid ${Color.borderGray()};
                padding: 0.5rem 1rem;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.9rem;

                &:hover {
                  background: ${Color.highlightGray()};
                }
              `}
            >
              Cancel
            </button>
            <button
              onClick={addTextToCanvas}
              disabled={!textInput.trim()}
              className={css`
                background: ${Color.logoBlue()};
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.9rem;

                &:hover:not(:disabled) {
                  background: ${Color.logoBlue(0.8)};
                }

                &:disabled {
                  opacity: 0.5;
                  cursor: not-allowed;
                }
              `}
            >
              Add Text
            </button>
          </div>
        </div>
      )}
    </>
  );
}

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

export type ToolType = 'pencil' | 'eraser' | 'text' | 'colorPicker' | 'fill';

interface DrawingToolsProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  originalCanvasRef?: React.RefObject<HTMLCanvasElement>;
  disabled?: boolean;
  onHasContent?: (hasContent: boolean) => void;
  applyTemperatureToCanvas?: () => void;
  getCanvasCoordinates?: (e: React.MouseEvent) => { x: number; y: number };
}

export default function DrawingTools({
  canvasRef,
  originalCanvasRef,
  disabled = false,
  onHasContent,
  applyTemperatureToCanvas,
  getCanvasCoordinates
}: DrawingToolsProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ff0000');
  const [lineWidth, setLineWidth] = useState(3);
  const [tool, setTool] = useState<ToolType>('pencil');
  const [fontSize, setFontSize] = useState(20);
  const [canvasHistory, setCanvasHistory] = useState<ImageData[]>([]);
  const [isAddingText, setIsAddingText] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null);

  const saveToHistory = useCallback(() => {
    const canvas = originalCanvasRef?.current || canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setCanvasHistory(prev => {
      const newHistory = [...prev, imageData];
      // Keep only last 10 states to manage memory
      return newHistory.slice(-10);
    });
  }, [canvasRef, originalCanvasRef]);

  const floodFill = useCallback((startX: number, startY: number, fillColor: string) => {
    const canvas = originalCanvasRef?.current || canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    // Convert fill color to RGB
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    tempCtx.fillStyle = fillColor;
    tempCtx.fillRect(0, 0, 1, 1);
    const fillData = tempCtx.getImageData(0, 0, 1, 1).data;
    const fillR = fillData[0];
    const fillG = fillData[1];
    const fillB = fillData[2];

    const startIndex = (startY * width + startX) * 4;
    const targetR = data[startIndex];
    const targetG = data[startIndex + 1];
    const targetB = data[startIndex + 2];
    const targetA = data[startIndex + 3];

    // Don't fill if target color is the same as fill color
    if (targetR === fillR && targetG === fillG && targetB === fillB) return;

    const pixelsToCheck = [startX, startY];

    while (pixelsToCheck.length > 0) {
      const y = pixelsToCheck.pop()!;
      const x = pixelsToCheck.pop()!;

      if (x < 0 || x >= width || y < 0 || y >= height) continue;

      const currentIndex = (y * width + x) * 4;
      const currentR = data[currentIndex];
      const currentG = data[currentIndex + 1];
      const currentB = data[currentIndex + 2];
      const currentA = data[currentIndex + 3];

      // Check if current pixel matches target color
      if (currentR === targetR && currentG === targetG && currentB === targetB && currentA === targetA) {
        // Fill this pixel
        data[currentIndex] = fillR;
        data[currentIndex + 1] = fillG;
        data[currentIndex + 2] = fillB;
        data[currentIndex + 3] = 255;

        // Add neighboring pixels to check
        pixelsToCheck.push(x + 1, y);
        pixelsToCheck.push(x - 1, y);
        pixelsToCheck.push(x, y + 1);
        pixelsToCheck.push(x, y - 1);
      }
    }

    ctx.putImageData(imageData, 0, 0);
    applyTemperatureToCanvas?.();
    checkAndNotifyContent();
  }, [canvasRef, originalCanvasRef, applyTemperatureToCanvas]);

  const defaultGetCanvasCoordinates = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const pickColor = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoordinates ? getCanvasCoordinates(e) : defaultGetCanvasCoordinates(e);
    const imageData = ctx.getImageData(coords.x, coords.y, 1, 1);
    const [r, g, b] = imageData.data;
    
    // Convert RGB to hex
    const hexColor = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    setColor(hexColor);
    setTool('pencil'); // Switch back to pencil after picking color
  };

  const addTextToCanvas = () => {
    if (!textInput.trim() || !textPosition) return;
    
    const canvas = originalCanvasRef?.current || canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save state before adding text
    saveToHistory();

    // Add text to canvas
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'top';
    ctx.fillText(textInput, textPosition.x, textPosition.y);

    applyTemperatureToCanvas?.();
    checkAndNotifyContent();

    // Reset text state
    setTextInput('');
    setTextPosition(null);
    setIsAddingText(false);
    setTool('pencil');
  };

  const cancelTextInput = () => {
    setTextInput('');
    setTextPosition(null);
    setIsAddingText(false);
    setTool('pencil');
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (disabled) return;

    if (tool === 'colorPicker') {
      pickColor(e);
      return;
    }
    
    if (tool === 'text') {
      const coords = getCanvasCoordinates ? getCanvasCoordinates(e) : defaultGetCanvasCoordinates(e);
      setTextPosition(coords);
      setIsAddingText(true);
      return;
    }

    if (tool === 'fill') {
      saveToHistory();
      const coords = getCanvasCoordinates ? getCanvasCoordinates(e) : defaultGetCanvasCoordinates(e);
      floodFill(Math.floor(coords.x), Math.floor(coords.y), color);
      return;
    }
    
    // Regular drawing tools
    startDrawing(e);
  };

  const startDrawing = (e: React.MouseEvent) => {
    if (disabled) return;
    
    const canvas = originalCanvasRef?.current || canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save state before starting to draw
    saveToHistory();
    const coords = getCanvasCoordinates ? getCanvasCoordinates(e) : defaultGetCanvasCoordinates(e);
    
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || disabled || tool === 'text' || tool === 'colorPicker' || tool === 'fill') return;
    
    const canvas = originalCanvasRef?.current || canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoordinates ? getCanvasCoordinates(e) : defaultGetCanvasCoordinates(e);

    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = color;
    ctx.lineWidth = tool === 'eraser' ? lineWidth * 3 : lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    applyTemperatureToCanvas?.();
  };

  const stopDrawing = () => {
    if (disabled) return;
    setIsDrawing(false);
    checkAndNotifyContent();
  };

  const checkAndNotifyContent = () => {
    const canvas = originalCanvasRef?.current || canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Check if any pixel is not white (for DrawingCanvas) or has any content
    let hasContent = false;
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a > 0) {
        // If there's any non-transparent pixel, there's content
        hasContent = true;
        break;
      }
    }
    
    onHasContent?.(hasContent);
  };

  const handleUndo = () => {
    if (canvasHistory.length === 0) return;

    const canvas = originalCanvasRef?.current || canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get the last state from history
    const previousState = canvasHistory[canvasHistory.length - 1];
    
    // Remove it from history
    setCanvasHistory(prev => prev.slice(0, -1));
    
    // Restore the previous state
    ctx.putImageData(previousState, 0, 0);
    
    applyTemperatureToCanvas?.();
    checkAndNotifyContent();
  };

  const clearCanvas = () => {
    const canvas = originalCanvasRef?.current || canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    setCanvasHistory([]);
    applyTemperatureToCanvas?.();
    onHasContent?.(false);
  };

  // Export the handlers and state for parent components to use
  const toolsAPI = {
    handleCanvasClick,
    draw,
    stopDrawing,
    color,
    tool,
    lineWidth,
    fontSize,
    canvasHistory,
    isAddingText,
    textInput,
    setTextInput,
    addTextToCanvas,
    cancelTextInput,
    handleUndo,
    clearCanvas
  };

  return {
    toolsAPI,
    toolsUI: (
      <>
        <div
          className={css`
            display: flex;
            gap: 1rem;
            align-items: center;
            flex-wrap: wrap;
            padding: 0.5rem;
            background: ${Color.highlightGray()};
            border-radius: 8px;
          `}
        >
          <div
            className={css`
              display: flex;
              align-items: center;
              gap: 0.5rem;
            `}
          >
            <label>Tool:</label>
            <select
              value={tool}
              onChange={(e) => setTool(e.target.value as ToolType)}
              disabled={disabled}
              className={css`
                padding: 0.25rem 0.5rem;
                border: 1px solid ${Color.borderGray()};
                border-radius: 4px;
              `}
            >
              <option value="pencil">Pencil</option>
              <option value="eraser">Eraser</option>
              <option value="text">Text</option>
              <option value="colorPicker">Color Picker</option>
              <option value="fill">Fill</option>
            </select>
          </div>

          <div
            className={css`
              display: flex;
              align-items: center;
              gap: 0.5rem;
            `}
          >
            <label>Color:</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              disabled={disabled}
              className={css`
                width: 32px;
                height: 32px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
              `}
            />
          </div>

          <div
            className={css`
              display: flex;
              align-items: center;
              gap: 0.5rem;
            `}
          >
            <label>Size:</label>
            <input
              type="range"
              min="1"
              max="20"
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              disabled={disabled}
              className={css`
                width: 100px;
              `}
            />
            <span>{lineWidth}px</span>
          </div>

          {tool === 'text' && (
            <div
              className={css`
                display: flex;
                align-items: center;
                gap: 0.5rem;
              `}
            >
              <label>Font Size:</label>
              <input
                type="range"
                min="12"
                max="72"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                disabled={disabled}
                className={css`
                  width: 80px;
                `}
              />
              <span>{fontSize}px</span>
            </div>
          )}

          <button
            onClick={handleUndo}
            disabled={disabled || canvasHistory.length === 0}
            className={css`
              background: ${Color.logoBlue()};
              color: white;
              border: none;
              padding: 0.5rem 1rem;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 500;

              &:hover:not(:disabled) {
                background: ${Color.logoBlue(0.8)};
              }

              &:disabled {
                opacity: 0.5;
                cursor: not-allowed;
              }
            `}
          >
            Undo
          </button>

          <button
            onClick={clearCanvas}
            disabled={disabled}
            className={css`
              background: ${Color.orange()};
              color: white;
              border: none;
              padding: 0.5rem 1rem;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 500;

              &:hover:not(:disabled) {
                background: ${Color.orange(0.8)};
              }

              &:disabled {
                opacity: 0.5;
                cursor: not-allowed;
              }
            `}
          >
            Clear
          </button>
        </div>

        {/* Text input modal */}
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
                if (e.key === 'Enter') {
                  addTextToCanvas();
                } else if (e.key === 'Escape') {
                  cancelTextInput();
                }
              }}
            />
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
    )
  };
}
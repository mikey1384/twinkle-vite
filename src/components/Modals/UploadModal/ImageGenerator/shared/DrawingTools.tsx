import React, { useRef, useState, useCallback } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

export type ToolType = 'pencil' | 'eraser' | 'text' | 'colorPicker' | 'fill';

// Common colors for quick access
const COMMON_COLORS = [
  '#000000',
  '#ffffff',
  '#ff0000',
  '#00ff00',
  '#0000ff',
  '#ffff00'
];

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
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);
  const [tool, setTool] = useState<ToolType>('pencil');
  const [fontSize, setFontSize] = useState(20);
  const [canvasHistory, setCanvasHistory] = useState<ImageData[]>([]);
  const [isAddingText, setIsAddingText] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [textElements, setTextElements] = useState<
    Array<{
      id: string;
      text: string;
      x: number;
      y: number;
      fontSize: number;
      color: string;
    }>
  >([]);
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [draggedTextId, setDraggedTextId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0
  });
  const [recentColors, setRecentColors] = useState<string[]>([]);

  const addToRecentColors = useCallback((newColor: string) => {
    setRecentColors((prev) => {
      // Don't add if it's already the current color or in common colors
      if (prev[0] === newColor || COMMON_COLORS.includes(newColor)) return prev;

      // Remove the color if it's already in the list
      const filtered = prev.filter((c) => c !== newColor);

      // Add to front and keep only 6 most recent
      return [newColor, ...filtered].slice(0, 6);
    });
  }, []);

  const handleColorChange = useCallback(
    (newColor: string) => {
      setColor(newColor);
      addToRecentColors(newColor);
    },
    [addToRecentColors]
  );

  const checkAndNotifyContent = useCallback(() => {
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
  }, [canvasRef, originalCanvasRef, onHasContent]);

  const saveToHistory = useCallback(() => {
    const canvas = originalCanvasRef?.current || canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setCanvasHistory((prev) => {
      const newHistory = [...prev, imageData];
      // Keep only last 10 states to manage memory
      return newHistory.slice(-10);
    });
  }, [canvasRef, originalCanvasRef]);

  const floodFill = useCallback(
    (startX: number, startY: number, fillColor: string) => {
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
        if (
          currentR === targetR &&
          currentG === targetG &&
          currentB === targetB &&
          currentA === targetA
        ) {
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
    },
    [
      canvasRef,
      originalCanvasRef,
      applyTemperatureToCanvas,
      checkAndNotifyContent
    ]
  );

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

  const getTouchCoordinates = (touch: React.Touch) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY
    };
  };

  const pickColor = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoordinates
      ? getCanvasCoordinates(e)
      : defaultGetCanvasCoordinates(e);
    const imageData = ctx.getImageData(coords.x, coords.y, 1, 1);
    const [r, g, b] = imageData.data;

    // Convert RGB to hex
    const hexColor = `#${((1 << 24) + (r << 16) + (g << 8) + b)
      .toString(16)
      .slice(1)}`;
    handleColorChange(hexColor);
    setTool('pencil'); // Switch to pencil after picking color (makes sense for color picker)
  };

  const renderAllText = useCallback(() => {
    const canvas = originalCanvasRef?.current || canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and redraw all text elements
    textElements.forEach((element) => {
      ctx.font = `${element.fontSize}px Arial`;
      ctx.fillStyle = element.color;
      ctx.textBaseline = 'top';
      ctx.fillText(element.text, element.x, element.y);
    });
  }, [textElements, canvasRef, originalCanvasRef]);

  const addTextToCanvas = () => {
    if (!textInput.trim() || !textPosition) return;

    const canvas = originalCanvasRef?.current || canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save state before adding text
    saveToHistory();

    // Add text element to our list
    const newTextElement = {
      id: `text-${Date.now()}-${Math.random()}`,
      text: textInput,
      x: textPosition.x,
      y: textPosition.y,
      fontSize: fontSize,
      color: color
    };

    // Immediately render the new text on canvas
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'top';
    ctx.fillText(textInput, textPosition.x, textPosition.y);

    setTextElements((prev) => [...prev, newTextElement]);

    // Save base content after adding text (for future dragging operations)
    requestAnimationFrame(() => {
      saveBaseContent();
    });

    applyTemperatureToCanvas?.();
    checkAndNotifyContent();

    // Reset text state but keep text tool selected
    setTextInput('');
    setTextPosition(null);
    setIsAddingText(false);
    // Don't switch away from text tool - user might want to add more text
  };

  const cancelTextInput = () => {
    setTextInput('');
    setTextPosition(null);
    setIsAddingText(false);
    // Keep text tool selected when canceling - user might try again
  };

  const getTextElementAtPosition = (x: number, y: number) => {
    const canvas = originalCanvasRef?.current || canvasRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Check text elements in reverse order (most recent first)
    for (let i = textElements.length - 1; i >= 0; i--) {
      const element = textElements[i];
      ctx.font = `${element.fontSize}px Arial`;
      ctx.textBaseline = 'top';

      const textMetrics = ctx.measureText(element.text);
      const textWidth = textMetrics.width;
      const textHeight = element.fontSize; // Approximate height

      // Check if click is within text bounds
      if (
        x >= element.x &&
        x <= element.x + textWidth &&
        y >= element.y &&
        y <= element.y + textHeight
      ) {
        return element;
      }
    }
    return null;
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (disabled) return;

    const coords = getCanvasCoordinates
      ? getCanvasCoordinates(e)
      : defaultGetCanvasCoordinates(e);

    if (tool === 'colorPicker') {
      pickColor(e);
      return;
    }

    if (tool === 'text') {
      // Check if clicking on existing text to drag it
      const clickedText = getTextElementAtPosition(coords.x, coords.y);
      if (clickedText) {
        // Save base content before starting to drag
        saveBaseContent();

        // Start dragging existing text
        setIsDraggingText(true);
        setDraggedTextId(clickedText.id);
        setDragOffset({
          x: coords.x - clickedText.x,
          y: coords.y - clickedText.y
        });
        return;
      }

      // Otherwise, add new text
      setTextPosition(coords);
      setIsAddingText(true);
      return;
    }

    if (tool === 'fill') {
      saveToHistory();
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
    const coords = getCanvasCoordinates
      ? getCanvasCoordinates(e)
      : defaultGetCanvasCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent) => {
    if (disabled) return;

    // Handle text dragging
    if (isDraggingText && draggedTextId) {
      const coords = getCanvasCoordinates
        ? getCanvasCoordinates(e)
        : defaultGetCanvasCoordinates(e);

      // Update the text element position
      setTextElements((prev) =>
        prev.map((element) =>
          element.id === draggedTextId
            ? {
                ...element,
                x: coords.x - dragOffset.x,
                y: coords.y - dragOffset.y
              }
            : element
        )
      );

      // Immediately redraw canvas to show the text movement
      requestAnimationFrame(() => {
        redrawCanvas();
      });
      return;
    }

    // Regular drawing
    if (
      !isDrawing ||
      tool === 'text' ||
      tool === 'colorPicker' ||
      tool === 'fill'
    )
      return;

    const canvas = originalCanvasRef?.current || canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoordinates
      ? getCanvasCoordinates(e)
      : defaultGetCanvasCoordinates(e);

    ctx.globalCompositeOperation =
      tool === 'eraser' ? 'destination-out' : 'source-over';
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

    // Stop text dragging
    if (isDraggingText) {
      setIsDraggingText(false);
      setDraggedTextId(null);
      setDragOffset({ x: 0, y: 0 });
      // Redraw canvas with new text positions
      redrawCanvas();
      return;
    }

    setIsDrawing(false);
    checkAndNotifyContent();
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;

    e.preventDefault(); // Prevent scrolling and other touch behaviors
    const touch = e.touches[0];
    const coords = getTouchCoordinates(touch);

    if (tool === 'colorPicker') {
      pickColorAtCoords(coords);
      return;
    }

    if (tool === 'text') {
      // Check if touching existing text to drag it
      const clickedText = getTextElementAtPosition(coords.x, coords.y);
      if (clickedText) {
        // Save base content before starting to drag
        saveBaseContent();

        // Start dragging existing text
        setIsDraggingText(true);
        setDraggedTextId(clickedText.id);
        setDragOffset({
          x: coords.x - clickedText.x,
          y: coords.y - clickedText.y
        });
        return;
      }

      // Otherwise, add new text
      setTextPosition(coords);
      setIsAddingText(true);
      return;
    }

    if (tool === 'fill') {
      saveToHistory();
      floodFill(Math.floor(coords.x), Math.floor(coords.y), color);
      return;
    }

    // Regular drawing tools
    startDrawingAtCoords(coords);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled) return;

    e.preventDefault(); // Prevent scrolling
    const touch = e.touches[0];
    const coords = getTouchCoordinates(touch);

    // Handle text dragging
    if (isDraggingText && draggedTextId) {
      setTextElements((prev) =>
        prev.map((element) =>
          element.id === draggedTextId
            ? {
                ...element,
                x: coords.x - dragOffset.x,
                y: coords.y - dragOffset.y
              }
            : element
        )
      );

      // Immediately redraw canvas to show the text movement
      requestAnimationFrame(() => {
        redrawCanvas();
      });
      return;
    }

    // Regular drawing
    if (
      !isDrawing ||
      tool === 'text' ||
      tool === 'colorPicker' ||
      tool === 'fill'
    )
      return;

    drawAtCoords(coords);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (disabled) return;

    e.preventDefault();
    stopDrawing();
  };

  // Helper functions for touch and mouse consistency
  const pickColorAtCoords = (coords: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(coords.x, coords.y, 1, 1);
    const [r, g, b] = imageData.data;

    const hexColor = `#${((1 << 24) + (r << 16) + (g << 8) + b)
      .toString(16)
      .slice(1)}`;
    handleColorChange(hexColor);
    setTool('pencil');
  };

  const startDrawingAtCoords = (coords: { x: number; y: number }) => {
    const canvas = originalCanvasRef?.current || canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    saveToHistory();
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const drawAtCoords = (coords: { x: number; y: number }) => {
    const canvas = originalCanvasRef?.current || canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation =
      tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = color;
    ctx.lineWidth = tool === 'eraser' ? lineWidth * 3 : lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    applyTemperatureToCanvas?.();
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
    setCanvasHistory((prev) => prev.slice(0, -1));

    // Restore the previous state
    ctx.putImageData(previousState, 0, 0);

    // Also remove the last text element if it was added
    if (textElements.length > 0) {
      setTextElements((prev) => prev.slice(0, -1));
    }

    applyTemperatureToCanvas?.();
    checkAndNotifyContent();
  };

  // Store base content (without text) for redrawing
  const baseContentRef = useRef<ImageData | null>(null);

  const saveBaseContent = useCallback(() => {
    const canvas = originalCanvasRef?.current || canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    baseContentRef.current = ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );
  }, [canvasRef, originalCanvasRef]);

  const redrawCanvas = useCallback(() => {
    const canvas = originalCanvasRef?.current || canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Restore base content if we have it
    if (baseContentRef.current) {
      ctx.putImageData(baseContentRef.current, 0, 0);
    }

    // Re-render all text elements
    renderAllText();

    applyTemperatureToCanvas?.();
    checkAndNotifyContent();
  }, [
    renderAllText,
    applyTemperatureToCanvas,
    checkAndNotifyContent,
    canvasRef,
    originalCanvasRef
  ]);

  const clearCanvas = () => {
    const canvas = originalCanvasRef?.current || canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    setCanvasHistory([]);
    setTextElements([]); // Clear text elements too
    applyTemperatureToCanvas?.();
    onHasContent?.(false);
  };

  // Export the handlers and state for parent components to use
  const toolsAPI = {
    handleCanvasClick,
    draw,
    stopDrawing,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
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
            flex-direction: column;
            gap: 1rem;
          `}
        >
          {/* Tool Selection */}
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

          {/* Tool Properties */}
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
            {/* Color Picker */}
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

              {/* Current Color and Color Picker Input */}
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

              {/* Common Colors */}
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
                          ? `
                          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(0, 0, 0, 0.1);
                        `
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

              {/* Recent Colors */}
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

            {/* Brush Size */}
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

            {/* Font Size (when text tool is selected) */}
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

            {/* Action Buttons */}
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
                    background: linear-gradient(
                      135deg,
                      #5b21b6 0%,
                      #4c1d95 100%
                    );
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
                    background: linear-gradient(
                      135deg,
                      #475569 0%,
                      #334155 100%
                    );
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

            {/* Font Size Control */}
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
    )
  };
}

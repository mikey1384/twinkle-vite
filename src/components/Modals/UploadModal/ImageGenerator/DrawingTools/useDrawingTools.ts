import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import type { ToolType, TextElement } from './types';
import { COMMON_COLORS } from './constants';
import {
  DEFAULT_DRAWING_COLOR,
  normalizeDrawingColor,
  normalizeRecentDrawingColors
} from './colorSettings';

interface DrawingToolsProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  drawingCanvasRef?: React.RefObject<HTMLCanvasElement>;
  referenceImageCanvasRef?: React.RefObject<HTMLCanvasElement>;
  disabled?: boolean;
  onHasContent?: (hasContent: boolean) => void;
  getCanvasCoordinates?: (
    e: React.MouseEvent | React.PointerEvent
  ) => { x: number; y: number };
  initialColor?: string;
  initialRecentColors?: string[];
  onColorSettingsCommit?: (params: {
    color: string;
    recentColors: string[];
  }) => void;
  zoomPercent?: number;
}

function getNextRecentColors(previousColors: string[], newColor: string) {
  if (COMMON_COLORS.includes(newColor)) {
    return previousColors;
  }
  if (previousColors[0] === newColor) {
    return previousColors;
  }
  return [
    newColor,
    ...previousColors.filter((color) => color !== newColor)
  ].slice(0, 6);
}

export default function useDrawingTools({
  canvasRef,
  drawingCanvasRef,
  referenceImageCanvasRef,
  disabled = false,
  onHasContent,
  getCanvasCoordinates,
  initialColor = DEFAULT_DRAWING_COLOR,
  initialRecentColors = [],
  onColorSettingsCommit
}: DrawingToolsProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(normalizeDrawingColor(initialColor));
  const [lineWidth, setLineWidth] = useState(3);
  const [tool, setTool] = useState<ToolType>('pencil');
  const [fontSize, setFontSize] = useState(20);
  const [canvasHistory, setCanvasHistory] = useState<
    Array<{ drawingData: ImageData; textState: TextElement[] }>
  >([]);
  const [redoHistory, setRedoHistory] = useState<
    Array<{ drawingData: ImageData; textState: TextElement[] }>
  >([]);
  const [isAddingText, setIsAddingText] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [draggedTextId, setDraggedTextId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0
  });
  const [recentColors, setRecentColors] = useState<string[]>(
    normalizeRecentDrawingColors(initialRecentColors)
  );

  const currentStrokePointsRef = useRef<Array<{ x: number; y: number }>>([]);
  const draggedElementRef = useRef<TextElement | null>(null);
  const originalDrawingContentRef = useRef<ImageData | null>(null);
  const textElementsRef = useRef<TextElement[]>([]);

  useEffect(() => {
    textElementsRef.current = textElements;
  }, [textElements]);

  function handleColorChange(newColor: string, commit: boolean = true) {
    const normalizedColor = normalizeDrawingColor(newColor);
    setColor(normalizedColor);
    if (!commit) return;
    setRecentColors((previousColors) => {
      const nextRecentColors = getNextRecentColors(
        previousColors,
        normalizedColor
      );
      onColorSettingsCommit?.({
        color: normalizedColor,
        recentColors: nextRecentColors
      });
      return nextRecentColors;
    });
  }

  function scanRasterForContent() {
    const rasterCanvas = getRasterCanvas();
    if (!rasterCanvas) return false;
    const rasterCtx = rasterCanvas.getContext('2d');
    if (!rasterCtx) return false;
    if (rasterCanvas.width === 0 || rasterCanvas.height === 0) return false;
    const imageData = rasterCtx.getImageData(
      0,
      0,
      rasterCanvas.width,
      rasterCanvas.height
    );
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 0) {
        return true;
      }
    }
    return false;
  }

  function notifyContentState(nextTextElements = textElementsRef.current) {
    onHasContent?.(scanRasterForContent() || nextTextElements.length > 0);
  }

  function getRasterCanvas() {
    return drawingCanvasRef ? drawingCanvasRef.current : canvasRef.current;
  }

  function cloneImageData(imageData: ImageData) {
    return new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );
  }

  function updateDisplay() {
    const displayCanvas = canvasRef.current;
    if (!displayCanvas) return;
    const displayCtx = displayCanvas.getContext('2d');
    if (!displayCtx) return;
    const rasterCanvas = getRasterCanvas();
    const referenceCanvas = referenceImageCanvasRef?.current;
    const hasReferenceImage = !!referenceCanvas;
    const w = displayCanvas.width;
    const h = displayCanvas.height;
    displayCtx.globalCompositeOperation = 'source-over';
    displayCtx.clearRect(0, 0, w, h);

    // Draw reference image backdrop if exists
    if (hasReferenceImage) {
      displayCtx.drawImage(referenceCanvas, 0, 0);
    } else {
      // White background for empty canvas
      displayCtx.fillStyle = '#ffffff';
      displayCtx.fillRect(0, 0, w, h);
    }

    // Draw all drawing operations on top
    if (rasterCanvas && rasterCanvas !== displayCanvas) {
      displayCtx.globalCompositeOperation = 'source-over';
      displayCtx.drawImage(rasterCanvas, 0, 0);
    } else if (originalDrawingContentRef.current) {
      displayCtx.putImageData(originalDrawingContentRef.current, 0, 0);
    }

    // Render all text, handling dragged text separately
    textElementsRef.current.forEach((element) => {
      if (isDraggingText && draggedTextId === element.id) {
        return; // Skip the dragged one
      }
      displayCtx.font = `${element.fontSize}px Arial`;
      displayCtx.fillStyle = element.color;
      displayCtx.textBaseline = 'top';
      displayCtx.fillText(element.text, element.x, element.y);
    });

    // Render dragged text at temp position if dragging
    if (isDraggingText && draggedElementRef.current) {
      const element = draggedElementRef.current;
      displayCtx.font = `${element.fontSize}px Arial`;
      displayCtx.fillStyle = element.color;
      displayCtx.textBaseline = 'top';
      displayCtx.fillText(element.text, element.x, element.y);
    }

    // Render temporary stroke if drawing
    if (currentStrokePointsRef.current.length > 1) {
      displayCtx.globalCompositeOperation =
        tool === 'eraser' ? 'destination-out' : 'source-over';
      displayCtx.strokeStyle = color;
      displayCtx.lineWidth = tool === 'eraser' ? lineWidth * 3 : lineWidth;
      displayCtx.lineCap = 'round';
      displayCtx.lineJoin = 'round';
      displayCtx.beginPath();
      displayCtx.moveTo(
        currentStrokePointsRef.current[0].x,
        currentStrokePointsRef.current[0].y
      );
      for (let i = 1; i < currentStrokePointsRef.current.length; i++) {
        displayCtx.lineTo(
          currentStrokePointsRef.current[i].x,
          currentStrokePointsRef.current[i].y
        );
      }
      displayCtx.stroke();
    }
  }

  // Initial canvas setup - useLayoutEffect ensures this runs before user can interact
  useLayoutEffect(() => {
    const initCanvas = () => {
      const rasterCanvas = getRasterCanvas();
      if (!rasterCanvas) return;
      const rasterCtx = rasterCanvas.getContext('2d');
      if (!rasterCtx) return;
      // Wait until canvas has valid dimensions
      if (rasterCanvas.width === 0 || rasterCanvas.height === 0) return;

      // Initialize originalDrawingContentRef for both cases
      if (!originalDrawingContentRef.current) {
        // Start with a transparent drawing layer
        rasterCtx.clearRect(0, 0, rasterCanvas.width, rasterCanvas.height);
        originalDrawingContentRef.current = rasterCtx.getImageData(
          0,
          0,
          rasterCanvas.width,
          rasterCanvas.height
        );
      }
      updateDisplay();
      notifyContentState();
    };
    initCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-redraw on state changes (text, tool, etc.)
  useEffect(() => {
    if (canvasRef.current) {
      updateDisplay();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textElements, tool, color, lineWidth, isDraggingText, draggedTextId]);

  function saveToHistory() {
    const rasterCanvas = getRasterCanvas();
    if (!rasterCanvas) return;
    const rasterCtx = rasterCanvas.getContext('2d');
    if (!rasterCtx) return;
    if (rasterCanvas.width === 0 || rasterCanvas.height === 0) return;
    const displayCanvas = canvasRef.current;
    const currentData =
      displayCanvas && rasterCanvas !== displayCanvas
        ? rasterCtx.getImageData(0, 0, rasterCanvas.width, rasterCanvas.height)
        : originalDrawingContentRef.current;
    if (!currentData) return;
    // Clone the ImageData to avoid reference issues
    const drawingData = cloneImageData(currentData);
    setCanvasHistory((prev) =>
      [...prev, { drawingData, textState: [...textElementsRef.current] }].slice(
        -10
      )
    );
    // Clear redo history when a new action is performed
    setRedoHistory([]);
  }

  function floodFill(startX: number, startY: number, fillColor: string) {
    const rasterCanvas = getRasterCanvas();
    if (!rasterCanvas) return;
    const rasterCtx = rasterCanvas.getContext('2d');
    if (!rasterCtx) return;
    const imageData = rasterCtx.getImageData(
      0,
      0,
      rasterCanvas.width,
      rasterCanvas.height
    );
    const data = imageData.data;
    const width = rasterCanvas.width;
    const height = rasterCanvas.height;
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
      if (
        currentR === targetR &&
        currentG === targetG &&
        currentB === targetB &&
        currentA === targetA
      ) {
        data[currentIndex] = fillR;
        data[currentIndex + 1] = fillG;
        data[currentIndex + 2] = fillB;
        data[currentIndex + 3] = 255;
        pixelsToCheck.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
      }
    }
    rasterCtx.putImageData(imageData, 0, 0);
    originalDrawingContentRef.current = rasterCtx.getImageData(
      0,
      0,
      rasterCanvas.width,
      rasterCanvas.height
    );
    updateDisplay();
    notifyContentState();
  }

  const defaultGetCanvasCoordinates = (
    e: React.MouseEvent | React.PointerEvent
  ) => {
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

  const pickColorAtCoords = ({ x, y }: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imageData = ctx.getImageData(x, y, 1, 1);
    const [r, g, b] = imageData.data;
    const hexColor = `#${((1 << 24) + (r << 16) + (g << 8) + b)
      .toString(16)
      .slice(1)}`;
    handleColorChange(hexColor, true);
    setTool('pencil');
  };

  const addTextToCanvas = () => {
    if (!textInput.trim() || !textPosition) return;
    saveToHistory();
    const newTextElement = {
      id: `text-${Date.now()}-${Math.random()}`,
      text: textInput,
      x: textPosition.x,
      y: textPosition.y,
      fontSize,
      color
    };
    const nextTextElements = [...textElementsRef.current, newTextElement];
    textElementsRef.current = nextTextElements;
    setTextElements(nextTextElements);
    requestAnimationFrame(updateDisplay);
    notifyContentState(nextTextElements);
    setTextInput('');
    setTextPosition(null);
    setIsAddingText(false);
  };

  const cancelTextInput = () => {
    setTextInput('');
    setTextPosition(null);
    setIsAddingText(false);
  };

  const getTextElementAtPosition = (x: number, y: number) => {
    const rasterCanvas = getRasterCanvas();
    if (!rasterCanvas) return null;
    const ctx = rasterCanvas.getContext('2d');
    if (!ctx) return null;
    for (let i = textElementsRef.current.length - 1; i >= 0; i--) {
      const element = textElementsRef.current[i];
      ctx.font = `${element.fontSize}px Arial`;
      ctx.textBaseline = 'top';
      const textMetrics = ctx.measureText(element.text);
      const textWidth = textMetrics.width;
      const textHeight = element.fontSize;
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

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    if (e.button !== 0) return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore capture failures and continue drawing.
    }
    handleCanvasInteractionStart(e);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    handleCanvasInteractionStart(e);
  };

  const handleCanvasInteractionStart = (
    e: React.MouseEvent | React.PointerEvent
  ) => {
    if (disabled) return;
    const coords = getCanvasCoordinates
      ? getCanvasCoordinates(e)
      : defaultGetCanvasCoordinates(e);
    if (tool === 'colorPicker') {
      pickColorAtCoords(coords);
      return;
    }
    if (tool === 'text') {
      const clickedText = getTextElementAtPosition(coords.x, coords.y);
      if (clickedText) {
        saveToHistory();
        setIsDraggingText(true);
        setDraggedTextId(clickedText.id);
        setDragOffset({
          x: coords.x - clickedText.x,
          y: coords.y - clickedText.y
        });
        draggedElementRef.current = { ...clickedText };
        return;
      }
      setTextPosition(coords);
      setIsAddingText(true);
      return;
    }
    if (tool === 'fill') {
      saveToHistory();
      floodFill(Math.floor(coords.x), Math.floor(coords.y), color);
      return;
    }
    startDrawing(coords);
  };

  const startDrawing = (coords: { x: number; y: number }) => {
    if (disabled) return;
    // Lazy initialization if not already set (fallback for timing issues)
    const rasterCanvas = getRasterCanvas();
    if (!originalDrawingContentRef.current && rasterCanvas) {
      const rasterCtx = rasterCanvas.getContext('2d');
      if (rasterCtx && rasterCanvas.width > 0 && rasterCanvas.height > 0) {
        originalDrawingContentRef.current = rasterCtx.getImageData(
          0,
          0,
          rasterCanvas.width,
          rasterCanvas.height
        );
      }
    }
    currentStrokePointsRef.current = [coords];
    setIsDrawing(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    if (isDrawing || isDraggingText) {
      e.preventDefault();
    }
    handleCanvasInteractionMove(e);
  };

  const draw = (e: React.MouseEvent) => {
    if (isDrawing || isDraggingText) {
      e.preventDefault();
    }
    handleCanvasInteractionMove(e);
  };

  const handleCanvasInteractionMove = (
    e: React.MouseEvent | React.PointerEvent
  ) => {
    if (disabled) return;
    const coords = getCanvasCoordinates
      ? getCanvasCoordinates(e)
      : defaultGetCanvasCoordinates(e);
    if (isDraggingText && draggedTextId && draggedElementRef.current) {
      draggedElementRef.current.x = coords.x - dragOffset.x;
      draggedElementRef.current.y = coords.y - dragOffset.y;
      requestAnimationFrame(updateDisplay);
      return;
    }
    if (
      !isDrawing ||
      tool === 'text' ||
      tool === 'colorPicker' ||
      tool === 'fill'
    )
      return;
    currentStrokePointsRef.current.push(coords);
    requestAnimationFrame(updateDisplay);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    handleCanvasInteractionEnd();
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore release failures.
    }
  };

  const handlePointerLeave = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    handleCanvasInteractionEnd();
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore release failures.
    }
  };

  const stopDrawing = () => {
    handleCanvasInteractionEnd();
  };

  const handleCanvasInteractionEnd = () => {
    if (disabled) return;
    if (isDraggingText) {
      if (draggedElementRef.current) {
        const updatedElement = draggedElementRef.current;
        const nextTextElements = textElementsRef.current.map((el) =>
          el.id === updatedElement.id ? updatedElement : el
        );
        textElementsRef.current = nextTextElements;
        setTextElements(nextTextElements);
        draggedElementRef.current = null;
      }
      setIsDraggingText(false);
      setDraggedTextId(null);
      setDragOffset({ x: 0, y: 0 });
      updateDisplay();
      return;
    }
    if (isDrawing) {
      const rasterCanvas = getRasterCanvas();
      if (currentStrokePointsRef.current.length > 1 && rasterCanvas) {
        saveToHistory();
        const rasterCtx = rasterCanvas.getContext('2d');
        if (rasterCtx) {
          rasterCtx.globalCompositeOperation =
            tool === 'eraser' ? 'destination-out' : 'source-over';
          rasterCtx.strokeStyle = color;
          rasterCtx.lineWidth = tool === 'eraser' ? lineWidth * 3 : lineWidth;
          rasterCtx.lineCap = 'round';
          rasterCtx.lineJoin = 'round';
          rasterCtx.beginPath();
          rasterCtx.moveTo(
            currentStrokePointsRef.current[0].x,
            currentStrokePointsRef.current[0].y
          );
          for (let i = 1; i < currentStrokePointsRef.current.length; i++) {
            rasterCtx.lineTo(
              currentStrokePointsRef.current[i].x,
              currentStrokePointsRef.current[i].y
            );
          }
          rasterCtx.stroke();
          originalDrawingContentRef.current = rasterCtx.getImageData(
            0,
            0,
            rasterCanvas.width,
            rasterCanvas.height
          );
        }
      }
      currentStrokePointsRef.current = [];
      setIsDrawing(false);
      updateDisplay();
      notifyContentState();
    }
  };

  // Multi-touch (2+ fingers) bypasses drawing and lets the browser pan/scroll
  // natively. Single-finger stays as draw. This is the standard touch-drawing-app
  // convention (Procreate, Sketchbook, etc.) and also allows scrolling past
  // tall canvases on mobile.
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    if (e.touches.length > 1) {
      handleCanvasInteractionEnd();
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    const coords = getTouchCoordinates(touch);
    if (tool === 'colorPicker') {
      pickColorAtCoords(coords);
      return;
    }
    if (tool === 'text') {
      const clickedText = getTextElementAtPosition(coords.x, coords.y);
      if (clickedText) {
        saveToHistory();
        setIsDraggingText(true);
        setDraggedTextId(clickedText.id);
        setDragOffset({
          x: coords.x - clickedText.x,
          y: coords.y - clickedText.y
        });
        draggedElementRef.current = { ...clickedText };
        return;
      }
      setTextPosition(coords);
      setIsAddingText(true);
      return;
    }
    if (tool === 'fill') {
      saveToHistory();
      floodFill(Math.floor(coords.x), Math.floor(coords.y), color);
      return;
    }
    startDrawing(coords);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled) return;
    if (e.touches.length > 1) {
      handleCanvasInteractionEnd();
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    const coords = getTouchCoordinates(touch);
    if (isDraggingText && draggedTextId && draggedElementRef.current) {
      draggedElementRef.current.x = coords.x - dragOffset.x;
      draggedElementRef.current.y = coords.y - dragOffset.y;
      requestAnimationFrame(updateDisplay);
      return;
    }
    if (
      !isDrawing ||
      tool === 'text' ||
      tool === 'colorPicker' ||
      tool === 'fill'
    )
      return;
    currentStrokePointsRef.current.push(coords);
    requestAnimationFrame(updateDisplay);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (disabled) return;
    if (e.touches.length > 0) return;
    e.preventDefault();
    e.stopPropagation();
    handleCanvasInteractionEnd();
  };

  const handleUndo = () => {
    const rasterCanvas = getRasterCanvas();
    if (canvasHistory.length === 0 || !rasterCanvas) return;
    const rasterCtx = rasterCanvas.getContext('2d');
    if (!rasterCtx) return;
    // Save current state to redo history before undoing
    const displayCanvas = canvasRef.current;
    const currentData =
      displayCanvas && rasterCanvas !== displayCanvas
        ? rasterCtx.getImageData(0, 0, rasterCanvas.width, rasterCanvas.height)
        : originalDrawingContentRef.current;
    if (currentData) {
      setRedoHistory((prev) =>
        [
          ...prev,
          {
            drawingData: cloneImageData(currentData),
            textState: [...textElementsRef.current]
          }
        ].slice(-10)
      );
    }
    const previous = canvasHistory[canvasHistory.length - 1];
    setCanvasHistory((prev) => prev.slice(0, -1));
    if (rasterCtx && previous) {
      const restoredData = cloneImageData(previous.drawingData);
      rasterCtx.putImageData(restoredData, 0, 0);
      const nextTextElements = [...previous.textState];
      textElementsRef.current = nextTextElements;
      setTextElements(nextTextElements);
      originalDrawingContentRef.current = restoredData;
      updateDisplay();
      notifyContentState(nextTextElements);
    }
  };

  const handleRedo = () => {
    const rasterCanvas = getRasterCanvas();
    if (redoHistory.length === 0 || !rasterCanvas) return;
    const rasterCtx = rasterCanvas.getContext('2d');
    if (!rasterCtx) return;
    // Save current state to undo history before redoing
    const displayCanvas = canvasRef.current;
    const currentData =
      displayCanvas && rasterCanvas !== displayCanvas
        ? rasterCtx.getImageData(0, 0, rasterCanvas.width, rasterCanvas.height)
        : originalDrawingContentRef.current;
    if (currentData) {
      setCanvasHistory((prev) =>
        [
          ...prev,
          {
            drawingData: cloneImageData(currentData),
            textState: [...textElementsRef.current]
          }
        ].slice(-10)
      );
    }
    const next = redoHistory[redoHistory.length - 1];
    setRedoHistory((prev) => prev.slice(0, -1));
    if (rasterCtx && next) {
      const restoredData = cloneImageData(next.drawingData);
      rasterCtx.putImageData(restoredData, 0, 0);
      const nextTextElements = [...next.textState];
      textElementsRef.current = nextTextElements;
      setTextElements(nextTextElements);
      originalDrawingContentRef.current = restoredData;
      updateDisplay();
      notifyContentState(nextTextElements);
    }
  };

  const clearCanvas = () => {
    const rasterCanvas = getRasterCanvas();
    if (!rasterCanvas) return;
    saveToHistory();
    const rasterCtx = rasterCanvas.getContext('2d');
    if (!rasterCtx) return;
    rasterCtx.clearRect(0, 0, rasterCanvas.width, rasterCanvas.height);
    originalDrawingContentRef.current = rasterCtx.getImageData(
      0,
      0,
      rasterCanvas.width,
      rasterCanvas.height
    );
    textElementsRef.current = [];
    setTextElements([]);
    updateDisplay();
    notifyContentState([]);
  };

  const clearDrawingOverlay = () => {
    // Clear the raster canvas buffer to prevent stale strokes
    const rasterCanvas = getRasterCanvas();
    if (rasterCanvas) {
      const rasterCtx = rasterCanvas.getContext('2d');
      if (rasterCtx) {
        rasterCtx.clearRect(0, 0, rasterCanvas.width, rasterCanvas.height);
        originalDrawingContentRef.current = rasterCtx.getImageData(
          0,
          0,
          rasterCanvas.width,
          rasterCanvas.height
        );
      }
    }
    textElementsRef.current = [];
    setTextElements([]);
    setCanvasHistory([]);
    setRedoHistory([]);
    updateDisplay();
    notifyContentState([]);
  };

  return {
    handleCanvasClick,
    draw,
    stopDrawing,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    color,
    tool,
    setTool,
    lineWidth,
    setLineWidth,
    fontSize,
    setFontSize,
    canvasHistory,
    redoHistory,
    isAddingText,
    textInput,
    setTextInput,
    addTextToCanvas,
    cancelTextInput,
    handleUndo,
    handleRedo,
    clearCanvas,
    clearDrawingOverlay,
    handleColorChange,
    recentColors,
    updateDisplay
  };
}

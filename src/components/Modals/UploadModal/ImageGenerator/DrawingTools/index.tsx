import React from 'react';
import useDrawingTools from './useDrawingTools';
import DrawingToolsUI from './DrawingToolsUI';

interface DrawingToolsProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  drawingCanvasRef?: React.RefObject<HTMLCanvasElement>;
  originalCanvasRef?: React.RefObject<HTMLCanvasElement>;
  referenceImageCanvasRef?: React.RefObject<HTMLCanvasElement>;
  disabled?: boolean;
  onHasContent?: (hasContent: boolean) => void;
  getCanvasCoordinates?: (e: React.MouseEvent) => { x: number; y: number };
  initialColor?: string;
  initialRecentColors?: string[];
  onColorSettingsCommit?: (params: {
    color: string;
    recentColors: string[];
  }) => void;
}

export default function DrawingTools(props: DrawingToolsProps) {
  const {
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
    setTool,
    handleColorChange,
    setLineWidth,
    setFontSize,
    recentColors,
    updateDisplay
  } = useDrawingTools({
    canvasRef: props.canvasRef,
    drawingCanvasRef: props.drawingCanvasRef,
    referenceImageCanvasRef:
      props.referenceImageCanvasRef || props.originalCanvasRef,
    disabled: props.disabled,
    onHasContent: props.onHasContent,
    getCanvasCoordinates: props.getCanvasCoordinates,
    initialColor: props.initialColor,
    initialRecentColors: props.initialRecentColors,
    onColorSettingsCommit: props.onColorSettingsCommit
  });

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
    clearCanvas,
    clearDrawingOverlay
  };

  const toolsUI = (
    <DrawingToolsUI
      tool={tool}
      setTool={setTool}
      color={color}
      onColorChange={handleColorChange}
      lineWidth={lineWidth}
      setLineWidth={setLineWidth}
      fontSize={fontSize}
      setFontSize={setFontSize}
      disabled={!!props.disabled}
      recentColors={recentColors}
      onUndo={handleUndo}
      onRedo={handleRedo}
      canvasHistory={canvasHistory}
      redoHistory={redoHistory}
      clearCanvas={clearCanvas}
      isAddingText={isAddingText}
      textInput={textInput}
      setTextInput={setTextInput}
      addTextToCanvas={addTextToCanvas}
      cancelTextInput={cancelTextInput}
    />
  );

  return { toolsAPI, toolsUI, updateDisplay };
}

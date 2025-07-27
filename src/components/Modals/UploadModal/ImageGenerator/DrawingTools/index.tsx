import React from 'react';
import useDrawingTools from './useDrawingTools';
import DrawingToolsUI from './DrawingToolsUI';

interface DrawingToolsProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  originalCanvasRef?: React.RefObject<HTMLCanvasElement>;
  referenceImageCanvasRef?: React.RefObject<HTMLCanvasElement>;
  disabled?: boolean;
  onHasContent?: (hasContent: boolean) => void;
  getCanvasCoordinates?: (e: React.MouseEvent) => { x: number; y: number };
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
    isAddingText,
    textInput,
    setTextInput,
    addTextToCanvas,
    cancelTextInput,
    handleUndo,
    clearCanvas,
    setTool,
    handleColorChange,
    setLineWidth,
    setFontSize,
    recentColors,
    updateDisplay
  } = useDrawingTools({
    canvasRef: props.canvasRef,
    referenceImageCanvasRef:
      props.referenceImageCanvasRef || props.originalCanvasRef,
    disabled: props.disabled,
    onHasContent: props.onHasContent,
    getCanvasCoordinates: props.getCanvasCoordinates
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
    clearCanvas
  };

  const toolsUI = (
    <DrawingToolsUI
      tool={tool}
      setTool={setTool}
      color={color}
      handleColorChange={handleColorChange}
      lineWidth={lineWidth}
      setLineWidth={setLineWidth}
      fontSize={fontSize}
      setFontSize={setFontSize}
      disabled={!!props.disabled}
      recentColors={recentColors}
      handleUndo={handleUndo}
      canvasHistory={canvasHistory}
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

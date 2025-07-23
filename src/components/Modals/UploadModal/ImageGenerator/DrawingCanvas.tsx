import React, { useRef, useEffect } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import DrawingTools from './shared/DrawingTools';

interface DrawingCanvasProps {
  onSave: (dataUrl: string) => void;
  disabled?: boolean;
  onHasContent?: (hasContent: boolean) => void;
}

export default function DrawingCanvas({ onSave, disabled = false, onHasContent }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  const getCanvasCoordinates = (e: React.MouseEvent) => {
    return {
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY
    };
  };

  const handleContentChange = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    onHasContent?.(checkCanvasHasContent(canvas));
  };

  const checkCanvasHasContent = (canvas: HTMLCanvasElement): boolean => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Check if any pixel is not white (255, 255, 255, 255)
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      // If any pixel is not white or has transparency, there's content
      if (r !== 255 || g !== 255 || b !== 255 || a !== 255) {
        return true;
      }
    }
    
    return false;
  };

  const { toolsAPI, toolsUI } = DrawingTools({
    canvasRef,
    disabled,
    onHasContent: (hasContent) => {
      handleContentChange();
      onHasContent?.(hasContent);
    },
    getCanvasCoordinates
  });

  const getCursor = () => {
    if (disabled) return 'not-allowed';
    
    switch (toolsAPI.tool) {
      case 'pencil': return 'crosshair';
      case 'eraser': return 'grab';
      case 'text': return 'text';
      case 'colorPicker': return 'crosshair';
      case 'fill': return 'crosshair';
      default: return 'default';
    }
  };

  return (
    <div
      className={css`
        border: 1px solid ${Color.borderGray()};
        padding: 1rem;
        border-radius: 8px;
      `}
    >
      <div
        className={css`
          margin-bottom: 1rem;
        `}
      >
        {toolsUI}
      </div>
      <div
        className={css`
          display: flex;
          justify-content: center;
          width: 100%;
        `}
      >
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          onMouseDown={disabled ? undefined : toolsAPI.handleCanvasClick}
          onMouseMove={disabled ? undefined : toolsAPI.draw}
          onMouseUp={disabled ? undefined : toolsAPI.stopDrawing}
          onMouseOut={disabled ? undefined : toolsAPI.stopDrawing}
          className={css`
            background: white;
            cursor: ${getCursor()};
            border: 2px dashed ${disabled ? '#ccc' : Color.logoBlue(0.4)};
            border-radius: 8px;
            box-shadow: inset 0 2px 4px ${disabled ? 'rgba(204, 204, 204, 0.1)' : 'rgba(0, 123, 255, 0.1)'};
            transition: all 0.2s ease;
            max-width: 100%;
            height: auto;
            opacity: ${disabled ? 0.5 : 1};

            ${!disabled && `
              &:hover {
                border-color: ${Color.logoBlue(0.6)};
                box-shadow: inset 0 2px 4px rgba(0, 123, 255, 0.15);
              }

              &:active {
                border-color: ${Color.logoBlue()};
                box-shadow: inset 0 2px 8px rgba(0, 123, 255, 0.2);
              }
            `}
          `}
        />
      </div>
    </div>
  );
}

import React, { useRef, useState, useEffect } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

interface DrawingCanvasProps {
  onSave: (dataUrl: string) => void;
  disabled?: boolean;
}

export default function DrawingCanvas({ onSave, disabled = false }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(5);
  const [tool, setTool] = useState<'pencil' | 'eraser'>('pencil');

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
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        `}
      >
        <select
          value={tool}
          onChange={(e) => setTool(e.target.value as 'pencil' | 'eraser')}
          disabled={disabled}
        >
          <option value="pencil">Pencil</option>
          <option value="eraser">Eraser</option>
        </select>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          disabled={disabled}
        />
        <input
          type="range"
          min="1"
          max="20"
          value={lineWidth}
          onChange={(e) => setLineWidth(Number(e.target.value))}
          disabled={disabled}
        />
        <button onClick={clearCanvas} disabled={disabled}>Clear</button>
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
          onMouseDown={disabled ? undefined : startDrawing}
          onMouseMove={disabled ? undefined : draw}
          onMouseUp={disabled ? undefined : stopDrawing}
          onMouseOut={disabled ? undefined : stopDrawing}
          className={css`
            background: white;
            cursor: ${disabled ? 'not-allowed' : 'crosshair'};
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

  function startDrawing(e: React.MouseEvent) {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        setIsDrawing(true);
      }
    }
  }

  function draw(e: React.MouseEvent) {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
        ctx.lineWidth = tool === 'eraser' ? 20 : lineWidth;
        ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.stroke();
      }
    }
  }

  function stopDrawing() {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      onSave(dataUrl);
    }
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        onSave(canvas.toDataURL('image/png'));
      }
    }
  }
}

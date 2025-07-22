import React, { useRef, useState, useEffect, useCallback } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

interface ImageEditorProps {
  imageUrl: string;
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}

export default function ImageEditor({ imageUrl, onSave, onCancel }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ff0000');
  const [lineWidth, setLineWidth] = useState(3);
  const [tool, setTool] = useState<'pencil' | 'eraser'>('pencil');
  const [imageLoaded, setImageLoaded] = useState(false);

  const loadImageToCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (canvas && image && imageLoaded) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        
        const displayWidth = 600;
        const aspectRatio = image.naturalHeight / image.naturalWidth;
        const displayHeight = displayWidth * aspectRatio;
        
        canvas.style.width = `${Math.min(displayWidth, 600)}px`;
        canvas.style.height = `${Math.min(displayHeight, 400)}px`;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0);
      }
    }
  }, [imageLoaded]);

  useEffect(() => {
    const image = imageRef.current;
    if (image && imageUrl) {
      image.onload = () => {
        setImageLoaded(true);
      };
      image.src = imageUrl;
    }
  }, [imageUrl]);

  useEffect(() => {
    loadImageToCanvas();
  }, [loadImageToCanvas]);

  const getCanvasCoordinates = (e: React.MouseEvent) => {
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

  const startDrawing = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const coords = getCanvasCoordinates(e);
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
        setIsDrawing(true);
      }
    }
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const coords = getCanvasCoordinates(e);
        ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
        ctx.strokeStyle = color;
        ctx.lineWidth = tool === 'eraser' ? lineWidth * 3 : lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png', 0.9);
      onSave(dataUrl);
    }
  };

  const handleUndo = () => {
    loadImageToCanvas();
  };

  return (
    <div
      className={css`
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 2rem;
      `}
    >
      <div
        className={css`
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          max-width: 90vw;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        `}
      >
        <div
          className={css`
            display: flex;
            justify-content: between;
            align-items: center;
            gap: 1rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid ${Color.borderGray()};
          `}
        >
          <h3
            className={css`
              margin: 0;
              color: ${Color.darkGray()};
              font-size: 1.1rem;
            `}
          >
            Edit Image
          </h3>
          <button
            onClick={onCancel}
            className={css`
              background: none;
              border: none;
              font-size: 1.2rem;
              cursor: pointer;
              color: ${Color.darkGray()};
              padding: 0.25rem;
              margin-left: auto;
              
              &:hover {
                color: ${Color.black()};
              }
            `}
          >
            ✕
          </button>
        </div>

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
              onChange={(e) => setTool(e.target.value as 'pencil' | 'eraser')}
              className={css`
                padding: 0.25rem 0.5rem;
                border: 1px solid ${Color.borderGray()};
                border-radius: 4px;
              `}
            >
              <option value="pencil">Pencil</option>
              <option value="eraser">Eraser</option>
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
              className={css`
                width: 100px;
              `}
            />
            <span>{lineWidth}px</span>
          </div>

          <button
            onClick={handleUndo}
            className={css`
              background: ${Color.orange()};
              color: white;
              border: none;
              padding: 0.5rem 1rem;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 500;
              
              &:hover {
                background: ${Color.orange(0.8)};
              }
            `}
          >
            Reset
          </button>
        </div>

        <div
          className={css`
            display: flex;
            justify-content: center;
            overflow: auto;
            max-height: 60vh;
          `}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className={css`
              background: white;
              cursor: ${tool === 'pencil' ? 'crosshair' : 'grab'};
              border: 2px solid ${Color.borderGray()};
              border-radius: 8px;
              max-width: 100%;
              max-height: 100%;
            `}
          />
        </div>

        <div
          className={css`
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
            padding-top: 1rem;
            border-top: 1px solid ${Color.borderGray()};
          `}
        >
          <button
            onClick={onCancel}
            className={css`
              background: transparent;
              color: ${Color.darkGray()};
              border: 1px solid ${Color.borderGray()};
              padding: 0.75rem 1.5rem;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 500;
              
              &:hover {
                background: ${Color.highlightGray()};
              }
            `}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className={css`
              background: ${Color.logoBlue()};
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 500;
              
              &:hover {
                background: ${Color.logoBlue(0.8)};
              }
            `}
          >
            Save Changes
          </button>
        </div>
      </div>

      <img
        ref={imageRef}
        style={{ display: 'none' }}
        alt="Source for editing"
      />
    </div>
  );
}
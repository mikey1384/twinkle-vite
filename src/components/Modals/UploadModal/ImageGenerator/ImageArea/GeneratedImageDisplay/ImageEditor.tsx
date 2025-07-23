import React, { useRef, useState, useEffect, useCallback } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import DrawingTools from '../../shared/DrawingTools';

interface ImageEditorProps {
  imageUrl: string;
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}

export default function ImageEditor({
  imageUrl,
  onSave,
  onCancel
}: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [temperature, setTemperature] = useState(0);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);

  const applyTemperatureToCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const originalCanvas = originalCanvasRef.current;
    if (!canvas || !originalCanvas) return;

    const ctx = canvas.getContext('2d');
    const originalCtx = originalCanvas.getContext('2d');
    if (!ctx || !originalCtx) return;

    // Copy original to display canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalCanvas, 0, 0);

    // Apply temperature if not neutral
    if (temperature !== 0) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        if (temperature > 0) {
          // Warmer - enhance reds and reduce blues
          const intensity = temperature / 100;
          r = Math.min(255, r * (1 + intensity * 0.3));
          g = Math.min(255, g * (1 + intensity * 0.1));
          b = Math.max(0, b * (1 - intensity * 0.2));
        } else {
          // Cooler - enhance blues and reduce reds
          const intensity = Math.abs(temperature) / 100;
          r = Math.max(0, r * (1 - intensity * 0.2));
          g = Math.min(255, g * (1 + intensity * 0.05));
          b = Math.min(255, b * (1 + intensity * 0.3));
        }

        data[i] = Math.round(r);
        data[i + 1] = Math.round(g);
        data[i + 2] = Math.round(b);
      }

      ctx.putImageData(imageData, 0, 0);
    }
  }, [temperature]);

  const loadImageToCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const originalCanvas = originalCanvasRef.current;
    const image = imageRef.current;
    if (canvas && originalCanvas && image && imageLoaded) {
      const ctx = canvas.getContext('2d');
      const originalCtx = originalCanvas.getContext('2d');
      if (ctx && originalCtx) {
        const maxCanvasSize = 2048;
        const naturalWidth = image.naturalWidth;
        const naturalHeight = image.naturalHeight;

        let canvasWidth = naturalWidth;
        let canvasHeight = naturalHeight;

        if (naturalWidth > maxCanvasSize || naturalHeight > maxCanvasSize) {
          const scale = Math.min(
            maxCanvasSize / naturalWidth,
            maxCanvasSize / naturalHeight
          );
          canvasWidth = Math.floor(naturalWidth * scale);
          canvasHeight = Math.floor(naturalHeight * scale);
        }

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        originalCanvas.width = canvasWidth;
        originalCanvas.height = canvasHeight;

        // Set display size
        const displayWidth = 600;
        const aspectRatio = canvasHeight / canvasWidth;
        const displayHeight = displayWidth * aspectRatio;

        canvas.style.width = `${Math.min(displayWidth, 600)}px`;
        canvas.style.height = `${Math.min(displayHeight, 400)}px`;

        originalCtx.clearRect(0, 0, canvasWidth, canvasHeight);
        originalCtx.drawImage(image, 0, 0, canvasWidth, canvasHeight);

        // Just copy original to display canvas (temperature will be applied separately)
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(originalCanvas, 0, 0);
      }
    }
  }, [imageLoaded]);

  useEffect(() => {
    const image = imageRef.current;
    if (image && imageUrl) {
      const handleLoad = () => {
        setImageLoaded(true);
      };

      image.onload = handleLoad;
      image.src = imageUrl;

      // Cleanup function to prevent memory leaks
      return () => {
        image.onload = null;
        setImageLoaded(false);
      };
    }
  }, [imageUrl]);

  useEffect(() => {
    loadImageToCanvas();
  }, [loadImageToCanvas]);

  // Apply temperature to display canvas after image loads
  useEffect(() => {
    if (imageLoaded) {
      applyTemperatureToCanvas();
    }
  }, [imageLoaded, applyTemperatureToCanvas]);

  // Apply temperature changes in real-time (but don't reload image)
  useEffect(() => {
    if (imageLoaded) {
      applyTemperatureToCanvas();
    }
  }, [temperature, applyTemperatureToCanvas, imageLoaded]);

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

  const handleSave = () => {
    const originalCanvas = originalCanvasRef.current;
    if (originalCanvas) {
      try {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;

        tempCanvas.width = originalCanvas.width;
        tempCanvas.height = originalCanvas.height;

        // Copy original canvas to temp canvas
        tempCtx.drawImage(originalCanvas, 0, 0);

        // Apply temperature to temp canvas if not neutral
        if (temperature !== 0) {
          const imageData = tempCtx.getImageData(
            0,
            0,
            tempCanvas.width,
            tempCanvas.height
          );
          const data = imageData.data;

          for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            if (temperature > 0) {
              // Warmer - enhance reds and reduce blues
              const intensity = temperature / 100;
              r = Math.min(255, r * (1 + intensity * 0.3));
              g = Math.min(255, g * (1 + intensity * 0.1));
              b = Math.max(0, b * (1 - intensity * 0.2));
            } else {
              // Cooler - enhance blues and reduce reds
              const intensity = Math.abs(temperature) / 100;
              r = Math.max(0, r * (1 - intensity * 0.2));
              g = Math.min(255, g * (1 + intensity * 0.05));
              b = Math.min(255, b * (1 + intensity * 0.3));
            }

            data[i] = Math.round(r);
            data[i + 1] = Math.round(g);
            data[i + 2] = Math.round(b);
          }

          tempCtx.putImageData(imageData, 0, 0);
        }

        const dataUrl = tempCanvas.toDataURL('image/png', 0.9);
        onSave(dataUrl);
      } catch (err) {
        console.error('Failed to save canvas:', err);
      }
    }
  };

  const handleReset = () => {
    loadImageToCanvas();
    setTemperature(0); // Reset temperature to neutral
  };

  const { toolsAPI, toolsUI } = DrawingTools({
    canvasRef: canvasRef as React.RefObject<HTMLCanvasElement>,
    originalCanvasRef: originalCanvasRef as React.RefObject<HTMLCanvasElement>,
    applyTemperatureToCanvas,
    getCanvasCoordinates
  });

  const getCursor = () => {
    switch (toolsAPI.tool) {
      case 'pencil':
        return 'crosshair';
      case 'eraser':
        return 'grab';
      case 'text':
        return 'text';
      case 'colorPicker':
        return 'crosshair';
      case 'fill':
        return 'crosshair';
      default:
        return 'default';
    }
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
          `}
        >
          {toolsUI}

          {/* Temperature control */}
          <div
            className={css`
              display: flex;
              align-items: center;
              gap: 0.5rem;
              padding: 0.5rem;
              background: ${Color.highlightGray()};
              border-radius: 8px;
            `}
          >
            <label>Temp:</label>
            <input
              type="range"
              min="-100"
              max="100"
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              className={css`
                width: 120px;
              `}
            />
            <span
              className={css`
                font-size: 0.8rem;
                color: ${temperature > 0
                  ? '#ff6b35'
                  : temperature < 0
                  ? '#4a90e2'
                  : Color.darkGray()};
                font-weight: 500;
                min-width: 40px;
              `}
            >
              {temperature > 0 ? '🔥' : temperature < 0 ? '❄️' : '🔅'}{' '}
              {temperature}
            </span>
          </div>

          <button
            onClick={handleReset}
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
            onMouseDown={toolsAPI.handleCanvasClick}
            onMouseMove={toolsAPI.draw}
            onMouseUp={toolsAPI.stopDrawing}
            onMouseLeave={toolsAPI.stopDrawing}
            className={css`
              background: white;
              cursor: ${getCursor()};
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
      <canvas ref={originalCanvasRef} style={{ display: 'none' }} />
    </div>
  );
}

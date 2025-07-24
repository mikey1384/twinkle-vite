import React, { useRef, useState, useEffect, useCallback } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import DrawingTools from '../../DrawingTools';

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
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [temperature, setTemperature] = useState(0);

  const applyTemperatureToCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Do not clear or drawImage; apply to current content
    if (temperature === 0) return;

    const w = canvas.width;
    const h = canvas.height;
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      if (temperature > 0) {
        const intensity = temperature / 100;
        r = Math.min(255, r * (1 + intensity * 0.3));
        g = Math.min(255, g * (1 + intensity * 0.1));
        b = Math.max(0, b * (1 - intensity * 0.2));
      } else {
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
  }, [temperature]);

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

  const { toolsAPI, toolsUI, updateDisplay } = DrawingTools({
    canvasRef: canvasRef as React.RefObject<HTMLCanvasElement>,
    originalCanvasRef: originalCanvasRef as React.RefObject<HTMLCanvasElement>,
    getCanvasCoordinates,
    applyTemperatureToCanvas: undefined // Do not call in hook; manage locally
  });

  // Load image and draw to canvases
  useEffect(() => {
    const loadImage = () => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = canvasRef.current;
        const originalCanvas = originalCanvasRef.current;
        if (!canvas || !originalCanvas) return;

        const originalCtx = originalCanvas.getContext('2d');
        if (!originalCtx) return;

        const maxCanvasSize = 2048;
        let canvasWidth = img.naturalWidth;
        let canvasHeight = img.naturalHeight;

        if (canvasWidth === 0 || canvasHeight === 0) {
          console.error('Image has zero dimensions');
          return;
        }

        if (canvasWidth > maxCanvasSize || canvasHeight > maxCanvasSize) {
          const scale = Math.min(
            maxCanvasSize / canvasWidth,
            maxCanvasSize / canvasHeight
          );
          canvasWidth = Math.floor(canvasWidth * scale);
          canvasHeight = Math.floor(canvasHeight * scale);
        }

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        originalCanvas.width = canvasWidth;
        originalCanvas.height = canvasHeight;

        // Set display size
        const displayWidth = 600;
        const aspectRatio = canvasHeight / canvasWidth;
        const displayHeight = displayWidth * aspectRatio;

        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;

        // Fill with white background
        originalCtx.fillStyle = '#ffffff';
        originalCtx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Draw image
        originalCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

        // Update display
        updateDisplay();
        applyTemperatureToCanvas(); // Apply initial temperature
      };

      img.onerror = (err) => {
        console.error('Failed to load image:', err, 'URL:', imageUrl);
      };

      img.src = imageUrl;
    };

    loadImage();
  }, [imageUrl, updateDisplay, applyTemperatureToCanvas]);

  // Re-apply temperature when it changes
  useEffect(() => {
    applyTemperatureToCanvas();
  }, [temperature, applyTemperatureToCanvas]);

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        const dataUrl = canvas.toDataURL('image/png', 0.9);
        onSave(dataUrl);
      } catch (err) {
        console.error('Failed to save canvas:', err);
      }
    }
  };

  const handleReset = () => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const originalCanvas = originalCanvasRef.current;
      if (originalCanvas) {
        const originalCtx = originalCanvas.getContext('2d');
        if (originalCtx) {
          originalCtx.clearRect(
            0,
            0,
            originalCanvas.width,
            originalCanvas.height
          );
          originalCtx.fillStyle = '#ffffff';
          originalCtx.fillRect(
            0,
            0,
            originalCanvas.width,
            originalCanvas.height
          );
          originalCtx.drawImage(
            img,
            0,
            0,
            originalCanvas.width,
            originalCanvas.height
          );
          setTemperature(0);
          updateDisplay();
          applyTemperatureToCanvas();
        }
      }
    };
    img.src = imageUrl;
  };

  // Handle scroll to trigger redraw
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !updateDisplay) return;

    let debounceTimeout: ReturnType<typeof setTimeout>;
    const handleScroll = () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        updateDisplay();
        applyTemperatureToCanvas();
      }, 50);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(debounceTimeout);
    };
  }, [updateDisplay, applyTemperatureToCanvas]);

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
            flex-direction: column;
            gap: 1rem;
          `}
        >
          {toolsUI}

          {/* Temperature and Reset Controls */}
          <div
            className={css`
              display: flex;
              gap: 1rem;
              align-items: center;
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
                gap: 0.5rem;
                min-width: 160px;
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
                Temperature
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
                  min="-100"
                  max="100"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  className={css`
                    flex: 1;
                    height: 6px;
                    background: ${temperature > 0
                      ? 'linear-gradient(to right, #f97316 0%, #ea580c 100%)'
                      : temperature < 0
                      ? 'linear-gradient(to right, #0ea5e9 0%, #0284c7 100%)'
                      : 'linear-gradient(to right, #e2e8f0 0%, #cbd5e1 100%)'};
                    border-radius: 3px;
                    outline: none;
                    cursor: pointer;

                    &::-webkit-slider-thumb {
                      appearance: none;
                      width: 20px;
                      height: 20px;
                      background: ${temperature > 0
                        ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                        : temperature < 0
                        ? 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)'
                        : 'linear-gradient(135deg, #64748b 0%, #475569 100%)'};
                      border-radius: 50%;
                      cursor: pointer;
                      box-shadow: 0 2px 8px
                        ${temperature > 0
                          ? 'rgba(249, 115, 22, 0.4)'
                          : temperature < 0
                          ? 'rgba(14, 165, 233, 0.4)'
                          : 'rgba(100, 116, 139, 0.3)'};
                      transition: all 0.2s ease;
                    }

                    &::-webkit-slider-thumb:hover {
                      transform: scale(1.1);
                      box-shadow: 0 4px 16px
                        ${temperature > 0
                          ? 'rgba(249, 115, 22, 0.5)'
                          : temperature < 0
                          ? 'rgba(14, 165, 233, 0.5)'
                          : 'rgba(100, 116, 139, 0.4)'};
                    }

                    &::-moz-range-thumb {
                      width: 20px;
                      height: 20px;
                      background: ${temperature > 0
                        ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                        : temperature < 0
                        ? 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)'
                        : 'linear-gradient(135deg, #64748b 0%, #475569 100%)'};
                      border-radius: 50%;
                      cursor: pointer;
                      border: none;
                      box-shadow: 0 2px 8px
                        ${temperature > 0
                          ? 'rgba(249, 115, 22, 0.4)'
                          : temperature < 0
                          ? 'rgba(14, 165, 233, 0.4)'
                          : 'rgba(100, 116, 139, 0.3)'};
                    }
                  `}
                />
                <div
                  className={css`
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    min-width: 3rem;
                    justify-content: center;
                  `}
                >
                  <span
                    className={css`
                      font-size: 1rem;
                    `}
                  >
                    {temperature > 0 ? '🔥' : temperature < 0 ? '❄️' : '🔅'}
                  </span>
                  <span
                    className={css`
                      font-size: 0.875rem;
                      font-weight: 600;
                      color: ${temperature > 0
                        ? '#f97316'
                        : temperature < 0
                        ? '#0ea5e9'
                        : Color.darkGray()};
                    `}
                  >
                    {temperature}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleReset}
              className={css`
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.75rem 1.25rem;
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                font-size: 0.875rem;
                transition: all 0.2s ease;
                box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
                margin-left: auto;

                &:hover {
                  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
                  transform: translateY(-1px);
                  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
                }
              `}
            >
              <span>↻</span>
              Reset
            </button>
          </div>
        </div>

        <div
          ref={containerRef}
          className={css`
            display: flex;
            justify-content: center;
            overflow: auto;
            max-height: 60vh;
            position: relative; // for absolute temp canvas
          `}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={toolsAPI.handleCanvasClick}
            onMouseMove={toolsAPI.draw}
            onMouseUp={toolsAPI.stopDrawing}
            onMouseLeave={toolsAPI.stopDrawing}
            onTouchStart={toolsAPI.handleTouchStart}
            onTouchMove={toolsAPI.handleTouchMove}
            onTouchEnd={toolsAPI.handleTouchEnd}
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

      <canvas ref={originalCanvasRef} style={{ display: 'none' }} />
    </div>
  );
}

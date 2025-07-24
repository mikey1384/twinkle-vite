import React, { useRef, useState, useEffect } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import DrawingTools from './DrawingTools';

interface ImageEditorProps {
  imageUrl?: string;
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
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isImageReady, setIsImageReady] = useState(false);

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
    referenceImageCanvasRef:
      originalCanvasRef as React.RefObject<HTMLCanvasElement>,
    getCanvasCoordinates
  });

  // Load image and draw to canvases
  useEffect(() => {
    setIsImageReady(false);

    if (!imageUrl) {
      // Handle blank canvas mode
      const canvas = canvasRef.current;
      const originalCanvas = originalCanvasRef.current;
      const drawingCanvas = drawingCanvasRef.current;
      if (!canvas || !originalCanvas || !drawingCanvas) return;

      const originalCtx = originalCanvas.getContext('2d');
      const drawingCtx = drawingCanvas.getContext('2d');
      if (!originalCtx || !drawingCtx) return;

      // Default canvas size for blank canvas
      const canvasWidth = 800;
      const canvasHeight = 600;

      // Set all canvas dimensions
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      originalCanvas.width = canvasWidth;
      originalCanvas.height = canvasHeight;
      drawingCanvas.width = canvasWidth;
      drawingCanvas.height = canvasHeight;

      // Set display size
      const displayWidth = 600;
      const aspectRatio = canvasHeight / canvasWidth;
      const displayHeight = displayWidth * aspectRatio;

      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;

      // Setup reference canvas with white background (no image)
      originalCtx.fillStyle = '#ffffff';
      originalCtx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Setup drawing canvas with transparent background
      drawingCtx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Update display after a brief delay to ensure everything is ready
      requestAnimationFrame(() => {
        updateDisplay();
        setIsImageReady(true);
      });

      return;
    }

    // Handle image loading mode
    const loadImage = () => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = canvasRef.current;
        const originalCanvas = originalCanvasRef.current;
        const drawingCanvas = drawingCanvasRef.current;
        if (!canvas || !originalCanvas || !drawingCanvas) return;

        const originalCtx = originalCanvas.getContext('2d');
        const drawingCtx = drawingCanvas.getContext('2d');
        if (!originalCtx || !drawingCtx) return;

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

        // Set all canvas dimensions
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        originalCanvas.width = canvasWidth;
        originalCanvas.height = canvasHeight;
        drawingCanvas.width = canvasWidth;
        drawingCanvas.height = canvasHeight;

        // Set display size
        const displayWidth = 600;
        const aspectRatio = canvasHeight / canvasWidth;
        const displayHeight = displayWidth * aspectRatio;

        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;

        // Setup reference canvas with white background and image
        originalCtx.fillStyle = '#ffffff';
        originalCtx.fillRect(0, 0, canvasWidth, canvasHeight);
        originalCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

        // Setup drawing canvas with transparent background
        drawingCtx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Update display after a brief delay to ensure everything is ready
        requestAnimationFrame(() => {
          updateDisplay();
          setIsImageReady(true);
        });
      };

      img.onerror = (err) => {
        console.error('Failed to load image:', err, 'URL:', imageUrl);
      };

      img.src = imageUrl;
    };

    loadImage();
  }, [imageUrl, updateDisplay]);

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
    const originalCanvas = originalCanvasRef.current;
    const drawingCanvas = drawingCanvasRef.current;
    if (originalCanvas && drawingCanvas) {
      const originalCtx = originalCanvas.getContext('2d');
      const drawingCtx = drawingCanvas.getContext('2d');
      if (originalCtx && drawingCtx) {
        // Reset reference canvas
        originalCtx.clearRect(
          0,
          0,
          originalCanvas.width,
          originalCanvas.height
        );
        originalCtx.fillStyle = '#ffffff';
        originalCtx.fillRect(0, 0, originalCanvas.width, originalCanvas.height);

        if (imageUrl) {
          // Reset to original image if there is one
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            originalCtx.drawImage(
              img,
              0,
              0,
              originalCanvas.width,
              originalCanvas.height
            );
            requestAnimationFrame(() => {
              updateDisplay();
            });
          };
          img.src = imageUrl;
        } else {
          // Just white background for blank canvas
          requestAnimationFrame(() => {
            updateDisplay();
          });
        }

        // Clear drawing canvas
        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
      }
    }
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
      }, 50);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(debounceTimeout);
    };
  }, [updateDisplay]);

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

          <div
            className={css`
              display: flex;
              justify-content: flex-end;
              padding: 1rem;
              background: white;
              border: 1px solid ${Color.borderGray()};
              border-radius: 12px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
            `}
          >
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
              opacity: ${isImageReady ? 1 : 0};
              transition: opacity 0.2s ease;
              touch-action: none;
            `}
          />

          {!isImageReady && (
            <div
              className={css`
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.75rem;
                color: ${Color.darkGray()};
              `}
            >
              <div
                className={css`
                  width: 24px;
                  height: 24px;
                  border: 2px solid ${Color.borderGray()};
                  border-top: 2px solid ${Color.logoBlue()};
                  border-radius: 50%;
                  animation: spin 0.8s linear infinite;

                  @keyframes spin {
                    0% {
                      transform: rotate(0deg);
                    }
                    100% {
                      transform: rotate(360deg);
                    }
                  }
                `}
              />
              <div
                className={css`
                  font-size: 0.875rem;
                  font-weight: 500;
                `}
              >
                Getting ready...
              </div>
            </div>
          )}
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
      <canvas ref={drawingCanvasRef} style={{ display: 'none' }} />
    </div>
  );
}

import React, { useRef, useState, useEffect } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import DrawingTools from './DrawingTools';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import { useAppContext, useKeyContext } from '~/contexts';
import { extractDrawingColorSettings } from './DrawingTools/colorSettings';

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
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const updateDisplayRef = useRef<() => void>(() => {});
  const lastSavedColorSettingsRef = useRef('');
  const queuedColorSettingsRef = useRef<{
    color: string;
    recentColors: string[];
    serialized: string;
  } | null>(null);
  const colorSaveInFlightRef = useRef(false);
  const colorSaveDebounceTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const updateImageEditorSettings = useAppContext(
    (v) => v.requestHelpers.updateImageEditorSettings
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const userId = useKeyContext((v) => v.myState.userId);
  const userSettings = useKeyContext((v) => v.myState.settings);
  const { color: initialDrawingColor, recentColors: initialRecentColors } =
    extractDrawingColorSettings(userSettings);

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
    drawingCanvasRef: drawingCanvasRef as React.RefObject<HTMLCanvasElement>,
    referenceImageCanvasRef:
      originalCanvasRef as React.RefObject<HTMLCanvasElement>,
    getCanvasCoordinates,
    initialColor: initialDrawingColor,
    initialRecentColors,
    onColorSettingsCommit: handlePersistDrawingColorSettings
  });

  // Keep the ref updated with the latest updateDisplay function
  useEffect(() => {
    updateDisplayRef.current = updateDisplay;
  }, [updateDisplay]);

  useEffect(() => {
    return () => {
      if (colorSaveDebounceTimeoutRef.current) {
        clearTimeout(colorSaveDebounceTimeoutRef.current);
        colorSaveDebounceTimeoutRef.current = null;
      }
      if (queuedColorSettingsRef.current) {
        void flushQueuedColorSettings();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load image and draw to canvases - only runs when imageUrl changes
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

      // Set responsive display size
      const maxDisplayWidth = Math.min(
        600,
        window.innerWidth * 0.8,
        window.innerHeight * 0.6
      );
      const aspectRatio = canvasHeight / canvasWidth;
      const maxDisplayHeight = window.innerHeight * 0.5;

      let displayWidth = maxDisplayWidth;
      let displayHeight = displayWidth * aspectRatio;

      // If height exceeds limit, scale down proportionally
      if (displayHeight > maxDisplayHeight) {
        displayHeight = maxDisplayHeight;
        displayWidth = displayHeight / aspectRatio;
      }

      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;

      // Setup reference canvas with white background (no image)
      originalCtx.fillStyle = '#ffffff';
      originalCtx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Setup drawing canvas with transparent background
      drawingCtx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Update display after a brief delay to ensure everything is ready
      requestAnimationFrame(() => {
        updateDisplayRef.current();
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

        // Set responsive display size
        const maxDisplayWidth = Math.min(
          600,
          window.innerWidth * 0.8,
          window.innerHeight * 0.6
        );
        const aspectRatio = canvasHeight / canvasWidth;
        const maxDisplayHeight = window.innerHeight * 0.5;

        let displayWidth = maxDisplayWidth;
        let displayHeight = displayWidth * aspectRatio;

        // If height exceeds limit, scale down proportionally
        if (displayHeight > maxDisplayHeight) {
          displayHeight = maxDisplayHeight;
          displayWidth = displayHeight / aspectRatio;
        }

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
          updateDisplayRef.current();
          setIsImageReady(true);
        });
      };

      img.onerror = (err) => {
        console.error('Failed to load image:', err, 'URL:', imageUrl);
      };

      img.src = imageUrl;
    };

    loadImage();
  }, [imageUrl]);

  // Handle scroll and resize to trigger redraw and canvas resizing
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let debounceTimeout: ReturnType<typeof setTimeout>;
    function handleScroll() {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        updateDisplayRef.current();
      }, 50);
    }

    function handleResize() {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Recalculate responsive display size
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const maxDisplayWidth = Math.min(
          600,
          window.innerWidth * 0.8,
          window.innerHeight * 0.6
        );
        const aspectRatio = canvasHeight / canvasWidth;
        const maxDisplayHeight = window.innerHeight * 0.5;

        let displayWidth = maxDisplayWidth;
        let displayHeight = displayWidth * aspectRatio;

        if (displayHeight > maxDisplayHeight) {
          displayHeight = maxDisplayHeight;
          displayWidth = displayHeight / aspectRatio;
        }

        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;

        updateDisplayRef.current();
      }, 100);
    }

    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      clearTimeout(debounceTimeout);
    };
  }, []);

  return (
    <>
      <Modal
        modalKey="ImageEditor"
        isOpen={true}
        onClose={handleCancel}
        title="Edit Image"
        size="lg"
        modalLevel={3}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={handleCancel}
              style={{ marginRight: '0.7rem' }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} color="blue">
              Save Changes
            </Button>
          </>
        }
      >
        <div
          className={css`
            display: flex;
            flex-direction: column;
            gap: 1rem;
            width: 100%;
            height: 100%;
          `}
        >
          {toolsUI}

          {imageUrl && (
            <div
              className={css`
                display: flex;
                justify-content: flex-end;
                padding-bottom: 0.5rem;
              `}
            >
              <Button
                onClick={handleReset}
                color="orange"
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              >
                <span>↻</span> Reset
              </Button>
            </div>
          )}

          <div
            ref={containerRef}
            className={css`
              display: flex;
              justify-content: center;
              overflow: auto;
              max-height: 60vh;
              position: relative;

              @media (max-width: 768px) {
                max-height: 55vh;
                overflow: visible;
              }
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
                border: 2px solid var(--ui-border);
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
                    border: 2px solid var(--ui-border);
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
        </div>

        <canvas ref={originalCanvasRef} style={{ display: 'none' }} />
        <canvas ref={drawingCanvasRef} style={{ display: 'none' }} />
      </Modal>
      {confirmModalShown && (
        <ConfirmModal
          modalOverModal
          modalLevel={4}
          title="Discard Drawing?"
          description="Are you sure you want to discard your drawing?"
          onHide={() => setConfirmModalShown(false)}
          onConfirm={handleConfirmModalConfirm}
        />
      )}
    </>
  );

  function handleSave() {
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        const dataUrl = canvas.toDataURL('image/png', 0.9);
        onSave(dataUrl);
      } catch (err) {
        console.error('Failed to save canvas:', err);
      }
    }
  }

  function handleReset() {
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
              updateDisplayRef.current();
            });
          };
          img.src = imageUrl;
        } else {
          // Just white background for blank canvas
          requestAnimationFrame(() => {
            updateDisplayRef.current();
          });
        }

        // Clear drawing canvas
        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
      }
    }
  }

  function handleCancel() {
    // Check if user has made any changes (canvas history has entries)
    if (toolsAPI.canvasHistory.length > 0) {
      setConfirmModalShown(true);
    } else {
      onCancel();
    }
  }

  function handleConfirmModalConfirm() {
    setConfirmModalShown(false);
    onCancel();
  }

  function getCursor() {
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
  }

  function handlePersistDrawingColorSettings({
    color,
    recentColors
  }: {
    color: string;
    recentColors: string[];
  }) {
    if (!userId) return;
    const serialized = JSON.stringify({ color, recentColors });
    if (lastSavedColorSettingsRef.current === serialized) return;
    queuedColorSettingsRef.current = { color, recentColors, serialized };
    if (colorSaveDebounceTimeoutRef.current) {
      clearTimeout(colorSaveDebounceTimeoutRef.current);
    }
    colorSaveDebounceTimeoutRef.current = setTimeout(() => {
      colorSaveDebounceTimeoutRef.current = null;
      void flushQueuedColorSettings();
    }, 150);
  }

  async function flushQueuedColorSettings() {
    if (!userId || colorSaveInFlightRef.current) return;
    const nextPayload = queuedColorSettingsRef.current;
    if (!nextPayload) return;
    if (nextPayload.serialized === lastSavedColorSettingsRef.current) {
      queuedColorSettingsRef.current = null;
      return;
    }
    queuedColorSettingsRef.current = null;
    colorSaveInFlightRef.current = true;
    try {
      const result = await updateImageEditorSettings({
        color: nextPayload.color,
        recentColors: nextPayload.recentColors
      });
      if (result?.settings) {
        lastSavedColorSettingsRef.current = nextPayload.serialized;
        onSetUserState({
          userId,
          newState: { settings: result.settings }
        });
      }
    } catch (error) {
      console.error('Failed to save image editor settings:', error);
    } finally {
      colorSaveInFlightRef.current = false;
      if (queuedColorSettingsRef.current) {
        void flushQueuedColorSettings();
      }
    }
  }
}

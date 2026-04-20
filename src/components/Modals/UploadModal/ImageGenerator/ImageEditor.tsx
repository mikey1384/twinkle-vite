import React, { useRef, useState, useEffect } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import DrawingTools from './DrawingTools';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import { useAppContext, useKeyContext } from '~/contexts';
import { extractDrawingColorSettings } from './DrawingTools/colorSettings';

const MIN_DRAW_CANVAS_WIDTH = 320;
const MAX_DRAW_CANVAS_WIDTH = 1000;

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
  const [imageLoadError, setImageLoadError] = useState<string | null>(null);
  const [imageLoadAttempt, setImageLoadAttempt] = useState(0);
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [containerWidth, setContainerWidth] = useState(0);
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

  const getCanvasCoordinates = (e: React.MouseEvent | React.PointerEvent) => {
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

  function resolveDisplayWidth() {
    const container = containerRef.current;
    const measuredWidth = Math.max(
      container?.clientWidth || 0,
      container?.offsetWidth || 0
    );
    if (measuredWidth > 0) {
      return measuredWidth;
    }
    const viewportWidth =
      typeof window === 'undefined' ? MAX_DRAW_CANVAS_WIDTH : window.innerWidth;
    return Math.min(
      Math.max(viewportWidth - 64, MIN_DRAW_CANVAS_WIDTH),
      MAX_DRAW_CANVAS_WIDTH
    );
  }

  const { toolsAPI, toolsUI, updateDisplay } = DrawingTools({
    canvasRef: canvasRef as React.RefObject<HTMLCanvasElement>,
    drawingCanvasRef: drawingCanvasRef as React.RefObject<HTMLCanvasElement>,
    referenceImageCanvasRef:
      originalCanvasRef as React.RefObject<HTMLCanvasElement>,
    getCanvasCoordinates,
    initialColor: initialDrawingColor,
    initialRecentColors,
    onColorSettingsCommit: handlePersistDrawingColorSettings,
    onReset: imageUrl ? handleReset : undefined,
    zoomPercent,
    onZoomChange: setZoomPercent
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

  // Load image and draw to canvases.
  useEffect(() => {
    setIsImageReady(false);
    setImageLoadError(null);
    let isCancelled = false;

    // Wait a frame so the container is laid out and we can measure its width
    const frameId = requestAnimationFrame(() => {
      if (isCancelled) return;
      const displayWidth = resolveDisplayWidth();
      setContainerWidth(displayWidth);

      if (!imageUrl) {
        setupBlankCanvas(displayWidth);
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (isCancelled) return;
        setImageLoadError(null);
        setupImageCanvas(img, displayWidth);
      };
      img.onerror = (err) => {
        if (isCancelled) return;
        console.error('Failed to load image:', err, 'URL:', imageUrl);
        setImageLoadError(
          'Failed to load image. The source may have expired or is unavailable.'
        );
        setIsImageReady(false);
      };
      img.src = imageUrl;
    });

    return () => {
      isCancelled = true;
      cancelAnimationFrame(frameId);
    };
  }, [imageUrl, imageLoadAttempt]);

  function setupBlankCanvas(displayWidth: number) {
    const canvas = canvasRef.current;
    const originalCanvas = originalCanvasRef.current;
    const drawingCanvas = drawingCanvasRef.current;
    if (!canvas || !originalCanvas || !drawingCanvas) return;

    const originalCtx = originalCanvas.getContext('2d');
    const drawingCtx = drawingCanvas.getContext('2d');
    if (!originalCtx || !drawingCtx) return;

    const canvasWidth = displayWidth;
    const canvasHeight = Math.round(displayWidth * 0.75);

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    originalCanvas.width = canvasWidth;
    originalCanvas.height = canvasHeight;
    drawingCanvas.width = canvasWidth;
    drawingCanvas.height = canvasHeight;

    originalCtx.fillStyle = '#ffffff';
    originalCtx.fillRect(0, 0, canvasWidth, canvasHeight);
    drawingCtx.clearRect(0, 0, canvasWidth, canvasHeight);

    requestAnimationFrame(() => {
      updateDisplayRef.current();
      setIsImageReady(true);
    });
  }

  function setupImageCanvas(img: HTMLImageElement, displayWidth: number) {
    const canvas = canvasRef.current;
    const originalCanvas = originalCanvasRef.current;
    const drawingCanvas = drawingCanvasRef.current;
    if (!canvas || !originalCanvas || !drawingCanvas) return;

    const originalCtx = originalCanvas.getContext('2d');
    const drawingCtx = drawingCanvas.getContext('2d');
    if (!originalCtx || !drawingCtx) return;

    let canvasWidth = img.naturalWidth;
    let canvasHeight = img.naturalHeight;

    if (canvasWidth === 0 || canvasHeight === 0) {
      console.error('Image has zero dimensions');
      return;
    }

    const maxCanvasSize = 2048;
    if (canvasWidth > maxCanvasSize || canvasHeight > maxCanvasSize) {
      const scale = Math.min(
        maxCanvasSize / canvasWidth,
        maxCanvasSize / canvasHeight
      );
      canvasWidth = Math.floor(canvasWidth * scale);
      canvasHeight = Math.floor(canvasHeight * scale);
    }

    // Scale up small images so brush sizes match displayed pixels
    if (canvasWidth < displayWidth) {
      const scale = Math.min(displayWidth / canvasWidth, maxCanvasSize / canvasHeight);
      canvasWidth = Math.floor(canvasWidth * scale);
      canvasHeight = Math.floor(canvasHeight * scale);
    }

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    originalCanvas.width = canvasWidth;
    originalCanvas.height = canvasHeight;
    drawingCanvas.width = canvasWidth;
    drawingCanvas.height = canvasHeight;

    originalCtx.fillStyle = '#ffffff';
    originalCtx.fillRect(0, 0, canvasWidth, canvasHeight);
    originalCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
    drawingCtx.clearRect(0, 0, canvasWidth, canvasHeight);

    requestAnimationFrame(() => {
      updateDisplayRef.current();
      setIsImageReady(true);
    });
  }

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
        if (containerRef.current) {
          setContainerWidth(resolveDisplayWidth());
        }
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
        hasHeader={false}
        showCloseButton={false}
        size="xl"
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
            <Button
              onClick={handleSave}
              color="blue"
              disabled={!isImageReady || !!imageLoadError}
            >
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
          <div
            className={css`
              position: sticky;
              top: 0;
              z-index: 5;
              background: white;
              padding-bottom: 0.5rem;
            `}
          >
            {toolsUI}
          </div>

          <div
            ref={containerRef}
            className={css`
              width: 100%;
              position: relative;
              display: flex;
              overflow: auto;
              flex: 1;
              min-height: 0;
              cursor: ${isImageReady && !imageLoadError ? getCursor() : 'progress'};
            `}
          >
            <canvas
              ref={canvasRef}
              onPointerDown={toolsAPI.handlePointerDown}
              onPointerMove={toolsAPI.handlePointerMove}
              onPointerUp={toolsAPI.handlePointerUp}
              onPointerLeave={toolsAPI.handlePointerLeave}
              onPointerCancel={toolsAPI.handlePointerLeave}
              onTouchStart={toolsAPI.handleTouchStart}
              onTouchMove={toolsAPI.handleTouchMove}
              onTouchEnd={toolsAPI.handleTouchEnd}
              style={{
                width:
                  zoomPercent === 100
                    ? '100%'
                    : `${(containerWidth * zoomPercent) / 100}px`,
                height: 'auto',
                margin: 'auto',
                flexShrink: 0,
                pointerEvents: isImageReady ? 'auto' : 'none'
              }}
              className={css`
                background: white;
                cursor: ${getCursor()};
                border: 2px solid var(--ui-border);
                border-radius: 8px;
                opacity: ${isImageReady ? 1 : 0};
                transition: opacity 0.2s ease;
                touch-action: none;
              `}
            />

            {!isImageReady && !imageLoadError && (
              <div
                className={css`
                  position: absolute;
                  inset: 0;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  gap: 0.75rem;
                  color: ${Color.darkGray()};
                  background: rgba(255, 255, 255, 0.85);
                  pointer-events: none;
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
                    font-size: 1rem;
                    font-weight: 500;
                  `}
                >
                  Getting ready...
                </div>
              </div>
            )}

            {!!imageLoadError && (
              <div
                className={css`
                  position: absolute;
                  inset: 0;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  gap: 0.75rem;
                  text-align: center;
                  color: ${Color.darkGray()};
                  background: rgba(255, 255, 255, 0.92);
                  padding: 1rem;
                `}
              >
                <div
                  className={css`
                    font-size: 1rem;
                    font-weight: 600;
                    max-width: 360px;
                  `}
                >
                  {imageLoadError}
                </div>
                <Button
                  color="blue"
                  onClick={handleRetryImageLoad}
                  disabled={!imageUrl}
                >
                  Retry Loading Image
                </Button>
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
    if (!isImageReady || imageLoadError) return;
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
        // For image editing flows, keep the original reference image already
        // present in originalCanvas and only clear the drawing overlay.
        if (!imageUrl) {
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
        }

        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        requestAnimationFrame(() => {
          updateDisplayRef.current();
        });
      }
    }
  }

  function handleRetryImageLoad() {
    if (!imageUrl) return;
    setImageLoadAttempt((attempt) => attempt + 1);
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

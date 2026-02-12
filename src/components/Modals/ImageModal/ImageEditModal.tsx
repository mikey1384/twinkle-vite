import React, {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback
} from 'react';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { socket } from '~/constants/sockets/api';
import { useAppContext, useKeyContext } from '~/contexts';
import {
  dataUrlToBlob,
  extractBase64FromDataUrl
} from '~/helpers/imageHelpers';
import API_URL from '~/constants/URL';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import Textarea from '~/components/Texts/Textarea';
import DrawingTools from '~/components/Modals/UploadModal/ImageGenerator/DrawingTools';
import { extractDrawingColorSettings } from '~/components/Modals/UploadModal/ImageGenerator/DrawingTools/colorSettings';

const IMAGE_GENERATION_COST = 10000;

// Helper to get proxied URL for CloudFront images
function getProxiedUrl(imageUrl: string): string {
  // If it's a CloudFront URL, proxy through backend
  if (
    imageUrl.includes('cloudfront.net') ||
    imageUrl.includes('s3.amazonaws.com')
  ) {
    return `${API_URL}/content/image/proxy?url=${encodeURIComponent(imageUrl)}`;
  }
  // If it's already a data URL or local URL, use directly
  return imageUrl;
}

interface ImageEditModalProps {
  imageUrl: string;
  onClose: () => void;
  embedded?: boolean;
  onConfirm?: (imageDataUrl: string) => void;
  onUseImageAvailabilityChange?: (available: boolean) => void;
  onRegisterUseImageHandler?: (
    handler: (() => void | Promise<void>) | null
  ) => void;
}

export default function ImageEditModal({
  imageUrl,
  onClose,
  embedded = false,
  onConfirm,
  onUseImageAvailabilityChange,
  onRegisterUseImageHandler
}: ImageEditModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isGeneratingRef = useRef(false);
  const clearDrawingOverlayRef = useRef<() => void>(() => {});
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

  const [isImageReady, setIsImageReady] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressStage, setProgressStage] = useState<string>('not_started');
  const [partialImageData, setPartialImageData] = useState<string | null>(null);

  const generateAIImage = useAppContext(
    (v) => v.requestHelpers.generateAIImage
  );
  const updateImageEditorSettings = useAppContext(
    (v) => v.requestHelpers.updateImageEditorSettings
  );
  const twinkleCoins = useKeyContext((v) => v.myState.twinkleCoins);
  const userId = useKeyContext((v) => v.myState.userId);
  const userSettings = useKeyContext((v) => v.myState.settings);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const { color: initialDrawingColor, recentColors: initialRecentColors } =
    extractDrawingColorSettings(userSettings);

  const canAffordGeneration = useMemo(() => {
    return twinkleCoins >= IMAGE_GENERATION_COST;
  }, [twinkleCoins]);

  // Handle "Use This Image" for embedded mode
  const handleUseThisImage = useCallback(() => {
    if (!canvasRef.current || !onConfirm) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    onConfirm(dataUrl);
  }, [onConfirm]);

  // Notify parent about image availability and register handler
  useEffect(() => {
    if (embedded) {
      onUseImageAvailabilityChange?.(isImageReady && !isGenerating);
    }
  }, [embedded, isImageReady, isGenerating, onUseImageAvailabilityChange]);

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

  useEffect(() => {
    if (embedded && onRegisterUseImageHandler) {
      onRegisterUseImageHandler(handleUseThisImage);
      return () => onRegisterUseImageHandler(null);
    }
  }, [embedded, onRegisterUseImageHandler, handleUseThisImage]);

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
    disabled: isGenerating,
    initialColor: initialDrawingColor,
    initialRecentColors,
    onColorSettingsCommit: handlePersistDrawingColorSettings
  });

  // Keep refs updated to avoid stale closures
  clearDrawingOverlayRef.current = toolsAPI.clearDrawingOverlay;
  updateDisplayRef.current = updateDisplay;

  // Load image onto canvas
  useEffect(() => {
    setIsImageReady(false);

    const loadImage = async () => {
      try {
        // Use proxied URL for CloudFront images to bypass CORS
        const proxiedUrl = getProxiedUrl(imageUrl);

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

          // Let CSS handle responsive sizing - canvas fills its container
          canvas.style.width = '100%';
          canvas.style.height = 'auto';

          // Setup reference canvas with white background and image
          originalCtx.fillStyle = '#ffffff';
          originalCtx.fillRect(0, 0, canvasWidth, canvasHeight);
          originalCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

          // Setup drawing canvas with transparent background
          drawingCtx.clearRect(0, 0, canvasWidth, canvasHeight);

          requestAnimationFrame(() => {
            updateDisplayRef.current();
            setIsImageReady(true);
          });
        };

        img.onerror = () => {
          console.error('Failed to load image:', imageUrl);
          setError('Failed to load image');
        };

        img.src = proxiedUrl;
      } catch (err) {
        console.error('Failed to load image:', err);
        setError('Failed to load image');
      }
    };

    loadImage();
  }, [imageUrl]);

  const loadImageOntoCanvas = useCallback((newImageUrl: string) => {
    // Use proxied URL for CloudFront images
    const proxiedUrl = getProxiedUrl(newImageUrl);

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

      // Use AI image's natural dimensions
      const maxCanvasSize = 2048;
      let canvasWidth = img.naturalWidth;
      let canvasHeight = img.naturalHeight;

      if (canvasWidth > maxCanvasSize || canvasHeight > maxCanvasSize) {
        const scale = Math.min(
          maxCanvasSize / canvasWidth,
          maxCanvasSize / canvasHeight
        );
        canvasWidth = Math.floor(canvasWidth * scale);
        canvasHeight = Math.floor(canvasHeight * scale);
      }

      // Resize all canvases to match AI image dimensions
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      originalCanvas.width = canvasWidth;
      originalCanvas.height = canvasHeight;
      drawingCanvas.width = canvasWidth;
      drawingCanvas.height = canvasHeight;

      // Let CSS handle responsive sizing - canvas fills its container
      canvas.style.width = '100%';
      canvas.style.height = 'auto';

      // Draw AI image at its natural size
      originalCtx.fillStyle = '#ffffff';
      originalCtx.fillRect(0, 0, canvasWidth, canvasHeight);
      originalCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

      // Clear drawing canvas
      drawingCtx.clearRect(0, 0, canvasWidth, canvasHeight);

      requestAnimationFrame(() => {
        updateDisplayRef.current();
      });
    };

    img.onerror = () => {
      setError('Failed to load AI-generated image');
    };

    img.src = proxiedUrl;
  }, []);

  // Socket listener for AI generation status
  useEffect(() => {
    const handleImageGenerationStatus = (status: {
      stage: string;
      partialImageB64?: string;
      imageUrl?: string;
      error?: string;
      message?: string;
      coins?: number;
    }) => {
      try {
        setProgressStage(status.stage);

        if (status.stage === 'partial_image' && status.partialImageB64) {
          setPartialImageData(
            `data:image/png;base64,${status.partialImageB64}`
          );
        } else if (status.stage === 'completed') {
          if (status.imageUrl) {
            // Clear any existing drawings before loading the new AI image
            clearDrawingOverlayRef.current();
            // Load the new AI-generated image onto the canvas
            loadImageOntoCanvas(status.imageUrl);
          }

          if (typeof status.coins === 'number' && userId) {
            onSetUserState({
              userId,
              newState: { twinkleCoins: status.coins }
            });
          }

          isGeneratingRef.current = false;
          setIsGenerating(false);
          setPartialImageData(null);
          setPrompt('');
        } else if (status.stage === 'error') {
          const errorMessage =
            status.error ||
            status.message ||
            'An error occurred during image generation';
          setError(errorMessage);

          if (typeof status.coins === 'number' && userId) {
            onSetUserState({
              userId,
              newState: { twinkleCoins: status.coins }
            });
          }

          isGeneratingRef.current = false;
          setIsGenerating(false);
          setProgressStage('not_started');
          setPartialImageData(null);
        }
      } catch (err) {
        console.error('Error handling image generation status:', err);
        setError('Error processing image generation response');
        isGeneratingRef.current = false;
        setIsGenerating(false);
        setProgressStage('not_started');
        setPartialImageData(null);
      }
    };

    socket.on('image_generation_status_received', handleImageGenerationStatus);

    return () => {
      socket.off(
        'image_generation_status_received',
        handleImageGenerationStatus
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, loadImageOntoCanvas]);

  const content = (
    <>
      <div
        className={css`
          display: flex;
          flex-direction: column;
          gap: 1rem;
          width: 100%;
          max-height: 100%;
          overflow-y: auto;
        `}
      >
        {/* Error Display - at top for visibility */}
        {error && (
          <div
            className={css`
              padding: 0.75rem 1rem;
              background: ${Color.rose(0.1)};
              border: 1px solid ${Color.rose()};
              border-radius: 8px;
              color: ${Color.rose()};
              display: flex;
              justify-content: space-between;
              align-items: center;
            `}
          >
            <span>{error}</span>
            <Button
              variant="ghost"
              onClick={() => setError(null)}
              style={{ padding: '0.25rem 0.5rem' }}
            >
              <Icon icon="times" />
            </Button>
          </div>
        )}

        {/* Canvas Container - THE MAIN FOCUS */}
        <div
          ref={containerRef}
          className={css`
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 200px;
            position: relative;
            background-color: ${Color.lightGray()};
            background-image:
              linear-gradient(
                45deg,
                ${Color.borderGray()} 25%,
                transparent 25%
              ),
              linear-gradient(
                -45deg,
                ${Color.borderGray()} 25%,
                transparent 25%
              ),
              linear-gradient(
                45deg,
                transparent 75%,
                ${Color.borderGray()} 75%
              ),
              linear-gradient(
                -45deg,
                transparent 75%,
                ${Color.borderGray()} 75%
              );
            background-size: 20px 20px;
            background-position:
              0 0,
              0 10px,
              10px -10px,
              -10px 0px;
            border-radius: 8px;
            padding: 1rem;
            flex-shrink: 0;
          `}
        >
          {/* Loading State */}
          {!isImageReady && (
            <div
              className={css`
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 10;
              `}
            >
              <Loading />
            </div>
          )}

          {/* Partial Image Preview (during AI generation) */}
          {partialImageData && (
            <div
              className={css`
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 5;
              `}
            >
              <img
                src={partialImageData}
                alt="Generating..."
                className={css`
                  max-width: 100%;
                  border-radius: 4px;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                `}
              />
            </div>
          )}

          {/* Main Canvas */}
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
              border-radius: 4px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
              max-width: 100%;
              opacity: ${isImageReady ? (isGenerating ? 0.5 : 1) : 0};
              transition: opacity 0.2s ease;
              /* pan-x pan-y is intentional: React 19 onTouch* handlers are
                 non-passive, so preventDefault() reliably suppresses native
                 scroll for single-finger drawing while allowing two-finger pan. */
              touch-action: pan-x pan-y;
            `}
          />
        </div>

        {/* Drawing Tools Section */}
        <div
          className={css`
            background: ${Color.highlightGray()};
            border-radius: 8px;
            padding: 1rem;
          `}
        >
          <div
            className={css`
              display: flex;
              align-items: center;
              gap: 0.5rem;
              font-weight: bold;
              color: ${Color.darkerGray()};
              margin-bottom: 0.75rem;
            `}
          >
            <Icon icon="pencil-alt" />
            <span>Drawing Tools</span>
          </div>
          {toolsUI}
        </div>

        {/* AI Modification Section */}
        <div
          className={css`
            background: ${Color.highlightGray()};
            border-radius: 8px;
            padding: 1rem;
          `}
        >
          <div
            className={css`
              display: flex;
              align-items: center;
              gap: 0.5rem;
              font-weight: bold;
              color: ${Color.darkerGray()};
              margin-bottom: 0.75rem;
            `}
          >
            <Icon icon="wand-magic-sparkles" />
            <span>AI Modification</span>
          </div>
          <div
            className={css`
              display: flex;
              gap: 0.75rem;
              @media (max-width: ${mobileMaxWidth}) {
                flex-direction: column;
              }
            `}
          >
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe how you want to modify the image..."
              disabled={isGenerating}
              minRows={3}
              style={{ flex: 1 }}
              onKeyDown={handlePromptKeyDown}
            />
            <div
              className={css`
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.5rem;
              `}
            >
              <Button
                color="logoBlue"
                onClick={handleGenerate}
                disabled={
                  !prompt.trim() || isGenerating || !canAffordGeneration
                }
                loading={isGenerating}
                style={{ minWidth: '120px' }}
              >
                {isGenerating ? getProgressLabel() : 'Generate'}
              </Button>
              <div
                className={css`
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  font-size: 0.85rem;
                  color: ${canAffordGeneration
                    ? Color.darkGray()
                    : Color.rose()};
                `}
              >
                <span>{IMAGE_GENERATION_COST.toLocaleString()} coins</span>
                <span>(You have: {twinkleCoins?.toLocaleString() || 0})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden canvases for drawing operations */}
      <canvas ref={originalCanvasRef} style={{ display: 'none' }} />
      <canvas ref={drawingCanvasRef} style={{ display: 'none' }} />
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <Modal
      modalKey="ImageEditModal"
      isOpen
      onClose={onClose}
      title="Edit Image"
      size="xl"
      modalLevel={2}
      footer={
        <>
          <Button
            color="orange"
            onClick={handleDownload}
            disabled={!isImageReady}
          >
            <Icon icon="download" />
            <span style={{ marginLeft: '0.5rem' }}>Download</span>
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            style={{ marginLeft: '0.7rem' }}
          >
            Close
          </Button>
        </>
      }
    >
      {content}
    </Modal>
  );

  function handlePromptKeyDown(e: React.KeyboardEvent) {
    if (e.key !== 'Enter' || isGenerating) return;
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    handleGenerate();
  }

  async function handleGenerate() {
    if (!prompt.trim() || isGenerating || isGeneratingRef.current) return;

    if (!canAffordGeneration) {
      setError(
        `Insufficient coins. You need ${IMAGE_GENERATION_COST.toLocaleString()} coins to generate an image.`
      );
      return;
    }

    isGeneratingRef.current = true;
    setIsGenerating(true);
    setError(null);
    setProgressStage('prompt_ready');
    setPartialImageData(null);

    try {
      // Get current canvas state as base64
      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error('Canvas not available');
      }

      const dataUrl = canvas.toDataURL('image/png');
      const referenceB64 = extractBase64FromDataUrl(dataUrl);

      const result = await generateAIImage({
        prompt: prompt.trim(),
        referenceImageB64: referenceB64,
        engine: 'openai'
      });

      if (!result.success) {
        const isStreamingActive =
          progressStage === 'partial_image' || partialImageData !== null;

        if (!isStreamingActive) {
          const errorMessage = result.error || 'Failed to generate image';
          setError(errorMessage);

          if (typeof result.coins === 'number' && userId) {
            onSetUserState({
              userId,
              newState: { twinkleCoins: result.coins }
            });
          }

          isGeneratingRef.current = false;
          setIsGenerating(false);
          setProgressStage('not_started');
        }
        // If streaming is active, don't show error - let socket determine final state
      }
    } catch (err) {
      console.error('Image generation error:', err);
      // Only show network error if socket streaming hasn't started
      const isStreamingActive =
        progressStage === 'partial_image' || partialImageData !== null;

      if (!isStreamingActive) {
        setError(
          'Network error: Unable to connect to image generation service'
        );
        isGeneratingRef.current = false;
        setIsGenerating(false);
        setProgressStage('not_started');
      }
      // If streaming is active, socket will handle final state
    }
  }

  async function handleDownload() {
    try {
      // If streaming partial image, download that instead
      const dataUrl =
        partialImageData || canvasRef.current?.toDataURL('image/png');
      if (!dataUrl) return;

      const blob = dataUrlToBlob(dataUrl);
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `edited-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download image:', err);
      setError('Failed to download image');
    }
  }

  function getProgressLabel() {
    switch (progressStage) {
      case 'prompt_ready':
        return 'Generating image...';
      case 'calling_openai':
        return 'Calling OpenAI...';
      case 'in_progress':
        return 'Processing...';
      case 'generating':
        return 'Generating image...';
      case 'partial_image':
        return 'Streaming image...';
      case 'completed':
        return 'Image generated!';
      default:
        return 'Generating...';
    }
  }

  function getCursor() {
    if (isGenerating) return 'wait';
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

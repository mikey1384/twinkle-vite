import 'react-image-crop/dist/ReactCrop.css';
import React, { useEffect, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import ReactCrop, {
  type Crop,
  type PixelCrop
} from 'react-image-crop';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import API_URL from '~/constants/URL';
import { convertToWebFriendlyFormat } from '~/helpers/imageHelpers';
import StatusDots from '~/containers/Chat/Message/MessageBody/TextMessage/ThinkingIndicator/StatusDots';
import UploadModal from '~/components/Modals/UploadModal';

const THUMBNAIL_ASPECT_RATIO = 16 / 9;

export interface ThumbnailOption {
  id: string;
  thumbnailUrl: string;
  sourceBuildId: number;
  sourceType: 'main' | 'branch';
  sourceLabel: string;
  sourceTitle?: string | null;
  username?: string | null;
  usedAt?: number | null;
  isCurrent?: boolean;
}

function buildInitialThumbnailCrop(image: HTMLImageElement): Crop {
  const imageWidth = Math.max(1, image.width);
  const imageHeight = Math.max(1, image.height);
  const imageAspectRatio = imageWidth / imageHeight;

  if (imageAspectRatio >= THUMBNAIL_ASPECT_RATIO) {
    const width = imageHeight * THUMBNAIL_ASPECT_RATIO;
    return {
      unit: 'px',
      x: (imageWidth - width) / 2,
      y: 0,
      width,
      height: imageHeight
    };
  }

  const height = imageWidth / THUMBNAIL_ASPECT_RATIO;
  return {
    unit: 'px',
    x: 0,
    y: (imageHeight - height) / 2,
    width: imageWidth,
    height
  };
}

function getEditableCanvasImageUrl(imageUrl: string) {
  const normalizedImageUrl = String(imageUrl || '').trim();
  if (!normalizedImageUrl) return '';
  if (
    normalizedImageUrl.startsWith('data:') ||
    normalizedImageUrl.startsWith('blob:') ||
    normalizedImageUrl.startsWith('/')
  ) {
    return normalizedImageUrl;
  }
  if (
    normalizedImageUrl.includes('cloudfront.net') ||
    normalizedImageUrl.includes('s3.amazonaws.com')
  ) {
    return `${API_URL}/content/image/proxy?url=${encodeURIComponent(normalizedImageUrl)}`;
  }
  return normalizedImageUrl;
}

function canEditImageUrlInCanvas(imageUrl: string) {
  const normalizedImageUrl = String(imageUrl || '').trim();
  if (!normalizedImageUrl) return false;
  if (
    normalizedImageUrl.startsWith('data:') ||
    normalizedImageUrl.startsWith('blob:')
  ) {
    return true;
  }
  if (normalizedImageUrl.startsWith('/')) {
    return true;
  }
  try {
    const parsedUrl = new URL(normalizedImageUrl, window.location.href);
    if (parsedUrl.origin === window.location.origin) {
      return true;
    }
    return parsedUrl.pathname.endsWith('/content/image/proxy');
  } catch {
    return false;
  }
}

function formatThumbnailUsedAt(usedAt?: number | null) {
  const timestamp = Math.floor(Number(usedAt || 0));
  if (!timestamp) return 'Saved thumbnail';
  return new Date(timestamp * 1000).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });
}

export default function ThumbnailModal({
  initialImageUrl,
  thumbnailOptions = [],
  thumbnailOptionsLoading = false,
  loading = false,
  saveError = '',
  onHide,
  onSave,
  onCaptureFromPreview
}: {
  initialImageUrl?: string | null;
  thumbnailOptions?: ThumbnailOption[];
  thumbnailOptionsLoading?: boolean;
  loading?: boolean;
  saveError?: string;
  onHide: () => void;
  onSave: (croppedImageUrl: string | null) => void | Promise<void>;
  onCaptureFromPreview?: () => Promise<string>;
}) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [sourceImageUrl, setSourceImageUrl] = useState('');
  const [croppedImageUrl, setCroppedImageUrl] = useState('');
  const [processingImage, setProcessingImage] = useState(false);
  const [capturingPreview, setCapturingPreview] = useState(false);
  const [uploadModalShown, setUploadModalShown] = useState(false);
  const [error, setError] = useState('');
  const [selectedThumbnailUrl, setSelectedThumbnailUrl] = useState('');
  const canEditSourceImage = canEditImageUrlInCanvas(sourceImageUrl);

  useEffect(() => {
    const nextInitialImageUrl = String(initialImageUrl || '').trim();
    setCrop(undefined);
    setCroppedImageUrl('');
    setError('');
    setSelectedThumbnailUrl(nextInitialImageUrl);
    setSourceImageUrl(getEditableCanvasImageUrl(nextInitialImageUrl));
  }, [initialImageUrl]);

  const canCaptureFromPreview = Boolean(onCaptureFromPreview);
  const shouldAllowRemove = Boolean(sourceImageUrl || initialImageUrl);
  const willRemoveThumbnail = !sourceImageUrl && Boolean(initialImageUrl);
  const saveDisabled =
    loading ||
    processingImage ||
    capturingPreview ||
    (!croppedImageUrl && !willRemoveThumbnail);

  return (
    <Modal
      modalKey="ThumbnailModal"
      isOpen
      onClose={loading ? () => {} : onHide}
      closeOnBackdropClick={false}
      title="Thumbnail"
      size="xl"
      footer={
        <div>
          <Button
            variant="ghost"
            disabled={loading}
            onClick={onHide}
            style={{ marginRight: '0.7rem' }}
          >
            Cancel
          </Button>
          <Button color="logoBlue" disabled={saveDisabled} onClick={handleSave}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      }
    >
      <div
        className={css`
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(15rem, 18rem);
          gap: 1rem;
          width: 100%;

          @media (max-width: 760px) {
            grid-template-columns: 1fr;
          }
        `}
      >
        <div
          className={css`
            display: flex;
            min-width: 0;
            flex-direction: column;
            gap: 1rem;
          `}
        >
        <div
          className={css`
            display: flex;
            gap: 0.7rem;
            flex-wrap: wrap;
            justify-content: center;
          `}
        >
          <Button
            variant="ghost"
            disabled={!canCaptureFromPreview || capturingPreview || loading}
            onClick={handleCaptureFromPreview}
          >
            <Icon icon="camera-alt" />
            <span style={{ marginLeft: '0.7rem' }}>Use preview</span>
          </Button>
          <Button
            variant="ghost"
            disabled={processingImage || loading}
            onClick={() => setUploadModalShown(true)}
          >
            <Icon icon="image" />
            <span style={{ marginLeft: '0.7rem' }}>Upload image</span>
          </Button>
          {shouldAllowRemove && (
            <Button
              variant="ghost"
              disabled={loading}
              onClick={handleRemoveImage}
            >
              <Icon icon="trash-alt" />
              <span style={{ marginLeft: '0.7rem' }}>Remove</span>
            </Button>
          )}
        </div>
        <div
          className={css`
            width: 100%;
            min-height: 24rem;
            border: 1px solid var(--ui-border);
            border-radius: 16px;
            background: #fff;
            overflow: hidden;
          `}
        >
          {processingImage || capturingPreview ? (
            <div
              className={css`
                width: 100%;
                min-height: 24rem;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 0.9rem;
                color: ${Color.darkGray()};
              `}
            >
              <StatusDots color={Color.darkGray()} />
              <div
                className={css`
                  font-size: 1.1rem;
                  font-weight: 700;
                  letter-spacing: 0.01em;
                `}
              >
                {capturingPreview ? 'Capturing preview' : 'Loading image'}
              </div>
            </div>
          ) : sourceImageUrl ? (
            <div
              className={css`
                width: 100%;
                min-height: 24rem;
                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center;
                padding: 1rem;
                box-sizing: border-box;
              `}
            >
              {canEditSourceImage ? (
                <ReactCrop
                  crop={crop}
                  aspect={THUMBNAIL_ASPECT_RATIO}
                  minWidth={120}
                  minHeight={68}
                  keepSelection
                  ruleOfThirds
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(pixelCrop) => {
                    void updateCroppedImage(pixelCrop);
                  }}
                >
                  <img
                    ref={imageRef}
                    alt="Build thumbnail"
                    src={sourceImageUrl}
                    crossOrigin="anonymous"
                    onLoad={handleImageLoad}
                    className={css`
                      max-width: 100%;
                      max-height: 65vh;
                      object-fit: contain;
                    `}
                  />
                </ReactCrop>
              ) : (
                <img
                  ref={imageRef}
                  alt="Build thumbnail"
                  src={sourceImageUrl}
                  onLoad={(event) => {
                    imageRef.current = event.currentTarget;
                    setCrop(undefined);
                    setCroppedImageUrl('');
                  }}
                  className={css`
                    max-width: 100%;
                    max-height: 65vh;
                    object-fit: contain;
                  `}
                />
              )}
            </div>
          ) : (
            <div
              className={css`
                width: 100%;
                min-height: 24rem;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 0.9rem;
                color: ${Color.darkGray()};
                text-align: center;
                padding: 2rem;
              `}
            >
              <Icon icon="image" size="3x" style={{ opacity: 0.45 }} />
              <div
                className={css`
                  font-size: 1.15rem;
                  font-weight: 700;
                `}
              >
                No thumbnail selected
              </div>
            </div>
          )}
        </div>
        {error || saveError ? (
          <div
            className={css`
              color: ${Color.red()};
              font-size: 1.1rem;
              line-height: 1.5;
            `}
          >
            {error || saveError}
          </div>
        ) : null}
        </div>
        <aside
          className={css`
            min-width: 0;
            max-height: 33rem;
            overflow: hidden;
            border: 1px solid var(--ui-border);
            border-radius: 12px;
            background: #fff;
            display: flex;
            flex-direction: column;
          `}
        >
          <div
            className={css`
              padding: 0.85rem 0.9rem;
              border-bottom: 1px solid var(--ui-border);
              font-size: 1.05rem;
              font-weight: 800;
              color: ${Color.black()};
            `}
          >
            Saved thumbnails
          </div>
          <div
            className={css`
              display: flex;
              flex-direction: column;
              gap: 0.65rem;
              padding: 0.75rem;
              overflow-y: auto;
            `}
          >
            {thumbnailOptionsLoading ? (
              <div
                className={css`
                  min-height: 8rem;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: ${Color.darkGray()};
                `}
              >
                <StatusDots color={Color.darkGray()} />
              </div>
            ) : thumbnailOptions.length > 0 ? (
              thumbnailOptions.map((option) => {
                const isSelected =
                  String(option.thumbnailUrl || '').trim() ===
                  selectedThumbnailUrl;
                return (
                  <button
                    key={option.id || option.thumbnailUrl}
                    type="button"
                    onClick={() => handleSelectExistingThumbnail(option)}
                    className={css`
                      width: 100%;
                      border: 2px solid
                        ${isSelected ? Color.logoBlue() : 'var(--ui-border)'};
                      border-radius: 8px;
                      background: ${isSelected ? '#edf4ff' : '#fff'};
                      padding: 0.45rem;
                      text-align: left;
                      cursor: pointer;
                      transition:
                        border-color 120ms ease,
                        background 120ms ease;

                      &:hover {
                        border-color: ${Color.logoBlue()};
                        background: #f5f9ff;
                      }
                    `}
                  >
                    <div
                      className={css`
                        width: 100%;
                        aspect-ratio: 16 / 9;
                        overflow: hidden;
                        border-radius: 6px;
                        background: #eef1f5;
                      `}
                    >
                      <img
                        src={option.thumbnailUrl}
                        alt={`${option.sourceLabel || 'Build'} thumbnail`}
                        className={css`
                          width: 100%;
                          height: 100%;
                          display: block;
                          object-fit: cover;
                        `}
                      />
                    </div>
                    <div
                      className={css`
                        margin-top: 0.45rem;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 0.5rem;
                        color: ${Color.black()};
                        font-size: 1.1rem;
                        font-weight: 800;
                      `}
                    >
                      <span>{option.sourceLabel || 'Thumbnail'}</span>
                      {option.isCurrent ? <span>Current</span> : null}
                    </div>
                    <div
                      className={css`
                        margin-top: 0.2rem;
                        color: ${Color.darkGray()};
                        font-size: 1.1rem;
                        line-height: 1.3;
                      `}
                    >
                      {formatThumbnailUsedAt(option.usedAt)}
                      {option.sourceTitle ? ` · ${option.sourceTitle}` : ''}
                    </div>
                  </button>
                );
              })
            ) : (
              <div
                className={css`
                  padding: 1rem 0.4rem;
                  color: ${Color.darkGray()};
                  font-size: 1.1rem;
                  line-height: 1.4;
                `}
              >
                No saved thumbnails yet.
              </div>
            )}
          </div>
        </aside>
      </div>
      {uploadModalShown && (
        <UploadModal
          isOpen
          accept="image/*"
          imageGenerationPurpose="buildThumbnail"
          onHide={() => setUploadModalShown(false)}
          onFileSelect={handleSelectImageFile}
        />
      )}
    </Modal>
  );

  function handleImageLoad(event: React.SyntheticEvent<HTMLImageElement>) {
    const image = event.currentTarget;
    imageRef.current = image;
    const nextCrop = buildInitialThumbnailCrop(image);
    setCrop(nextCrop);
    void updateCroppedImage(normalizePixelCrop(nextCrop, image), image);
  }

  async function updateCroppedImage(
    pixelCrop: PixelCrop | Crop,
    image = imageRef.current
  ) {
    if (!image || !pixelCrop.width || !pixelCrop.height) {
      setCroppedImageUrl('');
      return;
    }
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(pixelCrop.width * scaleX));
    canvas.height = Math.max(1, Math.round(pixelCrop.height * scaleY));
    const context = canvas.getContext('2d');
    if (!context) {
      setCroppedImageUrl('');
      return;
    }
    try {
      context.drawImage(
        image,
        pixelCrop.x * scaleX,
        pixelCrop.y * scaleY,
        pixelCrop.width * scaleX,
        pixelCrop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      );
      setCroppedImageUrl(canvas.toDataURL('image/jpeg', 0.9));
    } catch (error: any) {
      setCroppedImageUrl('');
      setError(error?.message || 'This image could not be edited');
    }
  }

  function normalizePixelCrop(
    nextCrop: PixelCrop | Crop,
    image: HTMLImageElement
  ): PixelCrop {
    if ((nextCrop as Crop).unit === '%') {
      const percentCrop = nextCrop as Crop;
      return {
        unit: 'px',
        x: ((percentCrop.x || 0) / 100) * image.width,
        y: ((percentCrop.y || 0) / 100) * image.height,
        width: ((percentCrop.width || 0) / 100) * image.width,
        height: ((percentCrop.height || 0) / 100) * image.height
      };
    }
    return nextCrop as PixelCrop;
  }

  async function handleSelectImageFile(file: File) {
    setProcessingImage(true);
    setError('');
    try {
      const { dataUrl } = await convertToWebFriendlyFormat(file);
      setCrop(undefined);
      setCroppedImageUrl('');
      setSelectedThumbnailUrl('');
      setSourceImageUrl(dataUrl);
    } catch (error: any) {
      setError(error?.message || 'Unable to load that image');
    } finally {
      setProcessingImage(false);
    }
  }

  async function handleCaptureFromPreview() {
    if (!onCaptureFromPreview || capturingPreview) return;
    setCapturingPreview(true);
    setError('');
    try {
      const capturedImageUrl = await onCaptureFromPreview();
      setCrop(undefined);
      setCroppedImageUrl('');
      setSelectedThumbnailUrl('');
      setSourceImageUrl(String(capturedImageUrl || '').trim());
    } catch (error: any) {
      setError(String(error?.message || 'Preview capture failed').trim());
    } finally {
      setCapturingPreview(false);
    }
  }

  function handleRemoveImage() {
    setCrop(undefined);
    setCroppedImageUrl('');
    setSourceImageUrl('');
    setSelectedThumbnailUrl('');
    setError('');
  }

  function handleSelectExistingThumbnail(option: ThumbnailOption) {
    const thumbnailUrl = String(option.thumbnailUrl || '').trim();
    if (!thumbnailUrl || loading || processingImage || capturingPreview) return;
    setCrop(undefined);
    setCroppedImageUrl('');
    setError('');
    setSelectedThumbnailUrl(thumbnailUrl);
    setSourceImageUrl(getEditableCanvasImageUrl(thumbnailUrl));
  }

  function handleSave() {
    if (saveDisabled) return;
    onSave(croppedImageUrl || null);
  }
}

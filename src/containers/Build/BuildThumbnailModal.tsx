import 'react-image-crop/dist/ReactCrop.css';
import React, { useEffect, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop
} from 'react-image-crop';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import API_URL from '~/constants/URL';
import { convertToWebFriendlyFormat } from '~/helpers/imageHelpers';
import StatusDots from '~/containers/Chat/Message/MessageBody/TextMessage/ThinkingIndicator/StatusDots';

const THUMBNAIL_ASPECT_RATIO = 16 / 9;

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

export default function BuildThumbnailModal({
  initialImageUrl,
  loading = false,
  saveError = '',
  onHide,
  onSave,
  onCaptureFromPreview
}: {
  initialImageUrl?: string | null;
  loading?: boolean;
  saveError?: string;
  onHide: () => void;
  onSave: (croppedImageUrl: string | null) => void | Promise<void>;
  onCaptureFromPreview?: () => Promise<string>;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [sourceImageUrl, setSourceImageUrl] = useState('');
  const [croppedImageUrl, setCroppedImageUrl] = useState('');
  const [processingImage, setProcessingImage] = useState(false);
  const [capturingPreview, setCapturingPreview] = useState(false);
  const [error, setError] = useState('');
  const canEditSourceImage = canEditImageUrlInCanvas(sourceImageUrl);

  useEffect(() => {
    const nextInitialImageUrl = String(initialImageUrl || '').trim();
    setCrop(undefined);
    setCroppedImageUrl('');
    setError('');
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
      modalKey="BuildThumbnailModal"
      isOpen
      onClose={loading ? () => {} : onHide}
      closeOnBackdropClick={false}
      title="Thumbnail"
      size="md"
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
          display: flex;
          flex-direction: column;
          gap: 1rem;
          width: 100%;
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
            onClick={() => fileInputRef.current?.click()}
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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className={css`
            display: none;
          `}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleSelectImageFile(file);
            }
            event.target.value = '';
          }}
        />
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
                  font-size: 1rem;
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
              font-size: 1rem;
              line-height: 1.5;
            `}
          >
            {error || saveError}
          </div>
        ) : null}
      </div>
    </Modal>
  );

  function handleImageLoad(event: React.SyntheticEvent<HTMLImageElement>) {
    const image = event.currentTarget;
    imageRef.current = image;
    const nextCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90
        },
        THUMBNAIL_ASPECT_RATIO,
        image.width,
        image.height
      ),
      image.width,
      image.height
    );
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
    setError('');
  }

  function handleSave() {
    if (saveDisabled) return;
    onSave(croppedImageUrl || null);
  }
}

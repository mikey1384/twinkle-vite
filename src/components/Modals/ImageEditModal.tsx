import 'react-image-crop/dist/ReactCrop.css';
import React, { useMemo, useRef, useState, useEffect } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import FileUploadStatusIndicator from '~/components/FileUploadStatusIndicator';
import CaptionEditor from '~/components/Texts/CaptionEditor';
import { v1 as uuidv1 } from 'uuid';
import { returnImageFileFromUrl } from '~/helpers';
import { useAppContext, useKeyContext } from '~/contexts';
import { exceedsCharLimit, finalizeEmoji } from '~/helpers/stringHelpers';
import { Color } from '~/constants/css';
import { useRoleColor } from '~/theme/useRoleColor';

export default function ImageEditModal({
  aspectFixed = true,
  hasDescription = false,
  isProfilePic = false,
  onEditDone,
  onHide,
  imageUri,
  uploadDisabled = false
}: {
  aspectFixed?: boolean;
  hasDescription?: boolean;
  isProfilePic?: boolean;
  onEditDone: (params: {
    pictures?: any[];
    filePath?: string;
    croppedImageUrl?: string;
  }) => void;
  onHide: () => void;
  imageUri: any;
  uploadDisabled?: boolean;
}) {
  const [captionText, setCaptionText] = useState('');
  const isUploadingRef = useRef(false);
  const uploadFile = useAppContext((v) => v.requestHelpers.uploadFile);
  const uploadUserPic = useAppContext((v) => v.requestHelpers.uploadUserPic);
  const userId = useKeyContext((v) => v.myState.userId);
  const { colorKey: doneColorKey } = useRoleColor('done', {
    fallback: 'blue'
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [crop, setCrop] = useState<{
    unit: '%' | 'px';
    width: number;
    height: number;
    x: number;
    y: number;
  }>({
    unit: '%',
    width: 50,
    height: 50,
    x: 5,
    y: 5
  });
  const [loading, setLoading] = useState(false);
  const [originalImageUrl, setOriginalImageUrl] = useState('');
  const [croppedImageUrl, setCroppedImageUrl] = useState('');
  const ImageRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    window.loadImage(
      imageUri,
      function (img) {
        const image = img.toDataURL('image/jpeg');
        setOriginalImageUrl(image);
        setLoading(false);
      },
      { orientation: true, canvas: true }
    );
  }, [imageUri]);

  const captionExceedChatLimit = useMemo(
    () =>
      exceedsCharLimit({
        contentType: 'comment',
        text: captionText
      }),
    [captionText]
  );

  return (
    <ErrorBoundary componentPath="ImageEditModal">
      <Modal
        isOpen={true}
        onClose={onHide}
        title="Edit your picture"
        size="md"
        closeOnBackdropClick={false}
        modalLevel={0}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={onHide}
              style={{ marginRight: '0.7rem' }}
            >
              Cancel
            </Button>
            <Button
              disabled={!!captionExceedChatLimit}
              color={
                doneColorKey && doneColorKey in Color ? doneColorKey : 'blue'
              }
              onClick={handleSubmit}
              loading={uploading}
            >
              Submit
            </Button>
          </>
        }
      >
        <div style={{ width: '100%' }}>
          <div
            style={{
              width: '100%',
              textAlign: 'center',
              paddingBottom: '1rem'
            }}
          >
            {loading && <Loading text="Loading..." />}
            {!loading && imageUri && (
              <ReactCrop
                crop={crop}
                aspect={aspectFixed ? 1 : undefined}
                minWidth={50}
                minHeight={50}
                keepSelection
                ruleOfThirds
                onChange={setCrop}
                onComplete={handleCropComplete}
              >
                <img
                  ref={ImageRef}
                  loading="lazy"
                  onLoad={(e) => {
                    const { width, height } = e.currentTarget;
                    const crop = centerCrop(
                      makeAspectCrop(
                        {
                          unit: '%',
                          width: 90
                        },
                        1,
                        width,
                        height
                      ),
                      width,
                      height
                    );
                    setCrop(crop);
                    if (ImageRef.current) {
                      const cropped = initImage({
                        image: ImageRef.current,
                        crop
                      });
                      setCroppedImageUrl(cropped);
                    }
                  }}
                  style={{
                    objectFit: 'contain',
                    minHeight: '350px',
                    maxHeight: '65vh'
                  }}
                  src={originalImageUrl}
                />
              </ReactCrop>
            )}
          </div>
          {hasDescription && (
            <CaptionEditor text={captionText} onSetText={setCaptionText} />
          )}
          <div
            style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
          >
            {uploading && (
              <FileUploadStatusIndicator
                style={{ width: '20rem' }}
                uploadProgress={uploadProgress}
              />
            )}
          </div>
        </div>
      </Modal>
    </ErrorBoundary>
  );

  async function handleCropComplete(crop: {
    width: number;
    height: number;
    x: number;
    y: number;
  }) {
    if (crop.width && crop.height && ImageRef.current) {
      const cropped = getCroppedImg({
        image: ImageRef.current,
        crop
      });
      setCroppedImageUrl(cropped);
    }
  }

  function initImage({
    image,
    crop
  }: {
    image: HTMLImageElement;
    crop: { width: number; height: number; x: number; y: number };
  }) {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = (image.width * crop.width) / 100;
    canvas.height = (image.height * crop.height) / 100;
    const ctx = canvas.getContext('2d');

    ctx?.drawImage(
      image,
      ((image.width * crop.x) / 100) * scaleX,
      ((image.height * crop.y) / 100) * scaleY,
      ((image.width * crop.width) / 100) * scaleX,
      ((image.height * crop.height) / 100) * scaleY,
      0,
      0,
      (image.width * crop.width) / 100,
      (image.height * crop.height) / 100
    );
    return canvas.toDataURL('image/jpeg');
  }

  function getCroppedImg({
    image,
    crop
  }: {
    image: HTMLImageElement;
    crop: { width: number; height: number; x: number; y: number };
  }) {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    ctx?.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );
    return canvas.toDataURL('image/jpeg');
  }

  async function handleSubmit() {
    if (uploadDisabled) {
      onEditDone({ croppedImageUrl });
      return;
    }

    if (isUploadingRef.current) return;
    setUploading(true);
    isUploadingRef.current = true;
    const path = uuidv1();
    const fileName = `${path}.jpg`;
    const file = returnImageFileFromUrl({
      imageUrl: croppedImageUrl,
      fileName
    });
    const filePath = `${userId}/${fileName}`;
    const caption = finalizeEmoji(captionText);
    await uploadFile({
      context: 'profilePic',
      filePath,
      file,
      onUploadProgress: handleUploadProgress
    });
    const pictures = await uploadUserPic({
      src: `/profile/${filePath}`,
      isProfilePic,
      caption
    });
    onEditDone({
      pictures,
      filePath
    });
  }

  function handleUploadProgress({
    loaded,
    total
  }: {
    loaded: number;
    total: number;
  }) {
    if (!total || !Number.isFinite(total) || total <= 0) {
      setUploadProgress(0);
      return;
    }
    const ratio = loaded / total;
    if (!Number.isFinite(ratio)) {
      setUploadProgress(0);
      return;
    }
    setUploadProgress(Math.max(0, Math.min(1, ratio)));
  }
}

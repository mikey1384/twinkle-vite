import 'react-image-crop/dist/ReactCrop.css';
import React, { useRef, useState, useEffect } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import { useKeyContext } from '~/contexts';

export default function ImageEditModal({
  aspectFixed = true,
  modalOverModal = true,
  onEditDone,
  onHide,
  imageUri
}: {
  aspectFixed?: boolean;
  hasDescription?: boolean;
  modalOverModal?: boolean;
  onEditDone: (croppedUrl: string) => void;
  onHide: () => void;
  imageUri: any;
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
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

  return (
    <Modal
      closeWhenClickedOutside={false}
      modalOverModal={modalOverModal}
      onHide={onHide}
    >
      <ErrorBoundary componentPath="Chat/Settings/ImageEditModal">
        <header>Edit Image</header>
        <main>
          <div
            style={{
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
        </main>
        <footer>
          <Button
            transparent
            onClick={onHide}
            style={{ marginRight: '0.7rem' }}
          >
            Cancel
          </Button>
          <Button color={doneColor} onClick={() => onEditDone(croppedImageUrl)}>
            Submit
          </Button>
        </footer>
      </ErrorBoundary>
    </Modal>
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
}

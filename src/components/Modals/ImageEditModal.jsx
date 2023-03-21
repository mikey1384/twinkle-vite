import { useRef, useState, useEffect } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import PropTypes from 'prop-types';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import FileUploadStatusIndicator from '~/components/FileUploadStatusIndicator';
import CaptionEditor from '~/components/Texts/CaptionEditor';
import { v1 as uuidv1 } from 'uuid';
import { returnImageFileFromUrl } from '~/helpers';
import { useAppContext, useKeyContext } from '~/contexts';
import { finalizeEmoji } from '~/helpers/stringHelpers';

ImageEditModal.propTypes = {
  aspectFixed: PropTypes.bool,
  hasDescription: PropTypes.bool,
  imageUri: PropTypes.string,
  isProfilePic: PropTypes.bool,
  modalOverModal: PropTypes.bool,
  onEditDone: PropTypes.func.isRequired,
  onHide: PropTypes.func.isRequired
};

export default function ImageEditModal({
  aspectFixed = true,
  hasDescription,
  isProfilePic,
  modalOverModal,
  onEditDone,
  onHide,
  imageUri
}) {
  const [captionText, setCaptionText] = useState('');
  const uploadFile = useAppContext((v) => v.requestHelpers.uploadFile);
  const uploadUserPic = useAppContext((v) => v.requestHelpers.uploadUserPic);
  const { userId } = useKeyContext((v) => v.myState);
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [crop, setCrop] = useState({
    unit: '%',
    width: 50,
    x: 5
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
    <Modal modalOverModal={modalOverModal} onHide={onHide}>
      <ErrorBoundary componentPath="ImageEditModal">
        <header>Edit your picture</header>
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
                aspect={aspectFixed ? 1 : null}
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
                    const cropped = initImage({
                      image: ImageRef.current,
                      crop
                    });
                    setCroppedImageUrl(cropped);
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
          {uploading && (
            <FileUploadStatusIndicator
              style={{ width: '20rem' }}
              uploadProgress={uploadProgress}
            />
          )}
        </main>
        <footer>
          <Button
            transparent
            onClick={onHide}
            style={{ marginRight: '0.7rem' }}
          >
            Cancel
          </Button>
          <Button
            color={doneColor}
            onClick={handleFileUpload}
            loading={uploading}
          >
            Submit
          </Button>
        </footer>
      </ErrorBoundary>
    </Modal>
  );

  async function handleCropComplete(crop) {
    if (crop.width && crop.height) {
      const cropped = getCroppedImg({
        image: ImageRef.current,
        crop
      });
      setCroppedImageUrl(cropped);
    }
  }

  function initImage({ image, crop }) {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = (image.width * crop.width) / 100;
    canvas.height = (image.height * crop.height) / 100;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
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

  function getCroppedImg({ image, crop }) {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
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

  async function handleFileUpload() {
    setUploading(true);
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

  function handleUploadProgress({ loaded, total }) {
    setUploadProgress(loaded / total);
  }
}

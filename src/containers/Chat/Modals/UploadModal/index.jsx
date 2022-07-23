import {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Loading from '~/components/Loading';
import ExtractedThumb from '~/components/ExtractedThumb';
import FileInfo from './FileInfo';
import { returnImageFileFromUrl } from '~/helpers';
import { useKeyContext } from '~/contexts';
import { v1 as uuidv1 } from 'uuid';
import {
  exceedsCharLimit,
  finalizeEmoji,
  getFileInfoFromFileName,
  generateFileName
} from '~/helpers/stringHelpers';
import LocalContext from '../../Context';

UploadModal.propTypes = {
  initialCaption: PropTypes.string,
  channelId: PropTypes.number,
  fileObj: PropTypes.object,
  onHide: PropTypes.func.isRequired,
  onUpload: PropTypes.func.isRequired,
  recepientId: PropTypes.number,
  replyTarget: PropTypes.object,
  subjectId: PropTypes.number
};

function UploadModal({
  initialCaption = '',
  channelId,
  fileObj,
  onHide,
  onUpload,
  replyTarget,
  recepientId,
  subjectId
}) {
  const { profilePicUrl, userId, username } = useKeyContext((v) => v.myState);
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const {
    onFileUpload,
    state: { isRespondingToSubject },
    actions: { onSubmitMessage }
  } = useContext(LocalContext);
  const [caption, setCaption] = useState(initialCaption);
  const [imageUrl, setImageUrl] = useState('');
  const [videoSrc, setVideoSrc] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [videoThumbnail, setVideoThumbnail] = useState('');
  const { fileType } = useMemo(
    () => getFileInfoFromFileName(fileObj.name),
    [fileObj.name]
  );
  useEffect(() => {
    if (fileType === 'video') {
      const url = URL.createObjectURL(fileObj);
      setVideoSrc(url);
    }
  }, [fileObj, fileType]);

  useEffect(() => {
    if (fileType === 'image') {
      const reader = new FileReader();
      reader.onload = (upload) => {
        const extension = fileObj.name.split('.').pop();
        const payload = upload.target.result;
        if (extension === 'gif') {
          setImageUrl(payload);
          setSelectedFile(fileObj);
        } else {
          window.loadImage(
            payload,
            function (img) {
              const image = img.toDataURL(
                `image/${extension === 'png' ? 'png' : 'jpeg'}`
              );
              setImageUrl(image);
              const file = returnImageFileFromUrl({
                imageUrl: image,
                fileName: fileObj.name
              });
              setSelectedFile(file);
            },
            { orientation: true, canvas: true }
          );
        }
      };
      reader.readAsDataURL(fileObj);
    } else {
      setSelectedFile(fileObj);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const captionExceedsCharLimit = useMemo(
    () =>
      exceedsCharLimit({
        inputType: 'message',
        contentType: 'chat',
        text: caption
      }),
    [caption]
  );

  const handleSubmit = useCallback(() => {
    if (selectedFile) {
      const filePath = uuidv1();
      const messageId = uuidv1();
      const fileName = generateFileName(selectedFile.name);
      onFileUpload({
        channelId,
        content: finalizeEmoji(caption),
        fileName,
        filePath,
        fileToUpload: selectedFile,
        userId,
        recepientId,
        messageId,
        targetMessageId: replyTarget?.id,
        subjectId: isRespondingToSubject ? subjectId : null,
        thumbnail: videoThumbnail
      });
      onSubmitMessage({
        messageId,
        message: {
          content: finalizeEmoji(caption),
          channelId,
          fileToUpload: selectedFile,
          filePath,
          fileName,
          profilePicUrl,
          userId,
          username
        },
        isRespondingToSubject,
        replyTarget
      });
      onUpload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    caption,
    channelId,
    isRespondingToSubject,
    onUpload,
    profilePicUrl,
    recepientId,
    replyTarget,
    selectedFile,
    subjectId,
    userId,
    username,
    videoThumbnail
  ]);

  return (
    <Modal closeWhenClickedOutside={false} onHide={onHide}>
      <header>Upload a file</header>
      <main>
        {fileObj ? (
          <FileInfo
            caption={caption}
            captionExceedsCharLimit={captionExceedsCharLimit}
            fileObj={fileObj}
            fileType={fileType}
            imageUrl={imageUrl}
            onCaptionChange={setCaption}
          />
        ) : (
          <Loading />
        )}
        {videoSrc && (
          <ExtractedThumb
            isHidden
            src={videoSrc}
            onThumbnailLoad={setVideoThumbnail}
          />
        )}
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          Cancel
        </Button>
        <Button
          disabled={captionExceedsCharLimit || !selectedFile}
          color={doneColor}
          onClick={handleSubmit}
        >
          Upload
        </Button>
      </footer>
    </Modal>
  );
}

export default memo(UploadModal);

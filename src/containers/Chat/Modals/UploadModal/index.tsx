import React, {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Loading from '~/components/Loading';
import ExtractedThumb from '~/components/ExtractedThumb';
import FileInfo from './FileInfo';
import { returnImageFileFromUrl } from '~/helpers';
import { useAppContext, useKeyContext } from '~/contexts';
import { v1 as uuidv1 } from 'uuid';
import {
  exceedsCharLimit,
  finalizeEmoji,
  getFileInfoFromFileName,
  generateFileName
} from '~/helpers/stringHelpers';
import LocalContext from '../../Context';
import ThumbnailPicker from '~/components/ThumbnailPicker';

function UploadModal({
  initialCaption = '',
  isRespondingToSubject,
  isCielChat,
  isZeroChat,
  channelId,
  fileObj,
  onEmbed,
  onHide,
  onUpload,
  replyTarget,
  recipientId,
  recipientUsername,
  selectedTab,
  topicId,
  subchannelId
}: {
  initialCaption?: string;
  isRespondingToSubject?: boolean;
  isCielChat?: boolean;
  isZeroChat?: boolean;
  channelId?: number;
  fileObj?: any;
  onEmbed: (text: string) => any;
  onHide: () => any;
  onUpload: () => any;
  recipientId?: number;
  recipientUsername?: string;
  replyTarget?: any;
  selectedTab?: string;
  topicId?: number;
  subchannelId?: number;
}) {
  const { profilePicUrl, userId, username } = useKeyContext((v) => v.myState);
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const {
    onFileUpload,
    actions: { onSubmitMessage }
  } = useContext(LocalContext);
  const saveFileData = useAppContext((v) => v.requestHelpers.saveFileData);
  const [caption, setCaption] = useState(initialCaption);
  const [imageUrl, setImageUrl] = useState('');
  const [videoSrc, setVideoSrc] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [selectedThumbnailIndex, setSelectedThumbnailIndex] = useState(0);
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
      reader.onload = (upload: any) => {
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
      const appliedFileName = generateFileName(selectedFile.name);
      const isTopicMessage =
        (selectedTab === 'topic' || isRespondingToSubject) && topicId;
      onFileUpload({
        channelId,
        content: finalizeEmoji(caption),
        fileName: appliedFileName,
        filePath,
        fileToUpload: selectedFile,
        isCielChat,
        isZeroChat,
        userId,
        recipientId,
        recipientUsername,
        messageId,
        subchannelId,
        targetMessageId: replyTarget?.id,
        topicId: isTopicMessage ? topicId : null,
        thumbnail: thumbnails[selectedThumbnailIndex]
      });
      onSubmitMessage({
        messageId,
        message: {
          content: finalizeEmoji(caption),
          channelId,
          fileToUpload: selectedFile,
          filePath,
          fileName: appliedFileName,
          profilePicUrl,
          userId,
          username
        },
        topicId: isTopicMessage ? topicId : null,
        isRespondingToSubject,
        replyTarget,
        subchannelId
      });
      saveFileData({
        fileName: appliedFileName,
        filePath,
        actualFileName: selectedFile.name,
        rootType: 'chat'
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
    recipientId,
    replyTarget,
    selectedFile,
    selectedTab,
    subchannelId,
    thumbnails,
    selectedThumbnailIndex,
    topicId,
    userId,
    username
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
            onEmbed={onEmbed}
            onCaptionChange={setCaption}
          />
        ) : (
          <Loading />
        )}
        {videoSrc && (
          <ExtractedThumb
            isHidden
            src={videoSrc}
            onThumbnailLoad={handleThumbnailLoad}
          />
        )}
        {thumbnails.length > 0 && (
          <ThumbnailPicker
            thumbnails={thumbnails}
            initialSelectedIndex={selectedThumbnailIndex}
            onSelect={handleThumbnailSelect}
          />
        )}
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          Cancel
        </Button>
        <Button
          disabled={!!captionExceedsCharLimit || !selectedFile}
          color={doneColor}
          onClick={handleSubmit}
        >
          Upload
        </Button>
      </footer>
    </Modal>
  );

  function handleThumbnailLoad({
    thumbnails,
    selectedIndex
  }: {
    thumbnails: string[];
    selectedIndex: number;
  }) {
    setThumbnails(thumbnails);
    setSelectedThumbnailIndex(selectedIndex);
  }

  function handleThumbnailSelect(index: number) {
    setSelectedThumbnailIndex(index);
  }
}

export default memo(UploadModal);

import React, { useEffect, useState } from 'react';
import Loading from '~/components/Loading';
import Image from '~/components/Image';
import FileIcon from '~/components/FileIcon';
import Textarea from '~/components/Texts/Textarea';
import {
  addCommasToNumber,
  addEmoji,
  renderFileSize,
  stringIsEmpty
} from '~/helpers/stringHelpers';

export default function FileInfo({
  caption,
  captionExceedsCharLimit,
  fileObj,
  fileType,
  imageUrl,
  onCaptionChange
}: {
  caption: string;
  captionExceedsCharLimit: any;
  fileObj: any;
  fileType: string;
  imageUrl: string;
  onCaptionChange: any;
}) {
  const [loading, setLoading] = useState(true);
  const [draggedFile, setDraggedFile] = useState<any>(null);

  useEffect(() => {
    if (fileObj) {
      setLoading(false);
    }
  }, [fileObj]);

  return loading ? (
    <Loading />
  ) : (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'space-between'
      }}
    >
      <div
        style={{ width: '13vw', height: '13vw' }}
        draggable
        onDragStart={() => setDraggedFile(fileObj)}
        onDragEnd={() => setDraggedFile(null)}
      >
        {fileType === 'image' && <Image imageUrl={imageUrl} />}
        {fileType !== 'image' && <FileIcon fileType={fileType} />}
      </div>
      <div
        style={{
          width: 'CALC(100% - 13vw - 2rem)',
          fontSize: '2rem',
          fontWeight: 'bold',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        <div>
          <div
            style={{
              maxWidth: '100%',
              textOverflow: 'ellipsis',
              overflow: 'hidden'
            }}
          >
            File Name: {fileObj.name}
          </div>
          <div>
            File Size: {addCommasToNumber(fileObj.size)} byte{' '}
            {renderFileSize(fileObj.size)}
          </div>
        </div>
        <div>
          <Textarea
            autoFocus
            draggedFile={draggedFile}
            placeholder="Add a caption..."
            hasError={!!captionExceedsCharLimit}
            style={{
              marginTop: '1rem'
            }}
            value={caption}
            onChange={(event: any) => onCaptionChange(event.target.value)}
            onKeyUp={handleKeyUp}
            minRows={3}
            onDrop={handleDrop}
          />
          {captionExceedsCharLimit && (
            <div
              style={{
                fontWeight: 'normal',
                fontSize: '1.3rem',
                color: 'red'
              }}
            >
              {captionExceedsCharLimit.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  function handleDrop(filePath: string) {
    const currentText = caption || '';
    const newText = `${
      stringIsEmpty(currentText) ? '' : `${currentText}\n`
    }![](${filePath})`;
    onCaptionChange(newText);
    setDraggedFile(null);
  }

  function handleKeyUp(event: any) {
    if (event.key === ' ') {
      onCaptionChange(addEmoji(event.target.value));
    }
  }
}

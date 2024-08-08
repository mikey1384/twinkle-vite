import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  exceedsCharLimit,
  stringIsEmpty,
  isValidYoutubeUrl,
  isValidUrl
} from '~/helpers/stringHelpers';
import { edit } from '~/constants/placeholders';
import Checkbox from '~/components/Checkbox';
import FileField from './FileField';
import Input from '~/components/Texts/Input';
import Icon from '~/components/Icon';
import DropdownButton from '~/components/Buttons/DropdownButton';

export default function AttachmentField({
  isChanging,
  isYouTubeVideo,
  type,
  fileUrl,
  linkUrl,
  thumbUrl,
  newAttachment,
  onSetAttachmentState,
  onThumbnailLoad,
  uploadingFile
}: {
  isChanging: boolean;
  isYouTubeVideo: boolean;
  type: string;
  fileUrl: string;
  linkUrl: string;
  thumbUrl: string;
  newAttachment: any;
  onSetAttachmentState: any;
  onThumbnailLoad: (data: {
    thumbnails: string[];
    selectedIndex: number;
  }) => void;
  uploadingFile: boolean;
}) {
  const editedUrl = useMemo(() => {
    if (type === 'link') {
      return linkUrl || '';
    }
    return '';
  }, [linkUrl, type]);
  const timerRef: React.MutableRefObject<any> = useRef(null);
  const [urlError, setUrlError] = useState(false);

  useEffect(() => {
    clearTimeout(timerRef.current);
    setUrlError(false);
    const urlHasError =
      !stringIsEmpty(editedUrl) &&
      ((isYouTubeVideo && !isValidYoutubeUrl(editedUrl)) ||
        !isValidUrl(editedUrl));
    if (urlHasError) {
      timerRef.current = setTimeout(() => setUrlError(true), 500);
    }
  }, [editedUrl, isYouTubeVideo]);

  const urlExceedsCharLimit = useMemo(
    () =>
      exceedsCharLimit({
        contentType: 'interactive',
        inputType: 'url',
        text: editedUrl
      }),
    [editedUrl]
  );

  return (
    <div
      style={{
        width: '100%',
        marginTop: type === 'file' ? '3rem' : '1rem',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginTop: '1rem',
          marginBottom: '1rem'
        }}
      >
        <p style={{ fontWeight: 'bold', fontSize: '1.7rem' }}>Attachment:</p>
        <DropdownButton
          skeuomorphic
          color="darkerGray"
          icon="caret-down"
          text={type}
          style={{ marginLeft: '1rem' }}
          menuProps={[
            { icon: 'ban', type: 'none' },
            { icon: 'link', type: 'link' },
            { icon: 'paperclip', type: 'file' }
          ]
            .filter((item) => item.type !== type)
            .map((item) => ({
              label: (
                <>
                  <Icon icon={item.icon} />
                  <span style={{ marginLeft: '1rem' }}>
                    {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                  </span>
                </>
              ),
              onClick: () => onSetAttachmentState({ type: item.type })
            }))}
        />
      </div>
      {type !== 'none' && (
        <div style={{ width: '100%', marginTop: '1rem' }}>
          {type === 'file' ? (
            <FileField
              isChanging={isChanging}
              fileUrl={fileUrl}
              thumbUrl={thumbUrl}
              newAttachment={newAttachment}
              onSetAttachmentState={onSetAttachmentState}
              onThumbnailLoad={onThumbnailLoad}
              uploadingFile={uploadingFile}
            />
          ) : (
            <>
              <Input
                hasError={urlError}
                onChange={handleUrlChange}
                placeholder={edit.url}
                value={editedUrl}
                style={urlExceedsCharLimit?.style}
              />
              {(urlExceedsCharLimit || urlError) && (
                <span style={{ color: 'red', lineHeight: 0.5 }}>
                  {urlExceedsCharLimit?.message || 'Please check the url'}
                </span>
              )}
              <Checkbox
                label="YouTube Video:"
                onClick={() =>
                  onSetAttachmentState({ isYouTubeVideo: !isYouTubeVideo })
                }
                style={{ marginTop: '1rem' }}
                checked={isYouTubeVideo}
              />
            </>
          )}
        </div>
      )}
    </div>
  );

  function handleUrlChange(text: string) {
    onSetAttachmentState({
      linkUrl: text,
      isYouTubeVideo: isValidYoutubeUrl(text)
    });
  }
}

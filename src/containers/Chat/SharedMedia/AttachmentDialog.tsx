import React, { useState } from 'react';
import { css } from '@emotion/css';
import Modal from '~/components/Modal';
import ImageModal from '~/components/Modals/ImageModal';
import VideoPlayer from '~/components/VideoPlayer';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { isMobile } from '~/helpers';
import {
  attachmentDate,
  attachmentSize,
  type SharedAttachment
} from '~/helpers/chatSharedMedia';
import { sharedMediaModalClass } from './Browser';

const deviceIsMobile = isMobile(navigator);

export default function AttachmentDialog({
  item,
  action,
  error,
  onClose,
  onDownload,
  onJump
}: {
  item: SharedAttachment;
  action: string;
  error: string;
  onClose: () => void;
  onDownload: () => void;
  onJump?: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const actions = (
    <>
      {error && (
        <p role="alert" style={{ width: '100%', color: '#a33f39' }}>
          {error}
        </p>
      )}
      {onJump && (
        <Button
          variant="soft"
          uppercase={false}
          loading={action === 'jump'}
          disabled={!!action}
          onClick={onJump}
        >
          <Icon icon="comment" />
          <span style={{ marginLeft: 6 }}>Show in chat</span>
        </Button>
      )}
      <Button
        variant="soft"
        uppercase={false}
        loading={action === 'download'}
        disabled={!!action}
        onClick={onDownload}
      >
        <Icon icon="download" />
        <span style={{ marginLeft: 6 }}>Download</span>
      </Button>
    </>
  );
  if (item.fileType === 'image')
    return (
      <ImageModal
        src={item.url}
        fileName={item.name}
        onHide={onClose}
        downloadable={false}
        extraActions={actions}
        className={sharedMediaModalClass}
      />
    );
  return (
    <Modal
      isOpen
      onClose={onClose}
      title={item.name}
      aria-label={item.name}
      size="fullscreen"
      className={sharedMediaModalClass}
      footer={actions}
    >
      <div
        className={css`
          width: 100%;
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          color: #526176;
          font-size: calc(14 * var(--px));
          text-align: center;
          video {
            width: 100%;
            max-height: 48dvh;
            background: #172033;
            border-radius: 10px;
          }
          audio {
            width: 100%;
          }
          p {
            margin: 0;
            overflow-wrap: anywhere;
          }
          a {
            display: inline-flex;
            padding: 12px 18px;
            border: 1px solid #d8e0e9;
            border-radius: 8px;
            font-weight: 600;
          }
        `}
      >
        {(item.fileType === 'video' || item.fileType === 'audio') && !failed ? (
          <VideoPlayer
            fileType={item.fileType}
            customControls={!deviceIsMobile}
            initialTime={0}
            onPlay={() => {}}
            width="100%"
            height={
              item.fileType === 'video'
                ? deviceIsMobile
                  ? 'auto'
                  : 'min(48dvh, calc(440 * var(--px)))'
                : '54px'
            }
            playsInline
            preload="metadata"
            src={item.url}
            onError={() => setFailed(true)}
          />
        ) : (
          <Icon
            icon={
              item.fileType === 'audio'
                ? 'music'
                : item.fileType === 'video'
                  ? 'film'
                  : 'file-alt'
            }
            size="3x"
          />
        )}
        <p>
          Shared by <strong>{item.username}</strong>
          <br />
          {attachmentDate(item.timeStamp)}
          {item.size ? ` · ${attachmentSize(item.size)}` : ''}
        </p>
        {!!item.topicTitle && <p>In {item.topicTitle}</p>}
        {(item.fileType === 'file' || failed) && (
          <>
            <p>
              {failed
                ? 'This format can’t be previewed here.'
                : 'Open this file in a new tab, or save a copy.'}
            </p>
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              Open file{' '}
              <span aria-hidden style={{ marginLeft: 8 }}>
                ↗
              </span>
            </a>
          </>
        )}
      </div>
    </Modal>
  );
}

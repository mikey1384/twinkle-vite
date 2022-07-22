import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import FileInfo from './FileInfo';
import { getFileInfoFromFileName } from '~/helpers/stringHelpers';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { unix } from 'moment';

TargetMessage.propTypes = {
  onClose: PropTypes.func.isRequired,
  replyTarget: PropTypes.object
};

export default function TargetMessage({ onClose, replyTarget }) {
  const fileType = useMemo(() => {
    return replyTarget.fileName
      ? getFileInfoFromFileName(replyTarget.fileName)?.fileType
      : null;
  }, [replyTarget.fileName]);
  const hasFileAttachment = useMemo(
    () => fileType && replyTarget.fileName,
    [fileType, replyTarget.fileName]
  );
  const displayedTimeStamp = useMemo(
    () => unix(replyTarget.timeStamp).format('lll'),
    [replyTarget.timeStamp]
  );

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Icon
        icon="times"
        size="lg"
        style={{
          position: 'absolute',
          right: '1.7rem',
          top: '4rem',
          cursor: 'pointer'
        }}
        onClick={onClose}
      />
      <div
        style={{
          padding: '1rem',
          height: '100%',
          width: '100%',
          background: Color.targetGray(),
          borderRadius,
          overflow: 'scroll',
          display: 'flex',
          justifyContent: 'space-between'
        }}
      >
        <div>
          <div>
            <p
              style={{
                fontWeight: 'bold',
                display: 'inline',
                color: Color.black()
              }}
            >
              {replyTarget.username}
            </p>{' '}
            <span
              className={css`
                font-size: 0.8rem;
                color: ${Color.gray()};
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 0.6rem;
                }
              `}
            >
              {displayedTimeStamp}
            </span>
          </div>
          <div style={{ marginTop: '0.5rem', paddingBottom: '1rem' }}>
            {replyTarget.content || replyTarget.fileName}
          </div>
        </div>
        {hasFileAttachment ? (
          <FileInfo
            filePath={replyTarget.filePath}
            fileType={fileType}
            fileName={replyTarget.fileName}
            thumbUrl={replyTarget.thumbUrl}
          />
        ) : null}
      </div>
    </div>
  );
}

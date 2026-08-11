import React, { useMemo } from 'react';
import Icon from '~/components/Icon';
import FileInfo from './FileInfo';
import BuildCardTargetSummary, {
  getBuildCardTargetSummary
} from '~/containers/Chat/Message/MessageBody/BuildCardTargetSummary';
import { getFileInfoFromFileName } from '~/helpers/stringHelpers';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import moment from 'moment';

export default function TargetMessage({
  onClose,
  replyTarget
}: {
  onClose: () => void;
  replyTarget: any;
}) {
  const fileType = useMemo(() => {
    return replyTarget.fileName
      ? getFileInfoFromFileName(replyTarget.fileName)?.fileType
      : '';
  }, [replyTarget.fileName]);
  const hasFileAttachment = useMemo(
    () => fileType && replyTarget.fileName,
    [fileType, replyTarget.fileName]
  );
  const displayedTimeStamp = useMemo(
    () => moment.unix(replyTarget.timeStamp).format('lll'),
    [replyTarget.timeStamp]
  );

  const buildCardSummary = useMemo(
    () => getBuildCardTargetSummary(replyTarget),
    [replyTarget]
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
        <div style={buildCardSummary ? { width: '100%' } : undefined}>
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
                font-size: 1.1rem;
                color: ${Color.gray()};
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1.1rem;
                }
              `}
            >
              {displayedTimeStamp}
            </span>
          </div>
          <div style={{ marginTop: '0.5rem', paddingBottom: '1rem' }}>
            {buildCardSummary ? (
              <BuildCardTargetSummary summary={buildCardSummary}>
                {replyTarget.content ? <div>{replyTarget.content}</div> : null}
              </BuildCardTargetSummary>
            ) : (
              replyTarget.content || replyTarget.fileName
            )}
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

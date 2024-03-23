import React, { memo, useMemo, useEffect } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import RichText from '~/components/Texts/RichText';
import ContentFileViewer from '~/components/ContentFileViewer';
import { borderRadius, Color, desktopMinWidth } from '~/constants/css';
import { useContentState } from '~/helpers/hooks';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import {
  getFileInfoFromFileName,
  stringIsEmpty
} from '~/helpers/stringHelpers';
import { css } from '@emotion/css';
import localize from '~/constants/localize';

const submitYourResponseLabel = localize('submitYourResponse');

function SecretAnswer({
  answer,
  attachment,
  mediaDisabled,
  modalOverModal,
  onClick,
  style,
  subjectId,
  theme,
  uploaderId
}: {
  answer: string;
  attachment: any;
  mediaDisabled?: boolean;
  modalOverModal?: boolean;
  onClick?: (v?: any) => void;
  style?: React.CSSProperties;
  subjectId: number;
  theme?: string;
  uploaderId: number;
}) {
  const checkIfUserResponded = useAppContext(
    (v) => v.requestHelpers.checkIfUserResponded
  );
  const { userId } = useKeyContext((v) => v.myState);
  const onChangeSpoilerStatus = useContentContext(
    (v) => v.actions.onChangeSpoilerStatus
  );
  const { secretShown, prevSecretViewerId } = useContentState({
    contentType: 'subject',
    contentId: subjectId
  });
  const spoilerShown = useMemo(
    () => secretShown || uploaderId === userId,
    [secretShown, uploaderId, userId]
  );

  useEffect(() => {
    if (userId && userId !== prevSecretViewerId) {
      init();
    }
    if (!userId) {
      onChangeSpoilerStatus({ shown: false, subjectId });
    }
    async function init() {
      const { responded } = await checkIfUserResponded(subjectId);
      onChangeSpoilerStatus({
        shown: responded,
        subjectId,
        prevSecretViewerId: userId
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prevSecretViewerId, subjectId, userId]);

  const { fileType } = useMemo(
    () => getFileInfoFromFileName(attachment?.fileName),
    [attachment?.fileName]
  );

  return (
    <ErrorBoundary componentPath="SecretAnswer">
      <div
        onClick={spoilerShown ? () => null : onClick}
        style={{
          cursor: spoilerShown ? '' : 'pointer',
          fontSize: '1.7rem',
          background: spoilerShown ? Color.ivory() : Color.white(),
          border: `1px solid ${
            spoilerShown ? Color.borderGray() : Color.black()
          }`,
          borderRadius,
          wordBreak: 'break-word',
          textAlign: spoilerShown ? undefined : 'center',
          padding: '1rem',
          ...style
        }}
      >
        {spoilerShown && (
          <div style={{ width: '100%' }}>
            {attachment && (
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center'
                }}
              >
                <ContentFileViewer
                  isSecretAttachment
                  theme={theme}
                  contentId={subjectId}
                  contentType="subject"
                  fileName={attachment.fileName}
                  filePath={attachment.filePath}
                  fileSize={attachment.fileSize}
                  isThumb={mediaDisabled}
                  modalOverModal={modalOverModal}
                  thumbUrl={attachment.thumbUrl}
                  videoHeight="100%"
                  style={{
                    ...(mediaDisabled
                      ? { width: '15rem', height: '11rem' }
                      : {}),
                    display: 'flex',
                    justifyContent: 'center'
                  }}
                />
              </div>
            )}
            {!stringIsEmpty(answer) && (
              <RichText
                theme={theme}
                contentId={subjectId}
                contentType="subject"
                section="secret"
                style={{ marginTop: fileType === 'image' ? '1.3rem' : 0 }}
              >
                {answer}
              </RichText>
            )}
          </div>
        )}
        {!spoilerShown && (
          <span
            className={css`
              @media (min-width: ${desktopMinWidth}) {
                &:hover {
                  text-decoration: underline;
                }
              }
            `}
          >
            {submitYourResponseLabel}
          </span>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default memo(SecretAnswer);

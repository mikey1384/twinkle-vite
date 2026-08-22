import React, { memo, useMemo } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import RichText from '~/components/Texts/RichText';
import ContentFileViewer from '~/components/ContentFileViewer';
import { borderRadius, Color, desktopMinWidth } from '~/constants/css';
import { useContentState } from '~/helpers/hooks';
import { useKeyContext } from '~/contexts';
import useSubjectSecretVisibility from '~/helpers/hooks/useSubjectSecretVisibility';
import {
  getFileInfoFromFileName,
  stringIsEmpty
} from '~/helpers/stringHelpers';
import { css } from '@emotion/css';
const submitYourResponseLabel = 'Submit your response to view the secret message';

function SecretAnswer({
  answer,
  attachment,
  mediaDisabled,
  userIsUploader,
  onClick,
  style,
  subjectId,
  theme,
  uploaderId
}: {
  answer: string;
  attachment: any;
  mediaDisabled?: boolean;
  userIsUploader?: boolean;
  onClick?: (v?: any) => void;
  style?: React.CSSProperties;
  subjectId: number;
  theme?: string;
  uploaderId: number;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const { secretShown } = useContentState({
    contentType: 'subject',
    contentId: subjectId
  });
  useSubjectSecretVisibility({
    subjectHasSecretMessage: true,
    subjectId
  });
  const spoilerShown = useMemo(
    () => secretShown || uploaderId === userId,
    [secretShown, uploaderId, userId]
  );

  const { fileType } = useMemo(
    () => getFileInfoFromFileName(attachment?.fileName),
    [attachment?.fileName]
  );

  const { cursor, backgroundColor, borderColor, textAlignCenter } =
    useMemo(() => {
      return {
        cursor: spoilerShown ? '' : 'pointer',
        backgroundColor: spoilerShown ? Color.ivory() : Color.white(),
        borderColor: spoilerShown ? 'var(--ui-border)' : Color.black(),
        textAlignCenter: spoilerShown ? '' : 'text-align: center;'
      };
    }, [spoilerShown]);

  return (
    <ErrorBoundary componentPath="SecretAnswer">
      <div
        onClick={spoilerShown ? () => null : onClick}
        className={css`
          cursor: ${cursor};
          font-size: 1.7rem;
          background: ${backgroundColor};
          border: 1px solid ${borderColor};
          border-radius: ${borderRadius};
          word-break: break-word;
          ${textAlignCenter}
          padding: 1rem;
        `}
        style={style}
      >
        {spoilerShown && (
          <div
            className={css`
              width: 100%;
            `}
          >
            {attachment && (
              <div
                className={css`
                  width: 100%;
                  display: flex;
                  justify-content: center;
                `}
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
                  userIsUploader={userIsUploader}
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

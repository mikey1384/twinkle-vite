import React, { useEffect, useMemo, useState } from 'react';
import ContentFileViewer from '~/components/ContentFileViewer';
import VideoThumbImage from '~/components/VideoThumbImage';
import Embedly from '~/components/Embedly';
import UsernameText from '~/components/Texts/UsernameText';
import Button from '~/components/Button';
import Loading from '~/components/Loading';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import localize from '~/constants/localize';
import { css } from '@emotion/css';
import VideoPlayer from '~/components/VideoPlayer';

const deletedByLabel = localize('deletedBy');
const deleteLabel = localize('delete');
const deletePermanentlyLabel = localize('deletePermanently');
const undoLabel = localize('undo');

export default function DeletedPost({
  contentId,
  contentType,
  onDeletePermanently,
  postId,
  style
}: {
  contentId: number;
  contentType: string;
  postId?: number;
  onDeletePermanently?: (v: number) => void;
  style?: React.CSSProperties;
}) {
  const onSetContentState = useContentContext(
    (v) => v.actions.onSetContentState
  );
  const managementLevel = useKeyContext((v) => v.myState.managementLevel);
  const deleteContent = useAppContext((v) => v.requestHelpers.deleteContent);
  const deletePostPermanently = useAppContext(
    (v) => v.requestHelpers.deletePostPermanently
  );
  const loadDeletedContent = useAppContext(
    (v) => v.requestHelpers.loadDeletedContent
  );
  const [loading, setLoading] = useState(false);
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const [contentObj, setContentObj] = useState({});
  const {
    id,
    actualTitle,
    actualDescription,
    content,
    deleter,
    description,
    fileName = '',
    filePath,
    fileSize = 0,
    isRecovered = false,
    rootObj,
    secretAnswer,
    title,
    thumbUrl,
    uploader = {}
  }: {
    id?: number;
    actualTitle?: string;
    actualDescription?: string;
    content?: string;
    deleter?: any;
    description?: string;
    fileName?: string;
    filePath?: string;
    fileSize?: number;
    isRecovered?: boolean;
    rootObj?: any;
    secretAnswer?: string;
    title?: string;
    thumbUrl?: string;
    uploader?: any;
  } = useMemo(() => contentObj, [contentObj]);
  useEffect(() => {
    init();
    async function init() {
      setLoading(true);
      const data = await loadDeletedContent({ contentId, contentType });
      setContentObj(data);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        height: 'auto',
        ...style
      }}
      className={css`
        border-radius: ${borderRadius};
        border: 1px solid ${Color.borderGray()};
        background: '#fff';
        .label {
          color: ${Color.black()};
        }
        margin-top: 0;
        @media (max-width: ${mobileMaxWidth}) {
          border-radius: 0;
          margin-top: -0.5rem;
          border-left: 0;
          border-right: 0;
        }
      `}
    >
      {loading ? (
        <Loading />
      ) : !id ? (
        <div
          style={{
            padding: '1rem',
            fontWeight: 'bold',
            color: Color.darkGray()
          }}
        >
          Deleted
        </div>
      ) : (
        <>
          <div style={{ padding: '1rem', height: 'auto' }}>
            <div
              style={{
                display: 'flex',
                width: '100%',
                fontSize: '1.3rem',
                height: 'auto'
              }}
            >
              {contentType === 'video' && (
                <div
                  style={{
                    display: 'flex',
                    width: '100%',
                    flexDirection: 'column',
                    alignItems: 'flex-start'
                  }}
                >
                  <div>
                    <UsernameText
                      style={{ fontSize: '1.5rem' }}
                      user={uploader}
                    />
                  </div>
                  <p
                    style={{
                      marginTop: '1rem',
                      fontSize: '1.7rem',
                      fontWeight: 'bold',
                      lineHeight: 1.5,
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word'
                    }}
                    className="label"
                  >
                    {title}
                  </p>
                  <div
                    style={{
                      marginTop: '1rem',
                      color: Color.darkerGray(),
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical'
                    }}
                  >
                    {description}
                  </div>
                  <div
                    className="unselectable"
                    style={{
                      width: '100%',
                      paddingTop: '57.25%',
                      marginTop: '1rem',
                      position: 'relative'
                    }}
                  >
                    <VideoPlayer
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0
                      }}
                      width="100%"
                      height="100%"
                      fileType="youtube"
                      src={content || ''}
                      onPlay={() => {}}
                      onPause={() => {}}
                      onProgress={() => {}}
                      initialTime={0}
                    />
                  </div>
                </div>
              )}
              {contentType === 'comment' && (
                <div
                  style={{
                    display: 'flex',
                    width: '100%',
                    flexDirection: 'column',
                    alignItems: 'flex-start'
                  }}
                >
                  <div>
                    <UsernameText
                      style={{ fontSize: '1.5rem' }}
                      user={uploader}
                    />
                  </div>
                  <div
                    style={{
                      marginTop: '1rem',
                      fontSize: '1.5rem',
                      width: '100%',
                      textAlign: 'left',
                      color: Color.darkerGray(),
                      whiteSpace: 'pre-wrap',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical'
                    }}
                  >
                    {content}
                  </div>
                </div>
              )}
              {contentType === 'subject' && (
                <div
                  style={{
                    display: 'flex',
                    width: '100%',
                    flexDirection: 'column',
                    alignItems: 'flex-start'
                  }}
                >
                  <div>
                    <UsernameText
                      style={{ fontSize: '1.5rem' }}
                      user={uploader}
                    />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      width: '100%'
                    }}
                  >
                    <div
                      className="label"
                      style={{
                        width: '100%',
                        overflowWrap: 'break-word',
                        wordBreak: 'break-word'
                      }}
                    >
                      <p
                        style={{
                          lineClamp: 2,
                          fontSize: '2.3rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {title}
                      </p>
                      {description && (
                        <div
                          style={{
                            marginTop: '1rem',
                            width: '100%',
                            textAlign: 'left',
                            color: Color.darkerGray(),
                            whiteSpace: 'pre-wrap',
                            overflowWrap: 'break-word',
                            wordBreak: 'break-word',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 4,
                            WebkitBoxOrient: 'vertical'
                          }}
                        >
                          {description}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {contentType === 'url' && (
                <div
                  style={{
                    display: 'flex',
                    width: '100%',
                    flexDirection: 'column',
                    alignItems: 'flex-start'
                  }}
                >
                  <div>
                    <UsernameText
                      style={{ fontSize: '1.5rem' }}
                      user={uploader}
                    />
                  </div>
                  <div>
                    <span
                      style={{
                        marginTop: '1rem',
                        fontSize: '1.7rem',
                        fontWeight: 'bold',
                        lineHeight: 1.5,
                        overflowWrap: 'break-word',
                        wordBreak: 'break-word'
                      }}
                      className="label"
                    >
                      {title}
                    </span>
                    <div>
                      <Embedly
                        small
                        noLink
                        style={{ marginTop: '0.5rem' }}
                        contentId={contentId}
                        directUrl={content}
                        defaultThumbUrl={thumbUrl}
                        defaultActualTitle={actualTitle}
                        defaultActualDescription={actualDescription}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            {contentType === 'subject' && rootObj?.id && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '25%',
                  marginBottom: secretAnswer ? '1rem' : ''
                }}
              >
                {rootObj?.contentType === 'video' && (
                  <VideoThumbImage
                    rewardLevel={rootObj.rewardLevel}
                    videoId={rootObj.id}
                    src={`https://img.youtube.com/vi/${rootObj.content}/mqdefault.jpg`}
                  />
                )}
                {rootObj?.contentType === 'url' && (
                  <Embedly imageOnly noLink contentId={rootObj?.id} />
                )}
              </div>
            )}
            {filePath && (
              <ContentFileViewer
                contentId={contentId}
                contentType={contentType}
                fileName={fileName}
                filePath={filePath}
                fileSize={fileSize}
                thumbUrl={thumbUrl}
                videoHeight="100%"
                style={{
                  marginTop: '5rem',
                  display: 'flex',
                  width: '30rem',
                  height: '15rem'
                }}
              />
            )}
          </div>
          {secretAnswer && (
            <div
              style={{
                padding: '1rem',
                background: Color.ivory(),
                borderTop: `1px solid ${Color.borderGray()}`,
                borderBottom: `1px solid ${Color.borderGray()}`
              }}
            >
              {secretAnswer}
            </div>
          )}
          {deleter && !!onDeletePermanently && (
            <div
              style={{
                marginTop: '1rem',
                padding: '1rem',
                background: isRecovered ? Color.green() : Color.darkerGray(),
                fontSize: '1.5rem',
                marginBottom: '1rem',
                color: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
              className={css`
                margin-left: -1px;
                margin-right: -1px;
                @media (max-width: ${mobileMaxWidth}) {
                  margin-left: 0;
                  margin-right: 0;
                }
              `}
            >
              {isRecovered ? (
                <div>
                  Content Recovered:{' '}
                  <a
                    style={{ color: '#fff', fontWeight: 'bold' }}
                    rel="noreferrer"
                    target="_blank"
                    href={`https://www.twin-kle.com/${
                      contentType === 'url' ? 'link' : contentType
                    }s/${contentId}`}
                  >
                    Click here to view the content
                  </a>
                </div>
              ) : (
                <div>
                  {deletedByLabel}{' '}
                  <UsernameText
                    color="#fff"
                    style={{ fontSize: '1.5rem' }}
                    user={deleter}
                  />
                </div>
              )}
              {managementLevel > 2 && (
                <div style={{ display: 'flex' }}>
                  {!isRecovered && (
                    <Button
                      onClick={() => setConfirmModalShown(true)}
                      color="red"
                      skeuomorphic
                    >
                      {deletePermanentlyLabel}
                    </Button>
                  )}
                  <Button
                    onClick={() => handleUndoDelete({ redo: isRecovered })}
                    color="darkerGray"
                    style={{ marginLeft: '1rem' }}
                    skeuomorphic
                  >
                    {isRecovered ? deleteLabel : undoLabel}
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}
      {confirmModalShown && (
        <ConfirmModal
          onHide={() => setConfirmModalShown(false)}
          title={deletePermanentlyLabel}
          onConfirm={handleDeletePermanently}
        />
      )}
    </div>
  );

  async function handleDeletePermanently() {
    const success = await deletePostPermanently({
      contentId,
      contentType,
      fileName,
      filePath
    });
    if (success && postId) {
      onDeletePermanently?.(postId);
    }
  }

  async function handleUndoDelete({ redo }: { redo: boolean }) {
    const { success, isRecovered } = await deleteContent({
      id: contentId,
      contentType,
      undo: !redo
    });
    if (success) {
      onSetContentState({
        contentId,
        contentType,
        newState: {
          isDeleted: redo,
          isDeleteNotification: redo,
          notFound: false,
          loaded: false
        }
      });
      setContentObj((prevContentObj) => ({
        ...prevContentObj,
        isRecovered
      }));
    }
  }
}

import React, { useMemo, useEffect, useState } from 'react';
import FileAttachment from './FileAttachment';
import UsernameText from '~/components/Texts/UsernameText';
import Button from '~/components/Button';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import Loading from '~/components/Loading';
import localize from '~/constants/localize';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { useAppContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';

const deletedByLabel = localize('deletedBy');
const deleteLabel = localize('delete');
const deletePermanentlyLabel = localize('deletePermanently');
const undoLabel = localize('undo');

export default function DeletedMessage({
  messageId,
  onDeletePermanently,
  style
}: {
  messageId: number;
  onDeletePermanently?: (v: number) => void;
  style?: React.CSSProperties;
}) {
  const { managementLevel } = useKeyContext((v) => v.myState);
  const deleteChatMessage = useAppContext(
    (v) => v.requestHelpers.deleteChatMessage
  );
  const loadDeletedMessage = useAppContext(
    (v) => v.requestHelpers.loadDeletedMessage
  );
  const deleteMessagePermanently = useAppContext(
    (v) => v.requestHelpers.deleteMessagePermanently
  );
  const [loading, setLoading] = useState(false);
  const [messageObj, setMessageObj] = useState({});
  const [confirmModalShown, setConfirmModalShown] = useState(false);

  const {
    id,
    content,
    deleter,
    fileName = '',
    filePath,
    fileSize = 0,
    isRecovered = false,
    thumbUrl,
    uploader = {}
  }: {
    id?: number;
    content?: string;
    deleter?: any;
    fileName?: string;
    filePath?: string;
    fileSize?: number;
    isRecovered?: boolean;
    thumbUrl?: string;
    uploader?: any;
  } = useMemo(() => messageObj, [messageObj]);

  useEffect(() => {
    init();
    async function init() {
      setLoading(true);
      try {
        const data = await loadDeletedMessage(messageId);
        setMessageObj(data);
        setLoading(false);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
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
        margin-bottom: 1rem;
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
      ) : id ? (
        <div style={{ padding: '1rem', height: 'auto' }}>
          <div
            style={{
              display: 'flex',
              width: '100%',
              fontSize: '1.3rem',
              height: 'auto'
            }}
          >
            <div
              style={{
                display: 'flex',
                width: '100%',
                alignItems: 'flex-start',
                flexDirection: 'column'
              }}
            >
              <div>
                <UsernameText style={{ fontSize: '1.5rem' }} user={uploader} />
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
          </div>
          {filePath && fileName && (
            <FileAttachment
              fileName={fileName}
              filePath={filePath}
              fileSize={fileSize}
              messageId={messageId}
              thumbUrl={thumbUrl || ''}
            />
          )}
        </div>
      ) : (
        <div
          style={{
            padding: '1rem',
            fontWeight: 'bold',
            color: Color.darkGray()
          }}
        >
          Deleted
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
            <div>Content Recovered</div>
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
    const success = await deleteMessagePermanently({
      messageId,
      fileName,
      filePath
    });
    if (success) {
      onDeletePermanently?.(messageId);
    }
  }

  async function handleUndoDelete({ redo }: { redo: boolean }) {
    const { success, isRecovered } = await deleteChatMessage({
      messageId,
      isUndo: !redo
    });
    if (success) {
      setMessageObj((prevMessageObj) => ({
        ...prevMessageObj,
        isRecovered
      }));
    }
  }
}

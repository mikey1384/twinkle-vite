import React, { useEffect, useMemo, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import LegacyModalLayout from '~/components/Modal/LegacyModalLayout';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import Message from './Message';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { Color } from '~/constants/css';
import { useAppContext, useKeyContext } from '~/contexts';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import { chatTextClass } from '../../typography';

const dialogActionStyle = { minHeight: 44, fontSize: '14px', color: '#334155' };

export default function SubjectMsgsModal({
  displayedThemeColor = '',
  onHide,
  subjectId,
  subjectTitle
}: {
  displayedThemeColor?: string;
  onHide: () => void;
  subjectId: number;
  subjectTitle: string;
}) {
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const loadChatSubjectMessages = useAppContext(
    (v) => v.requestHelpers.loadChatSubjectMessages
  );
  const { colorKey: loadMoreButtonColor } = useRoleColor('loadMoreButton', {
    themeName: displayedThemeColor || profileTheme,
    fallback: 'lightBlue'
  });
  const headerColor = useMemo(() => {
    const key = displayedThemeColor || profileTheme || 'logoBlue';
    const fn = Color[key as keyof typeof Color];
    return fn ? fn() : key;
  }, [displayedThemeColor, profileTheme]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [requestError, setRequestError] = useState<'initial' | 'more' | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const requestGeneration = useRef(0);
  const [loadMoreButtonShown, setLoadMoreButtonShown] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [usermenuShown, setUsermenuShown] = useState(false);
  useEffect(() => {
    const generation = ++requestGeneration.current;
    setInitialLoading(true);
    setLoading(false);
    setRequestError(null);
    setMessages([]);
    setLoadMoreButtonShown(false);
    handleLoadMessages();
    async function handleLoadMessages() {
      try {
        const { messages, loadMoreButtonShown } =
          await loadChatSubjectMessages({ subjectId });
        if (generation !== requestGeneration.current) return;
        setMessages(messages);
        setLoadMoreButtonShown(loadMoreButtonShown);
      } catch (error: any) {
        if (generation !== requestGeneration.current) return;
        setRequestError('initial');
        console.error(error.response || error);
      } finally {
        if (generation === requestGeneration.current) setInitialLoading(false);
      }
    }
    return () => { requestGeneration.current = generation + 1; };
  }, [loadChatSubjectMessages, subjectId, retryCount]);

  return (
    <Modal
      modalKey="SubjectMsgsModal"
      aria-label={subjectTitle ? `Topic messages: ${subjectTitle}` : 'Topic messages'}
      isOpen
      onClose={onHide}
      closeOnBackdropClick={!usermenuShown}
      modalLevel={2}
      hasHeader={false}
      showCloseButton={false}
      bodyPadding={0}
    >
      <LegacyModalLayout>
        <header style={{ gap: '1.6rem', padding: '1.6rem' }}>
          <h2
            style={{
              flex: 1,
              minWidth: 0,
              margin: 0,
              paddingLeft: '1.2rem',
              borderLeft: `3px solid ${headerColor}`,
              color: '#334155',
              fontSize: 'max(18px, 2rem)',
              lineHeight: 1.4,
              overflowWrap: 'anywhere'
            }}
          >
            {subjectTitle}
          </h2>
          <Button
            aria-label="Close topic messages"
            variant="ghost"
            onClick={onHide}
            style={{ ...dialogActionStyle, minWidth: 44, padding: 0, flexShrink: 0 }}
          >
            <Icon icon="times" />
          </Button>
        </header>
        <main>
          {loadMoreButtonShown && (
            <LoadMoreButton
              color={loadMoreButtonColor}
              style={dialogActionStyle}
              filled
              onClick={onLoadMoreButtonClick}
              loading={loading}
            />
          )}
          {initialLoading && (
            <Loading
              text="Loading topic messages"
              theme={displayedThemeColor || profileTheme}
              innerStyle={{ fontSize: '14px' }}
            />
          )}
          {requestError && (
            <div
              role="alert"
              className={chatTextClass}
              style={{ width: '100%', padding: '1.6rem 0', textAlign: 'center' }}
            >
              <p style={{ marginBottom: '1rem' }}>
                {requestError === 'more'
                  ? "Couldn't load earlier messages. Please try again."
                  : "Couldn't load the topic messages. Please try again."}
              </p>
              <Button
                variant="ghost"
                style={dialogActionStyle}
                onClick={requestError === 'more'
                  ? onLoadMoreButtonClick
                  : () => setRetryCount((count) => count + 1)}
              >
                Retry
              </Button>
            </div>
          )}
          {!initialLoading && !requestError && messages.length === 0 && (
            <p
              role="status"
              className={chatTextClass}
              style={{ padding: '1.6rem 0', textAlign: 'center' }}
            >
              No messages in this topic yet.
            </p>
          )}
          {messages.map((message) => (
            <Message
              key={message.id}
              displayedThemeColor={displayedThemeColor}
              onUsermenuShownChange={setUsermenuShown}
              {...message}
            />
          ))}
        </main>
        <footer>
          <Button variant="ghost" style={dialogActionStyle} onClick={onHide}>
            Close
          </Button>
        </footer>
      </LegacyModalLayout>
    </Modal>
  );

  async function onLoadMoreButtonClick() {
    if (loading || initialLoading) return;
    const generation = requestGeneration.current;
    setLoading(true);
    setRequestError(null);
    try {
      const { messages: loadedMsgs, loadMoreButtonShown } =
        await loadChatSubjectMessages({
          subjectId,
          messageIds: messages.map((message) => Number(message.id))
        });
      if (generation !== requestGeneration.current) return;
      setMessages((current) => loadedMsgs.concat(current));
      setLoadMoreButtonShown(loadMoreButtonShown);
    } catch (error: any) {
      if (generation !== requestGeneration.current) return;
      setRequestError('more');
      console.error(error.response || error);
    } finally {
      if (generation === requestGeneration.current) setLoading(false);
    }
  }
}

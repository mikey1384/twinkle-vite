import React, { useEffect, useMemo, useState } from 'react';
import Modal from '~/components/Modal';
import LegacyModalLayout from '~/components/Modal/LegacyModalLayout';
import Button from '~/components/Button';
import Message from './Message';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { Color } from '~/constants/css';
import { useAppContext, useKeyContext } from '~/contexts';
import { useRoleColor } from '~/theme/hooks/useRoleColor';

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
  const [loadMoreButtonShown, setLoadMoreButtonShown] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [usermenuShown, setUsermenuShown] = useState(false);
  useEffect(() => {
    handleLoadMessages();
    async function handleLoadMessages() {
      try {
        const { messages, loadMoreButtonShown } =
          await loadChatSubjectMessages({ subjectId });
        setMessages(messages);
        setLoadMoreButtonShown(loadMoreButtonShown);
      } catch (error: any) {
        console.error(error.response || error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal
      modalKey="SubjectMsgsModal"
      isOpen
      onClose={onHide}
      closeOnBackdropClick={!usermenuShown}
      modalLevel={2}
      hasHeader={false}
      bodyPadding={0}
    >
      <LegacyModalLayout>
        <header>
          <span style={{ color: headerColor }}>{subjectTitle}</span>
        </header>
        <main>
          {loadMoreButtonShown && (
            <LoadMoreButton
              color={loadMoreButtonColor}
              filled
              onClick={onLoadMoreButtonClick}
              loading={loading}
            />
          )}
          {messages.length === 0 && <Loading />}
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
          <Button variant="ghost" onClick={onHide}>
            Close
          </Button>
        </footer>
      </LegacyModalLayout>
    </Modal>
  );

  async function onLoadMoreButtonClick() {
    setLoading(true);
    try {
      const { messages: loadedMsgs, loadMoreButtonShown } =
        await loadChatSubjectMessages({
          subjectId,
          messageIds: messages.map((message) => Number(message.id))
        });
      setLoading(false);
      setMessages(loadedMsgs.concat(messages));
      setLoadMoreButtonShown(loadMoreButtonShown);
    } catch (error: any) {
      console.error(error.response || error);
    }
  }
}

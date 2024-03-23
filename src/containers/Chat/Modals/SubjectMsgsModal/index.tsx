import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import request from 'axios';
import Message from './Message';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { Color } from '~/constants/css';
import { returnTheme } from '~/helpers';
import { queryStringForArray } from '~/helpers/stringHelpers';
import { useKeyContext } from '~/contexts';
import URL from '~/constants/URL';

const API_URL = `${URL}/chat`;

SubjectMsgsModal.propTypes = {
  displayedThemeColor: PropTypes.string,
  onHide: PropTypes.func.isRequired,
  subjectId: PropTypes.number.isRequired,
  subjectTitle: PropTypes.string.isRequired
};
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
  const { profileTheme } = useKeyContext((v) => v.myState);
  const {
    loadMoreButton: { color: loadMoreButtonColor }
  } = useMemo(
    () => returnTheme(displayedThemeColor || profileTheme),
    [displayedThemeColor, profileTheme]
  );
  const [loading, setLoading] = useState(false);
  const [loadMoreButtonShown, setLoadMoreButtonShown] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [usermenuShown, setUsermenuShown] = useState(false);
  useEffect(() => {
    handleLoadMessages();
    async function handleLoadMessages() {
      try {
        const {
          data: { messages, loadMoreButtonShown }
        } = await request.get(
          `${API_URL}/chatSubject/messages?subjectId=${subjectId}`
        );
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
      modalOverModal
      closeWhenClickedOutside={!usermenuShown}
      onHide={onHide}
    >
      <header>
        <span style={{ color: Color[displayedThemeColor]() }}>
          {subjectTitle}
        </span>
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
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );

  async function onLoadMoreButtonClick() {
    setLoading(true);
    const queryString = queryStringForArray({
      array: messages,
      originVar: 'id',
      destinationVar: 'messageIds'
    });
    try {
      const {
        data: { messages: loadedMsgs, loadMoreButtonShown }
      } = await request.get(
        `${API_URL}/chatSubject/messages/more?subjectId=${subjectId}&${queryString}`
      );
      setLoading(false);
      setMessages(loadedMsgs.concat(messages));
      setLoadMoreButtonShown(loadMoreButtonShown);
    } catch (error: any) {
      console.error(error.response || error);
    }
  }
}

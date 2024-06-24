import React, { useMemo, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import SwitchButton from '~/components/Buttons/SwitchButton';
import AIChatMenu from './AIChatMenu';
import { socket } from '~/constants/io';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { useAppContext, useKeyContext } from '~/contexts';

export default function TopicSettingsModal({
  channelId,
  isOwnerPostingOnly,
  isTwoPeopleChat,
  isAIChannel,
  topicId,
  onHide,
  onEditTopic,
  topicText
}: {
  channelId: number;
  isOwnerPostingOnly: boolean;
  isTwoPeopleChat: boolean;
  isAIChannel: boolean;
  topicId: number;
  onHide: () => void;
  onEditTopic: ({
    topicText,
    isOwnerPostingOnly
  }: {
    topicText: string;
    isOwnerPostingOnly: boolean;
  }) => void;
  topicText: string;
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const editTopic = useAppContext((v) => v.requestHelpers.editTopic);
  const [editedTopicText, setEditedTopicText] = useState(topicText);
  const [ownerOnlyPosting, setOwnerOnlyPosting] = useState(
    !!isOwnerPostingOnly
  );
  const [submitting, setSubmitting] = useState(false);

  const isSubmitDisabled = useMemo(() => {
    return (
      (topicText === editedTopicText &&
        !!isOwnerPostingOnly === ownerOnlyPosting) ||
      editedTopicText.trim().length === 0
    );
  }, [editedTopicText, isOwnerPostingOnly, ownerOnlyPosting, topicText]);

  return (
    <Modal modalOverModal onHide={onHide}>
      <header
        className={css`
          font-size: 1.5rem;
          font-weight: bold;
          text-align: center;
          padding: 1rem;
        `}
      >
        Topic Settings
      </header>
      <main
        className={css`
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        `}
      >
        <div
          className={css`
            width: 100%;
            display: flex;
            justify-content: center;
            margin-bottom: 1rem;
            flex-direction: column;
            align-items: center;
          `}
        >
          <div
            className={css`
              width: 50%;
              margin-bottom: 0.5rem;
              @media (max-width: ${mobileMaxWidth}) {
                width: 100%;
              }
            `}
          >
            <p
              className={css`
                width: 100%;
                font-size: 1.3rem;
                font-weight: bold;
                color: #333;
                align-self: flex-start;
              `}
            >
              Edit Topic Label
            </p>
          </div>
          <Input
            className={css`
              width: 50%;
              @media (max-width: ${mobileMaxWidth}) {
                width: 100%;
              }
            `}
            value={editedTopicText}
            onChange={(text) => setEditedTopicText(text)}
            placeholder="Enter topic text"
          />
        </div>
        {isAIChannel ? (
          <AIChatMenu />
        ) : (
          <div
            className={css`
              margin-top: 0.5rem;
              width: 100%;
              display: flex;
              justify-content: center;
            `}
          >
            <SwitchButton
              checked={ownerOnlyPosting}
              onChange={() => setOwnerOnlyPosting(!ownerOnlyPosting)}
              labelStyle={{
                fontWeight: 'bold',
                fontSize: '1.3rem',
                color: '#333'
              }}
              label={`Only ${
                isTwoPeopleChat ? 'I' : 'owner'
              } can post messages`}
            />
          </div>
        )}
      </main>
      <footer
        className={css`
          display: flex;
          justify-content: flex-end;
          padding: 1rem;
        `}
      >
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          Cancel
        </Button>
        <Button
          loading={submitting}
          disabled={isSubmitDisabled}
          color={doneColor}
          onClick={handleSubmit}
        >
          Save
        </Button>
      </footer>
    </Modal>
  );

  async function handleSubmit() {
    try {
      setSubmitting(true);
      await editTopic({
        channelId,
        topicId,
        topicText: editedTopicText,
        isOwnerPostingOnly: ownerOnlyPosting
      });
      onEditTopic({
        topicText: editedTopicText,
        isOwnerPostingOnly: ownerOnlyPosting
      });
      socket.emit('new_topic_settings', {
        channelId,
        topicId,
        topicTitle: editedTopicText,
        isOwnerPostingOnly: ownerOnlyPosting
      });
      onHide();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  }
}

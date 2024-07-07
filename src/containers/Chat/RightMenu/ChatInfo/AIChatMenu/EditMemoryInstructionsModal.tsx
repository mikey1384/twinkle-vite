import React, { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { useChatContext, useKeyContext } from '~/contexts';

export default function EditMemoryInstructionsModal({
  channelId,
  onHide,
  topicText
}: {
  channelId: number;
  onHide: () => void;
  topicText: string;
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);
  const [editedTopicText, setEditedTopicText] = useState(topicText);
  return (
    <Modal onHide={onHide}>
      <header
        className={css`
          font-size: 1.5rem;
          font-weight: bold;
          text-align: center;
          padding: 1rem;
        `}
      >
        Memory Instructions
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
        <Button color={doneColor} onClick={handleSave}>
          Save
        </Button>
      </footer>
    </Modal>
  );

  async function handleSave() {
    try {
      onSetChannelState({
        channelId,
        newState: { selectedTab: 'all' }
      });
      onHide();
    } catch (error) {
      console.error(error);
    }
  }
}

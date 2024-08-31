import React, { useMemo, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import SwitchButton from '~/components/Buttons/SwitchButton';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import Icon from '~/components/Icon';
import AIChatMenu from './AIChatMenu';
import { socket } from '~/constants/io';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';

export default function TopicSettingsModal({
  channelId,
  customInstructions,
  isOwnerPostingOnly,
  isTwoPeopleChat,
  isAIChannel,
  topicId,
  onHide,
  onDeleteTopic,
  onEditTopic,
  topicText
}: {
  channelId: number;
  customInstructions: string;
  isOwnerPostingOnly: boolean;
  isTwoPeopleChat: boolean;
  isAIChannel: boolean;
  topicId: number;
  onHide: () => void;
  onDeleteTopic: () => void;
  onEditTopic: (data: {
    topicText: string;
    isOwnerPostingOnly: boolean;
    customInstructions?: string;
  }) => void;
  topicText: string;
}) {
  const loadChatChannel = useAppContext(
    (v) => v.requestHelpers.loadChatChannel
  );
  const updateLastTopicId = useAppContext(
    (v) => v.requestHelpers.updateLastTopicId
  );
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const onEnterChannelWithId = useChatContext(
    (v) => v.actions.onEnterChannelWithId
  );
  const onEnterTopic = useChatContext((v) => v.actions.onEnterTopic);
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);
  const editTopic = useAppContext((v) => v.requestHelpers.editTopic);
  const deleteTopic = useAppContext((v) => v.requestHelpers.deleteTopic);
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const [editedTopicText, setEditedTopicText] = useState(topicText);
  const [ownerOnlyPosting, setOwnerOnlyPosting] = useState(
    !!isOwnerPostingOnly
  );
  const [submitting, setSubmitting] = useState(false);
  const [isCustomInstructionsOn, setIsCustomInstructionsOn] = useState(
    !!customInstructions
  );
  const [newCustomInstructions, setNewCustomInstructions] = useState(
    customInstructions || ''
  );

  const isSubmitDisabled = useMemo(() => {
    if (isAIChannel) {
      return (
        (topicText === editedTopicText &&
          !!isOwnerPostingOnly === ownerOnlyPosting &&
          !!customInstructions === isCustomInstructionsOn &&
          customInstructions === newCustomInstructions) ||
        (isCustomInstructionsOn && newCustomInstructions.trim().length === 0) ||
        editedTopicText.trim().length === 0
      );
    } else {
      return (
        (topicText === editedTopicText &&
          !!isOwnerPostingOnly === ownerOnlyPosting) ||
        editedTopicText.trim().length === 0
      );
    }
  }, [
    isAIChannel,
    topicText,
    editedTopicText,
    isOwnerPostingOnly,
    ownerOnlyPosting,
    customInstructions,
    isCustomInstructionsOn,
    newCustomInstructions
  ]);

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
          <AIChatMenu
            topicText={editedTopicText}
            isCustomInstructionsOn={isCustomInstructionsOn}
            onSetIsCustomInstructionsOn={setIsCustomInstructionsOn}
            newCustomInstructions={newCustomInstructions}
            customInstructions={customInstructions}
            onSetCustomInstructions={setNewCustomInstructions}
          />
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
        {isAIChannel && (
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <Button
              onClick={() => setConfirmModalShown(true)}
              color="red"
              filled
              style={{
                padding: '0.7rem',
                fontSize: '1rem',
                marginTop: '5rem'
              }}
            >
              <Icon style={{ marginRight: '0.5rem' }} icon="trash-alt" />
              Delete Topic
            </Button>
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
      {confirmModalShown && (
        <ConfirmModal
          modalOverModal
          onHide={() => setConfirmModalShown(false)}
          title="Delete Topic"
          descriptionFontSize="1.7rem"
          description="Are you sure? This will also delete all messages in this topic."
          onConfirm={handleDeleteTopic}
        />
      )}
    </Modal>
  );

  async function handleDeleteTopic() {
    try {
      await deleteTopic({ topicId, channelId });
      const data = await loadChatChannel({ channelId });
      onEnterChannelWithId(data);
      onSetChannelState({
        channelId,
        newState: { selectedTab: 'all' }
      });
      onDeleteTopic();
      onHide();
    } catch (error) {
      console.error(error);
    }
  }

  async function handleSubmit() {
    try {
      setSubmitting(true);
      if (
        isAIChannel &&
        isCustomInstructionsOn &&
        customInstructions !== newCustomInstructions
      ) {
        updateLastTopicId({
          channelId,
          topicId
        });
        onEnterTopic({ channelId, topicId });
      }
      await editTopic({
        channelId,
        topicId,
        topicText: editedTopicText,
        isOwnerPostingOnly: ownerOnlyPosting,
        isAIChat: isAIChannel,
        ...(isAIChannel &&
          isCustomInstructionsOn && {
            customInstructions: newCustomInstructions
          })
      });
      onEditTopic({
        topicText: editedTopicText,
        isOwnerPostingOnly: ownerOnlyPosting,
        ...(isAIChannel &&
          isCustomInstructionsOn && {
            customInstructions: newCustomInstructions
          })
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

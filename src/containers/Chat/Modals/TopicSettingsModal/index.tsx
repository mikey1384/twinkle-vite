import React, { useEffect, useMemo, useState } from 'react';
import NewModal from '~/components/NewModal';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import SwitchButton from '~/components/Buttons/SwitchButton';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import Icon from '~/components/Icon';
import AIChatTopicMenu from './AIChatTopicMenu';
import { socket } from '~/constants/sockets/api';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
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
  topicText,
  isSharedWithOtherUsers
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
    isSharedWithOtherUsers?: boolean;
  }) => void;
  topicText: string;
  isSharedWithOtherUsers?: boolean;
}) {
  const loadChatChannel = useAppContext(
    (v) => v.requestHelpers.loadChatChannel
  );
  const updateLastTopicId = useAppContext(
    (v) => v.requestHelpers.updateLastTopicId
  );
  const doneColor = useKeyContext((v) => v.theme.done.color);
  const onEnterChannelWithId = useChatContext(
    (v) => v.actions.onEnterChannelWithId
  );
  const onEnterTopic = useChatContext((v) => v.actions.onEnterTopic);
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);
  const editTopic = useAppContext((v) => v.requestHelpers.editTopic);
  const deleteTopic = useAppContext((v) => v.requestHelpers.deleteTopic);
  const updateTopicShareState = useAppContext(
    (v) => v.requestHelpers.updateTopicShareState
  );
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
  const [isShared, setIsShared] = useState(!!isSharedWithOtherUsers);

  useEffect(() => {
    setIsShared(!!isSharedWithOtherUsers);
  }, [isSharedWithOtherUsers]);

  const trimmedCustomInstructions = useMemo(
    () => newCustomInstructions.trim(),
    [newCustomInstructions]
  );
  const canShareTopic = useMemo(
    () =>
      isAIChannel &&
      isCustomInstructionsOn &&
      trimmedCustomInstructions.length > 0,
    [isAIChannel, isCustomInstructionsOn, trimmedCustomInstructions]
  );
  const effectiveShareState = useMemo(
    () => (canShareTopic ? isShared : false),
    [canShareTopic, isShared]
  );

  const isSubmitDisabled = useMemo(() => {
    const trimmedTopicText = editedTopicText.trim();
    if (isAIChannel) {
      const baseUnchanged =
        topicText === editedTopicText &&
        !!isOwnerPostingOnly === ownerOnlyPosting &&
        !!customInstructions === isCustomInstructionsOn &&
        customInstructions === newCustomInstructions;
      const shareUnchanged =
        !canShareTopic ||
        effectiveShareState === !!isSharedWithOtherUsers;
      const missingCustomInstructions =
        isCustomInstructionsOn && trimmedCustomInstructions.length === 0;
      return (
        (baseUnchanged && shareUnchanged) ||
        missingCustomInstructions ||
        trimmedTopicText.length === 0
      );
    }
    return (
      (topicText === editedTopicText &&
        !!isOwnerPostingOnly === ownerOnlyPosting) ||
      trimmedTopicText.length === 0
    );
  }, [
    canShareTopic,
    customInstructions,
    editedTopicText,
    effectiveShareState,
    isAIChannel,
    isCustomInstructionsOn,
    isOwnerPostingOnly,
    isSharedWithOtherUsers,
    newCustomInstructions,
    ownerOnlyPosting,
    topicText,
    trimmedCustomInstructions
  ]);

  return (
    <NewModal
      isOpen
      onClose={onHide}
      size="md"
      allowOverflow
      modalLevel={2}
      header={
        <div
          className={css`
            font-size: 1.5rem;
            font-weight: bold;
            text-align: left;
            padding: 1rem;
          `}
        >
          Topic Settings
        </div>
      }
      footer={
        <>
          <Button
            variant="ghost"
            style={{ marginRight: '0.7rem' }}
            onClick={onHide}
          >
            Cancel
          </Button>
          <Button
            variant="ghost"
            loading={submitting}
            disabled={isSubmitDisabled}
            color={doneColor}
            onClick={handleSubmit}
          >
            Save
          </Button>
        </>
      }
    >
      <div
        className={css`
          width: 100%;
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
          <>
            <AIChatTopicMenu
              topicText={editedTopicText}
              isCustomInstructionsOn={isCustomInstructionsOn}
              onSetIsCustomInstructionsOn={setIsCustomInstructionsOn}
              newCustomInstructions={newCustomInstructions}
              customInstructions={customInstructions}
              onSetCustomInstructions={setNewCustomInstructions}
            />
            {canShareTopic && (
              <div
                className={css`
                  margin-top: 1.5rem;
                  width: 100%;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                `}
              >
                <SwitchButton
                  checked={isShared}
                  disabled={submitting}
                  onChange={() => setIsShared((prev) => !prev)}
                  label="Share with other AI chat users"
                  labelStyle={{
                    fontWeight: 'bold',
                    fontSize: '1.3rem',
                    color: '#333'
                  }}
                />
                {isShared && (
                  <small
                    style={{
                      marginTop: '0.5rem',
                      color: Color.darkerGray()
                    }}
                  >
                    Will be shareable with other users after saving
                  </small>
                )}
              </div>
            )}
          </>
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
              variant="soft"
              tone="raised"
              style={{
                padding: '0.7rem',
                fontSize: '1rem',
                marginTop: '2rem'
              }}
            >
              <Icon style={{ marginRight: '0.5rem' }} icon="trash-alt" />
              Delete Topic
            </Button>
          </div>
        )}
      </div>
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
    </NewModal>
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
      if (isAIChannel) {
        const prevShared = !!isSharedWithOtherUsers;
        if (effectiveShareState !== prevShared) {
          await updateTopicShareState({
            channelId,
            topicId,
            shareWithOtherUsers: effectiveShareState
          });
        }
      }
      onEditTopic({
        topicText: editedTopicText,
        isOwnerPostingOnly: ownerOnlyPosting,
        ...(isAIChannel &&
          isCustomInstructionsOn && {
            customInstructions: newCustomInstructions
          }),
        isSharedWithOtherUsers: effectiveShareState
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

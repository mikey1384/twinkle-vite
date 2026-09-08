import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import SwitchButton from '~/components/Buttons/SwitchButton';
import Icon from '~/components/Icon';
import AIChatTopicMenu from './AIChatTopicMenu';
import { buildCanonicalChannelMessagesState } from '../helpers';
import { charLimit } from '~/constants/defaultValues';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { useNavigate } from 'react-router-dom';
import { chatTopicActionStyle, chatTopicModalClass } from '../topicStyles';
import {
  topicSettingsFormClass,
  topicSettingsLabelClass,
  topicSettingsHelpClass,
  topicSettingsSectionClass,
  topicSettingsSwitchStyle,
  topicSettingsSwitchLabelStyle
} from './styles';

interface CanonicalTopicSettings {
  topicTitle: string;
  isOwnerPostingOnly: boolean;
  customInstructions: string;
}

export default function TopicSettingsModal({
  channelId,
  customInstructions,
  displayedThemeColor,
  isOwnerPostingOnly,
  isTwoPeopleChat,
  isAIChannel,
  canDeleteTopic = false,
  currentTopicId,
  topicId,
  onHide,
  onDeleteTopic,
  onEditTopic,
  topicText,
  isSharedWithOtherUsers,
  pathId
}: {
  channelId: number;
  customInstructions: string;
  displayedThemeColor: string;
  isOwnerPostingOnly: boolean;
  isTwoPeopleChat: boolean;
  isAIChannel: boolean;
  canDeleteTopic?: boolean;
  currentTopicId?: number;
  topicId: number;
  onHide: () => void;
  onDeleteTopic: () => void;
  onEditTopic: (data: {
    topicText: string;
    isOwnerPostingOnly: boolean;
    customInstructions?: string;
    isSharedWithOtherUsers?: boolean;
  }) => void;
  topicText?: string;
  isSharedWithOtherUsers?: boolean;
  pathId: string;
}) {
  const navigate = useNavigate();
  const originalShareState = !!isSharedWithOtherUsers;
  const inputId = useId();
  const userId = useKeyContext((v) => v.myState.userId);
  const loadChatChannel = useAppContext((v) => v.requestHelpers.loadChatChannel);
  const updateLastTopicId = useAppContext((v) => v.requestHelpers.updateLastTopicId);
  const onEnterChannelWithId = useChatContext((v) => v.actions.onEnterChannelWithId);
  const onSetChannelState = useChatContext((v) => v.actions.onSetChannelState);
  const currentMessagesObj = useChatContext(
    (v) => v.state.channelsObj[channelId]?.messagesObj
  );
  const editTopic = useAppContext((v) => v.requestHelpers.editTopic);
  const deleteTopic = useAppContext((v) => v.requestHelpers.deleteTopic);
  const updateTopicShareState = useAppContext(
    (v) => v.requestHelpers.updateTopicShareState
  );
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const [editedTopicText, setEditedTopicText] = useState(topicText || '');
  const [ownerOnlyPosting, setOwnerOnlyPosting] = useState(!!isOwnerPostingOnly);
  const [pendingAction, setPendingAction] = useState<'save' | 'delete' | null>(null);
  const [actionError, setActionError] = useState('');
  const [saveNeedsRetry, setSaveNeedsRetry] = useState(false);
  const [deletionNeedsRefresh, setDeletionNeedsRefresh] = useState(false);
  const [instructionsBusy, setInstructionsBusy] = useState(false);
  const [isCustomInstructionsOn, setIsCustomInstructionsOn] = useState(!!customInstructions);
  const [newCustomInstructions, setNewCustomInstructions] = useState(customInstructions || '');
  const [isShared, setIsShared] = useState(originalShareState);
  const deleteDraftRef = useRef<(() => Promise<void>) | null>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const operationRef = useRef(false);
  const instructionsBusyRef = useRef(false);
  const deletedTopicRef = useRef(false);
  // A failed follow-up must not repeat an acknowledged edit (which may start AI work).
  const savedEditRef = useRef<{
    fingerprint: string;
    settings: CanonicalTopicSettings;
  } | null>(null);
  const savedShareRef = useRef(originalShareState);
  const navigationPendingRef = useRef(false);

  useEffect(() => {
    setIsShared(originalShareState);
    savedShareRef.current = originalShareState;
  }, [originalShareState]);

  useEffect(() => {
    if (actionError) errorRef.current?.focus();
  }, [actionError]);

  const handleInstructionsBusy = useCallback((busy: boolean) => {
    instructionsBusyRef.current = busy;
    setInstructionsBusy(busy);
  }, []);
  const handleSetDeleteDraft = useCallback((fn: () => Promise<void>) => {
    deleteDraftRef.current = fn;
  }, []);

  const titleError = !editedTopicText.trim()
    ? 'Enter a topic label.'
    : editedTopicText.length > charLimit.chat.topic
    ? `Keep the topic label within ${charLimit.chat.topic} characters.`
    : '';
  const trimmedInstructions = newCustomInstructions.trim();
  const canShareTopic = isAIChannel && isCustomInstructionsOn && !!trimmedInstructions;
  const effectiveShareState = canShareTopic ? isShared : false;
  const deleteButtonShown = isAIChannel || canDeleteTopic;
  const instructionsInvalid = isAIChannel && isCustomInstructionsOn &&
    (!trimmedInstructions || newCustomInstructions.length > charLimit.comment);
  const baseUnchanged = (topicText || '') === editedTopicText &&
    !!isOwnerPostingOnly === ownerOnlyPosting &&
    (!isAIChannel || (
      !!customInstructions === isCustomInstructionsOn &&
      (!isCustomInstructionsOn || customInstructions === newCustomInstructions)
    ));
  const shareUnchanged = !isAIChannel ||
    effectiveShareState === originalShareState;
  const isSubmitDisabled = !!pendingAction || deletionNeedsRefresh ||
    instructionsBusy || !!titleError || !!instructionsInvalid ||
    (baseUnchanged && shareUnchanged && !saveNeedsRetry);
  const formDisabled = !!pendingAction || deletionNeedsRefresh;

  return (
    <Modal
      modalKey="TopicSettingsModal"
      isOpen
      onClose={handleClose}
      size="md"
      modalLevel={2}
      title="Topic Settings"
      aria-label="Topic settings"
      className={chatTopicModalClass}
      style={{ width: 'min(600px, calc(100vw - 24px))', maxWidth: '100%' }}
      bodyPadding="12px"
      footer={
        <div style={{ width: '100%' }}>
          {actionError && (
            <p ref={errorRef} tabIndex={-1} role="alert" className={topicSettingsHelpClass} data-error="true"
              style={{ margin: '0 0 12px' }}>
              {actionError}
            </p>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="ghost" style={chatTopicActionStyle}
              disabled={!!pendingAction} onClick={handleClose}>
              {deletionNeedsRefresh ? 'Close' : 'Cancel'}
            </Button>
            {deletionNeedsRefresh ? (
              <Button variant="soft" color={displayedThemeColor}
                style={chatTopicActionStyle} loading={pendingAction === 'delete'}
                disabled={!!pendingAction} onClick={handleDeleteTopic}>
                Retry refresh
              </Button>
            ) : (
              <Button variant="soft" tone="raised" color={displayedThemeColor}
                style={chatTopicActionStyle} loading={pendingAction === 'save'}
                disabled={isSubmitDisabled} onClick={handleSubmit}>
                {saveNeedsRetry ? 'Retry save' : 'Save'}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className={topicSettingsFormClass}>
        <div>
          <label htmlFor={inputId} className={topicSettingsLabelClass}>Topic label</label>
          <Input
            id={inputId}
            value={editedTopicText}
            disabled={formDisabled}
            onChange={setEditedTopicText}
            placeholder="Enter topic text"
            aria-invalid={!!titleError}
            aria-describedby={`${inputId}-help`}
            hasError={!!titleError}
          />
          <p id={`${inputId}-help`} className={topicSettingsHelpClass} data-error={!!titleError}>
            {titleError ? `${titleError} ` : ''}{editedTopicText.length} / {charLimit.chat.topic} characters
          </p>
        </div>
        {isAIChannel ? (
          <>
            <AIChatTopicMenu
              topicId={topicId}
              topicText={editedTopicText}
              displayedThemeColor={displayedThemeColor}
              disabled={formDisabled}
              isCustomInstructionsOn={isCustomInstructionsOn}
              onSetIsCustomInstructionsOn={setIsCustomInstructionsOn}
              newCustomInstructions={newCustomInstructions}
              customInstructions={customInstructions}
              onSetCustomInstructions={setNewCustomInstructions}
              onSetDeleteDraft={handleSetDeleteDraft}
              onBusyChange={handleInstructionsBusy}
            />
            {canShareTopic && (
              <div className={topicSettingsSectionClass}>
                <SwitchButton
                  checked={isShared}
                  disabled={formDisabled || instructionsBusy}
                  onChange={() => setIsShared((prev) => !prev)}
                  ariaLabel="Share with other users"
                  label="Share with other users"
                  small={false}
                  theme={displayedThemeColor}
                  style={topicSettingsSwitchStyle}
                  labelStyle={topicSettingsSwitchLabelStyle}
                />
                <p className={topicSettingsHelpClass}>
                  {isShared
                    ? 'Other users will be able to clone this topic after you save.'
                    : 'Keep this topic private to your AI chat.'}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className={topicSettingsSectionClass}>
            <SwitchButton
              checked={ownerOnlyPosting}
              disabled={formDisabled}
              onChange={() => setOwnerOnlyPosting((prev) => !prev)}
              ariaLabel={`Only ${isTwoPeopleChat ? 'I' : 'owner'} can post messages`}
              label={`Only ${isTwoPeopleChat ? 'I' : 'owner'} can post messages`}
              small={false}
              theme={displayedThemeColor}
              style={topicSettingsSwitchStyle}
              labelStyle={topicSettingsSwitchLabelStyle}
            />
          </div>
        )}
        {instructionsBusy && (
          <p role="status" className={topicSettingsHelpClass} style={{ margin: 0 }}>
            {isCustomInstructionsOn
              ? 'Wait for the instructions to finish before saving.'
              : 'Preparing suggested instructions. Turn on Custom Instructions to review them.'}
          </p>
        )}
        {deleteButtonShown && !deletionNeedsRefresh && (
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
            <Button onClick={() => setConfirmModalShown(true)}
              disabled={formDisabled || instructionsBusy}
              color="red" variant="soft" style={chatTopicActionStyle}>
              <Icon style={{ marginRight: 8 }} icon="trash-alt" />
              Delete Topic
            </Button>
          </div>
        )}
      </div>
      {confirmModalShown && (
        <Modal
          modalKey="DeleteChatTopic"
          isOpen
          modalLevel={3}
          priority
          size="sm"
          title="Delete Topic"
          aria-label="Delete topic confirmation"
          className={chatTopicModalClass}
          style={{ width: 'min(400px, calc(100vw - 24px))', maxWidth: '100%' }}
          bodyPadding="12px"
          onClose={() => { if (!operationRef.current) setConfirmModalShown(false); }}
          footer={
            <>
              <Button variant="ghost" style={{ ...chatTopicActionStyle, marginRight: 8 }}
                disabled={!!pendingAction} onClick={() => setConfirmModalShown(false)}>
                Cancel
              </Button>
              <Button color="red" variant="soft" style={chatTopicActionStyle}
                disabled={!!pendingAction} loading={pendingAction === 'delete'}
                onClick={handleDeleteTopic}>
                Delete Topic
              </Button>
            </>
          }
        >
          <p style={{ margin: 0, color: '#334155', fontSize: 16, lineHeight: 1.6 }}>
            {isAIChannel ? 'Are you sure you want to delete this AI topic?' : 'Remove this topic?'}
          </p>
        </Modal>
      )}
    </Modal>
  );

  function handleClose() {
    if (!operationRef.current) onHide();
  }

  async function handleDeleteTopic() {
    if (!deleteButtonShown || operationRef.current || instructionsBusyRef.current) return;
    operationRef.current = true;
    setPendingAction('delete');
    setActionError('');
    try {
      if (!deletedTopicRef.current) {
        await deleteTopic({ topicId, channelId });
        deletedTopicRef.current = true;
      }
      const data = await loadChatChannel({
        channelId,
        skipUpdateChannelId: true,
        hydrateMessages: true,
        fromWriter: true
      });
      const canonicalChannel = data?.channel || {};
      const deletedTopicIsActive = Number(currentTopicId) === Number(topicId);
      if (isAIChannel) {
        onEnterChannelWithId({ data, userId });
      }
      onSetChannelState({
        channelId,
        newState: {
          featuredTopicId: canonicalChannel.featuredTopicId || null,
          lastTopicId: canonicalChannel.lastTopicId || null,
          pinnedTopicIds: canonicalChannel.pinnedTopicIds || [],
          topicObj: canonicalChannel.topicObj || {},
          ...(!isAIChannel && Array.isArray(data?.messages)
            ? buildCanonicalChannelMessagesState({
                messages: data.messages,
                existingMessagesObj: currentMessagesObj,
                messagesHydrated: data.messagesHydrated === true
              })
            : {}),
          ...(deletedTopicIsActive
            ? {
                selectedTab: 'all',
                selectedTopicId: null,
                topicHistory: [],
                currentTopicIndex: -1
              }
            : {})
        }
      });
      if (deletedTopicIsActive) {
        navigate(`/chat/${pathId}`);
      }
      onDeleteTopic();
      onHide();
    } catch (error) {
      console.error(error);
      setConfirmModalShown(false);
      setDeletionNeedsRefresh(deletedTopicRef.current);
      setActionError(deletedTopicRef.current
        ? 'The topic was deleted, but the chat could not refresh. Retry the refresh to update this list.'
        : "Couldn't delete this topic. Please try again.");
    } finally {
      operationRef.current = false;
      setPendingAction(null);
    }
  }

  async function handleSubmit() {
    if (isSubmitDisabled || operationRef.current || instructionsBusyRef.current) return;
    operationRef.current = true;
    setPendingAction('save');
    setActionError('');
    const payload = {
      channelId,
      topicId,
      topicText: editedTopicText,
      isOwnerPostingOnly: ownerOnlyPosting,
      isAIChat: isAIChannel,
      ...(isAIChannel && isCustomInstructionsOn && {
        customInstructions: newCustomInstructions
      })
    };
    const fingerprint = JSON.stringify(payload);
    let stage: 'edit' | 'share' | 'navigation' = 'edit';
    try {
      if (savedEditRef.current?.fingerprint !== fingerprint) {
        const { topicSettings } = await editTopic(payload);
        savedEditRef.current = { fingerprint, settings: topicSettings };
        if (isAIChannel && isCustomInstructionsOn &&
            customInstructions !== newCustomInstructions) {
          navigationPendingRef.current = true;
        }
      }
      if (isAIChannel && effectiveShareState !== savedShareRef.current) {
        stage = 'share';
        await updateTopicShareState({
          channelId, topicId, shareWithOtherUsers: effectiveShareState
        });
        savedShareRef.current = effectiveShareState;
      }
      publishCanonicalSettings(savedEditRef.current.settings);
      if (navigationPendingRef.current) {
        stage = 'navigation';
        await updateLastTopicId({ channelId, topicId });
        navigationPendingRef.current = false;
        navigate(`/chat/${pathId}/topic/${topicId}`);
      }
      // Draft cleanup is ancillary: a failure must not turn a successful save into a retry.
      if (isAIChannel && deleteDraftRef.current) {
        try { await deleteDraftRef.current(); } catch (error) { console.error(error); }
      }
      onHide();
    } catch (error) {
      console.error(error);
      const savedEdit = savedEditRef.current;
      const editWasSaved = savedEdit?.fingerprint === fingerprint;
      if (editWasSaved) publishCanonicalSettings(savedEdit.settings);
      setSaveNeedsRetry(!!editWasSaved);
      setActionError(stage === 'share'
        ? 'Topic settings were saved, but sharing could not be updated. Retry save to finish.'
        : stage === 'navigation'
        ? 'Topic settings were saved, but the topic could not be opened. Retry save to finish.'
        : "Couldn't save this topic. Your changes are still here; please try again.");
    } finally {
      operationRef.current = false;
      setPendingAction(null);
    }
  }

  function publishCanonicalSettings(settings: CanonicalTopicSettings) {
    onEditTopic({
      topicText: settings.topicTitle,
      isOwnerPostingOnly: settings.isOwnerPostingOnly,
      ...(isAIChannel && { customInstructions: settings.customInstructions }),
      isSharedWithOtherUsers: savedShareRef.current
    });
  }
}

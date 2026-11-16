import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import SwitchButton from '~/components/Buttons/SwitchButton';
import Icon from '~/components/Icon';
import AIChatTopicMenu from './AIChatTopicMenu';
import TopicBrain from './TopicBrain';
import TopicPostersModal from './TopicPostersModal';
import {
  formatChosenSummary,
  topicPostingModeOf,
  type TopicPoster,
  type TopicPostingMode
} from '../../topicPosting';
import { buildCanonicalChannelMessagesState } from '../helpers';
import { charLimit } from '~/constants/defaultValues';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { useNavigate } from 'react-router-dom';
import { chatTopicActionStyle, chatTopicButtonStyle, chatTopicModalClass } from '../topicStyles';
import {
  topicSettingsFormClass,
  topicSettingsLabelClass,
  topicSettingsHelpClass,
  topicSettingsSectionClass,
  topicSettingsSwitchStyle,
  topicSettingsSwitchLabelStyle,
  topicPostingOptionsClass,
  topicPostingChosenRowClass
} from './styles';

interface CanonicalTopicSettings {
  channelId?: number;
  topicId?: number;
  topicTitle: string;
  isOwnerPostingOnly: boolean;
  postingMode?: TopicPostingMode;
  postingSetBy?: string;
  posters?: Array<{ id: number; username: string }>;
  customInstructions: string;
}

interface SavedPosting {
  mode: TopicPostingMode;
  posters: TopicPoster[];
  setBy: 'chat_owner' | 'topic_owner';
  topicOwnerId: number;
  topicOwnerName: string;
  channelOwnerId: number;
}

export default function TopicSettingsModal({
  channelId,
  customInstructions,
  displayedThemeColor,
  isOwnerPostingOnly,
  postingMode: initialPostingMode,
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
  postingMode?: TopicPostingMode;
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
  const onChangeTopicSettings = useChatContext(
    (v) => v.actions.onChangeTopicSettings
  );
  const currentMessagesObj = useChatContext(
    (v) => v.state.channelsObj[channelId]?.messagesObj
  );
  const channelMembers = useChatContext(
    (v) => v.state.channelsObj[channelId]?.members
  );
  const loadTopicPosting = useAppContext((v) => v.requestHelpers.loadTopicPosting);
  const editTopic = useAppContext((v) => v.requestHelpers.editTopic);
  const deleteTopic = useAppContext((v) => v.requestHelpers.deleteTopic);
  const updateTopicShareState = useAppContext(
    (v) => v.requestHelpers.updateTopicShareState
  );
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const [editedTopicText, setEditedTopicText] = useState(topicText || '');
  const startingPostingMode = topicPostingModeOf({
    postingMode: initialPostingMode,
    isOwnerPostingOnly
  });
  const [postingMode, setPostingMode] = useState<TopicPostingMode>(startingPostingMode);
  const [posters, setPosters] = useState<TopicPoster[]>([]);
  // The canonical rule, read when the window opens; editing waits for it.
  const [savedPosting, setSavedPosting] = useState<SavedPosting | null>(null);
  const [postingLoadFailed, setPostingLoadFailed] = useState(false);
  const [postingAttempt, setPostingAttempt] = useState(0);
  const [pickerShown, setPickerShown] = useState(false);
  const modeBeforePickerRef = useRef<TopicPostingMode | null>(null);
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

  useEffect(() => {
    if (isAIChannel) return;
    let canceled = false;
    setPostingLoadFailed(false);
    (async () => {
      try {
        const data = await loadTopicPosting({ channelId, topicId });
        if (canceled) return;
        const mode = topicPostingModeOf({ postingMode: data?.postingMode });
        const loaded: TopicPoster[] = Array.isArray(data?.posters) ? data.posters : [];
        setSavedPosting({
          mode,
          posters: loaded,
          setBy: data?.postingSetBy === 'topic_owner' ? 'topic_owner' : 'chat_owner',
          topicOwnerId: Number(data?.topicOwnerId || 0),
          topicOwnerName: String(data?.topicOwnerName || ''),
          channelOwnerId: Number(data?.channelOwnerId || 0)
        });
        setPostingMode(mode);
        setPosters(loaded);
      } catch (error) {
        console.error(error);
        if (!canceled) setPostingLoadFailed(true);
      }
    })();
    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, topicId, isAIChannel, postingAttempt]);

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
  const postingReady = !isAIChannel && !!savedPosting;
  // The chat owner editing someone else's topic. Changing the mode of a rule
  // the topic owner could post under makes it the chat owner's rule; only the
  // chosen list changing keeps it the topic owner's (as the server decides).
  const editorIsChatOwnerOnly =
    !!savedPosting &&
    !isTwoPeopleChat &&
    Number(userId) === savedPosting.channelOwnerId &&
    Number(userId) !== savedPosting.topicOwnerId;
  const topicOwnerCouldPost =
    !!savedPosting &&
    (savedPosting.mode === 'everyone' || savedPosting.setBy === 'topic_owner');
  const becomesChatOwnerRule =
    editorIsChatOwnerOnly &&
    topicOwnerCouldPost &&
    postingMode !== savedPosting?.mode &&
    postingMode !== 'everyone';
  const keepsTopicOwnerRule =
    !editorIsChatOwnerOnly ||
    (savedPosting?.setBy === 'topic_owner' && postingMode === savedPosting.mode);
  const pickerAlwaysAllowedIds = (savedPosting
    ? keepsTopicOwnerRule
      ? [savedPosting.topicOwnerId, savedPosting.channelOwnerId]
      : [savedPosting.channelOwnerId]
    : []
  ).filter((id) => id > 0);
  const topicOwnerLabel = savedPosting?.topicOwnerName || 'The topic owner';
  const topicOwnerNotice = !becomesChatOwnerRule
    ? ''
    : postingMode === 'chosen'
      ? posters.some((poster) => poster.id === savedPosting?.topicOwnerId)
        ? `${topicOwnerLabel} owns this topic; they stay able to post unless you untick them.`
        : `${topicOwnerLabel} owns this topic and won't be able to post unless you tick them.`
      : `${topicOwnerLabel} owns this topic and won't be able to post either.`;
  const postingUnchanged = isAIChannel || !savedPosting || (
    postingMode === savedPosting.mode &&
    (postingMode !== 'chosen' ||
      posterIdsKey(posters) === posterIdsKey(savedPosting.posters))
  );
  const baseUnchanged = (topicText || '') === editedTopicText &&
    postingUnchanged &&
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
        <>
          {actionError && (
            <p ref={errorRef} tabIndex={-1} role="alert" className={topicSettingsHelpClass} data-error="true"
              style={{ width: '100%', margin: 0 }}>
              {actionError}
            </p>
          )}
          <Button variant="ghost"
            disabled={!!pendingAction} onClick={handleClose}>
            {deletionNeedsRefresh ? 'Close' : 'Cancel'}
          </Button>
          {deletionNeedsRefresh ? (
            <Button color={displayedThemeColor}
              style={chatTopicButtonStyle(displayedThemeColor)} loading={pendingAction === 'delete'}
              disabled={!!pendingAction} onClick={handleDeleteTopic}>
              Retry refresh
            </Button>
          ) : (
            <Button color={displayedThemeColor}
              style={chatTopicButtonStyle(displayedThemeColor)} loading={pendingAction === 'save'}
              disabled={isSubmitDisabled} onClick={handleSubmit}>
              {saveNeedsRetry ? 'Retry save' : 'Save'}
            </Button>
          )}
        </>
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
            <TopicBrain
              channelId={channelId}
              topicId={topicId}
              assistantName="Zero or Ciel"
              themeColor={displayedThemeColor}
              disabled={formDisabled || instructionsBusy}
              onUseAsInstructions={handleUseFileAsInstructions}
              onInstructionsChanged={handleInstructionsRestored}
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
            <fieldset
              className={topicPostingOptionsClass}
              disabled={formDisabled || !postingReady}
            >
              <legend className={topicSettingsLabelClass}>
                Who can post in this topic
              </legend>
              {postingOptions().map((option) => (
                <label key={option.value}>
                  <input
                    type="radio"
                    name={`${inputId}-posting`}
                    value={option.value}
                    checked={postingMode === option.value}
                    onChange={() => handlePostingModeChange(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
              {topicOwnerNotice && (
                <p className={topicSettingsHelpClass} role="status">
                  {topicOwnerNotice}
                </p>
              )}
              {postingMode === 'chosen' && (
                <div className={topicPostingChosenRowClass}>
                  <span>
                    Chosen members: <b>{formatChosenSummary(posters)}</b>
                  </span>
                  <Button
                    variant="ghost"
                    uppercase={false}
                    style={chatTopicActionStyle}
                    disabled={formDisabled || !postingReady}
                    onClick={() => {
                      modeBeforePickerRef.current = null;
                      setPickerShown(true);
                    }}
                  >
                    Edit
                  </Button>
                </div>
              )}
            </fieldset>
            {postingLoadFailed && (
              <p className={topicSettingsHelpClass} data-error="true" role="alert">
                Couldn’t load who can post.{' '}
                <Button
                  variant="ghost"
                  uppercase={false}
                  style={chatTopicActionStyle}
                  onClick={() => setPostingAttempt((value) => value + 1)}
                >
                  Try again
                </Button>
              </p>
            )}
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
              color="red" variant="ghost" uppercase={false}
              style={{ ...chatTopicActionStyle, color: '#b42318' }}>
              <Icon style={{ marginRight: 8 }} icon="trash-alt" />
              Delete Topic
            </Button>
          </div>
        )}
      </div>
      {pickerShown && savedPosting && (
        <TopicPostersModal
          channelId={channelId}
          members={Array.isArray(channelMembers) ? channelMembers : []}
          selected={posters}
          alwaysAllowedIds={pickerAlwaysAllowedIds}
          onHide={handlePickerCancel}
          onDone={(chosen) => {
            setPosters(chosen);
            modeBeforePickerRef.current = null;
            setPickerShown(false);
          }}
        />
      )}
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
              <Button variant="ghost"
                disabled={!!pendingAction} onClick={() => setConfirmModalShown(false)}>
                Cancel
              </Button>
              <Button color="red"
                disabled={!!pendingAction} loading={pendingAction === 'delete'}
                onClick={handleDeleteTopic}>
                Delete Topic
              </Button>
            </>
          }
        >
          <p style={{ margin: 0, color: '#334155', fontSize: 'calc(16 * var(--px))', lineHeight: 1.6 }}>
            {isAIChannel ? 'Are you sure you want to delete this AI topic?' : 'Remove this topic?'}
          </p>
        </Modal>
      )}
    </Modal>
  );

  function handleClose() {
    if (!operationRef.current && !pickerShown) onHide();
  }

  // Topic Brain: a file's words go into the instructions box as a draft;
  // the member reviews them and presses Save like any other edit.
  function handleUseFileAsInstructions(text: string) {
    setIsCustomInstructionsOn(true);
    setNewCustomInstructions(text);
  }

  // Topic Brain: a restored version changed the saved instructions. The
  // server's text becomes what this window and the topic list show.
  function handleInstructionsRestored(instructions: string) {
    setIsCustomInstructionsOn(!!instructions);
    setNewCustomInstructions(instructions);
    onEditTopic({
      topicText: topicText || '',
      isOwnerPostingOnly,
      customInstructions: instructions,
      isSharedWithOtherUsers: savedShareRef.current
    });
  }

  function postingOptions(): Array<{ value: TopicPostingMode; label: string }> {
    return [
      { value: 'everyone', label: 'Everyone' },
      {
        value: 'owner',
        label: 'Only me'
      },
      // a direct chat has nobody else to choose
      ...(isTwoPeopleChat
        ? []
        : [{ value: 'chosen' as const, label: 'Chosen members' }])
    ];
  }

  function handlePostingModeChange(mode: TopicPostingMode) {
    // The chat owner turning someone's open (or own) topic into chosen
    // members: the topic owner starts ticked, never silently dropped.
    const owner = savedPosting;
    if (
      mode === 'chosen' &&
      owner &&
      editorIsChatOwnerOnly &&
      topicOwnerCouldPost &&
      mode !== owner.mode &&
      !posters.some((poster) => poster.id === owner.topicOwnerId)
    ) {
      setPosters((prev) => [
        { id: owner.topicOwnerId, username: owner.topicOwnerName || 'Topic owner' },
        ...prev
      ]);
    }
    if (mode === 'chosen' && !posters.length) {
      // Choosing "Chosen members" with nobody picked opens the picker;
      // cancelling it puts the choice back.
      modeBeforePickerRef.current = postingMode;
      setPickerShown(true);
    }
    setPostingMode(mode);
  }

  function handlePickerCancel() {
    if (modeBeforePickerRef.current) {
      setPostingMode(modeBeforePickerRef.current);
      modeBeforePickerRef.current = null;
    }
    setPickerShown(false);
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
    // Posting fields go only when the saved rule loaded and was changed;
    // otherwise (a label edit, or the rule couldn't load) the server keeps
    // the rule exactly as it is.
    const payload = {
      channelId,
      topicId,
      topicText: editedTopicText,
      ...(postingReady && !postingUnchanged && {
        isOwnerPostingOnly: postingMode === 'owner',
        postingMode,
        ...(postingMode === 'chosen' && {
          posterIds: posters.map((poster) => poster.id)
        })
      }),
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
    // The saved rule, straight from the server's reply (the chat room also
    // gets it by socket).
    if (!isAIChannel) {
      onChangeTopicSettings({
        channelId,
        topicId,
        topicTitle: settings.topicTitle,
        isOwnerPostingOnly: settings.isOwnerPostingOnly,
        postingMode: settings.postingMode,
        postingSetBy: settings.postingSetBy,
        posters: settings.posters
      });
      if (settings.postingMode) {
        const savedPosters: TopicPoster[] = settings.posters || [];
        setSavedPosting((prev) =>
          prev
            ? {
                ...prev,
                mode: settings.postingMode!,
                posters: savedPosters,
                setBy: settings.postingSetBy === 'topic_owner' ? 'topic_owner' : 'chat_owner'
              }
            : prev
        );
      }
    }
    onEditTopic({
      topicText: settings.topicTitle,
      isOwnerPostingOnly: settings.isOwnerPostingOnly,
      ...(isAIChannel && { customInstructions: settings.customInstructions }),
      isSharedWithOtherUsers: savedShareRef.current
    });
  }
}

function posterIdsKey(posters: TopicPoster[]) {
  return posters
    .map((poster) => Number(poster.id))
    .sort((a, b) => a - b)
    .join(',');
}

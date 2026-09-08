import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import AIDisabledNotice from '~/components/AIDisabledNotice';
import ErrorBoundary from '~/components/ErrorBoundary';
import SwitchButton from '~/components/Buttons/SwitchButton';
import Textarea from '~/components/Texts/Textarea';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import DraftSaveIndicator from '~/components/DraftSaveIndicator';
import { exceedsCharLimit, addEmoji } from '~/helpers/stringHelpers';
import { deriveImprovedInstructionsText } from '~/helpers/improveCustomInstructions';
import { useDraft } from '~/helpers/hooks';
import { charLimit } from '~/constants/defaultValues';
import { socket } from '~/constants/sockets/api';
import { useKeyContext, useViewContext } from '~/contexts';
import { chatTopicActionStyle } from '../topicStyles';
import {
  topicSettingsActionsClass,
  topicSettingsHelpClass,
  topicSettingsLabelClass,
  topicSettingsSectionClass,
  topicSettingsSwitchStyle,
  topicSettingsSwitchLabelStyle
} from './styles';

export default function AIChatTopicMenu({
  newCustomInstructions,
  customInstructions,
  isCustomInstructionsOn,
  topicId,
  topicText,
  displayedThemeColor,
  disabled = false,
  onSetCustomInstructions,
  onSetIsCustomInstructionsOn,
  onSetDeleteDraft,
  onBusyChange
}: {
  newCustomInstructions: string;
  customInstructions: string;
  isCustomInstructionsOn: boolean;
  topicId: number;
  topicText: string;
  displayedThemeColor: string;
  disabled?: boolean;
  onSetCustomInstructions: (customInstructions: string) => void;
  onSetIsCustomInstructionsOn: React.Dispatch<React.SetStateAction<boolean>>;
  onSetDeleteDraft?: (deleteFn: () => Promise<void>) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const inputId = useId();
  const AI_FEATURES_DISABLED = useViewContext(
    (v) => v.state.aiFeaturesDisabled
  );
  const userId = useKeyContext((v) => v.myState.userId);
  const [generating, setGenerating] = useState(false);
  const [improving, setImproving] = useState(false);
  const [error, setError] = useState('');
  const [savedDraftContent, setSavedDraftContent] = useState<string | null>(
    null
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const generateRequestIdRef = useRef<string | null>(null);
  const improveRequestIdRef = useRef<string | null>(null);
  const generatedDraftRef = useRef('');
  const improvedDraftRef = useRef('');
  const generateDedupWaitTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const originalInstructionsRef = useRef('');
  const topicTextRef = useRef(topicText);
  const onSetCustomInstructionsRef = useRef(onSetCustomInstructions);
  onSetCustomInstructionsRef.current = onSetCustomInstructions;
  const onBusyChangeRef = useRef(onBusyChange);
  onBusyChangeRef.current = onBusyChange;
  const busy = generating || improving;
  const controlsDisabled = disabled || busy;

  useEffect(() => {
    onBusyChangeRef.current?.(busy);
  }, [busy]);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  const { savingState, saveDraft, deleteDraft, loadDraft } = useDraft({
    contentType: 'customInstructions',
    rootType: 'topic',
    rootId: topicId,
    enabled: !!userId && isCustomInstructionsOn
  });

  const hasDraftToRestore = useMemo(() => {
    if (!savedDraftContent) return false;
    return savedDraftContent.trim() !== newCustomInstructions.trim();
  }, [savedDraftContent, newCustomInstructions]);

  // Expose deleteDraft to parent for cleanup after save
  useEffect(() => {
    if (onSetDeleteDraft) {
      onSetDeleteDraft(deleteDraft);
    }
  }, [deleteDraft, onSetDeleteDraft]);

  useEffect(() => {
    if ((generating || improving) && textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [generating, improving, newCustomInstructions]);

  const commentExceedsCharLimit = useMemo(
    () =>
      exceedsCharLimit({
        contentType: 'comment',
        text: newCustomInstructions
      }),
    [newCustomInstructions]
  );

  useEffect(() => {
    let ignore = false;
    setSavedDraftContent(null);
    if (isCustomInstructionsOn && userId) {
      handleCheckForDraft();
    }
    async function handleCheckForDraft() {
      const draft = await loadDraft();
      if (!ignore && draft?.content) {
        setSavedDraftContent(draft.content);
      }
    }
    return () => { ignore = true; };
  }, [isCustomInstructionsOn, userId, topicId, loadDraft]);

  useEffect(() => {
    if (AI_FEATURES_DISABLED) return;
    if (!customInstructions) {
      handleGenerateCustomInstructions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    topicTextRef.current = topicText;
  }, [topicText]);

  useEffect(() => {
    return () => {
      if (generateDedupWaitTimeoutRef.current) {
        clearTimeout(generateDedupWaitTimeoutRef.current);
      }
      onBusyChangeRef.current?.(false);
    };
  }, []);

  // Socket listeners for generating custom instructions
  useEffect(() => {
    function handleGenerateUpdate({
      requestId,
      content
    }: {
      requestId?: string;
      content?: string;
    }) {
      if (!requestId || requestId !== generateRequestIdRef.current) return;
      if (generateDedupWaitTimeoutRef.current) {
        clearTimeout(generateDedupWaitTimeoutRef.current);
        generateDedupWaitTimeoutRef.current = null;
      }
      generatedDraftRef.current = content || '';
      onSetCustomInstructionsRef.current(generatedDraftRef.current);
    }

    function handleGenerateDelta({
      requestId,
      delta
    }: {
      requestId?: string;
      delta?: string;
    }) {
      if (!requestId || requestId !== generateRequestIdRef.current || !delta) {
        return;
      }
      generatedDraftRef.current += delta;
      onSetCustomInstructionsRef.current(generatedDraftRef.current);
    }

    function handleGenerateComplete({
      requestId,
      content
    }: {
      requestId?: string;
      content?: string;
    }) {
      if (!requestId || requestId !== generateRequestIdRef.current) return;
      if (generateDedupWaitTimeoutRef.current) {
        clearTimeout(generateDedupWaitTimeoutRef.current);
        generateDedupWaitTimeoutRef.current = null;
      }
      generatedDraftRef.current = content || '';
      onSetCustomInstructionsRef.current(generatedDraftRef.current);
      generateRequestIdRef.current = null;
      setGenerating(false);
    }

    function handleGenerateError({
      requestId,
      error: errorMessage,
      transient,
      guardStatus
    }: {
      requestId?: string;
      error?: string;
      transient?: boolean;
      guardStatus?: 'processing' | 'completed' | 'conflict';
    }) {
      if (!requestId || requestId !== generateRequestIdRef.current) return;
      if (transient && guardStatus === 'processing') {
        if (generateDedupWaitTimeoutRef.current) {
          clearTimeout(generateDedupWaitTimeoutRef.current);
        }
        const pendingRequestId = requestId;
        generateDedupWaitTimeoutRef.current = setTimeout(() => {
          if (generateRequestIdRef.current !== pendingRequestId) return;
          generateRequestIdRef.current = null;
          setGenerating(false);
          setError(
            'A duplicate request is still processing. Please retry if no result appears.'
          );
          generateDedupWaitTimeoutRef.current = null;
        }, 15000);
        setError(errorMessage || 'This request is already in progress.');
        return;
      }
      if (generateDedupWaitTimeoutRef.current) {
        clearTimeout(generateDedupWaitTimeoutRef.current);
        generateDedupWaitTimeoutRef.current = null;
      }
      generateRequestIdRef.current = null;
      setGenerating(false);
      setError(
        errorMessage ||
          'Unable to generate custom instructions. Please try again.'
      );
    }

    socket.on('generate_custom_instructions_update', handleGenerateUpdate);
    socket.on('generate_custom_instructions_delta', handleGenerateDelta);
    socket.on('generate_custom_instructions_complete', handleGenerateComplete);
    socket.on('generate_custom_instructions_error', handleGenerateError);

    return () => {
      socket.off('generate_custom_instructions_update', handleGenerateUpdate);
      socket.off('generate_custom_instructions_delta', handleGenerateDelta);
      socket.off(
        'generate_custom_instructions_complete',
        handleGenerateComplete
      );
      socket.off('generate_custom_instructions_error', handleGenerateError);
    };
  }, []);

  // Socket listeners for improving custom instructions
  useEffect(() => {
    function handleImproveUpdate({
      requestId,
      content,
      structuredContent
    }: {
      requestId?: string;
      content?: string;
      structuredContent?: string;
    }) {
      if (!requestId || requestId !== improveRequestIdRef.current) return;
      const formatted = deriveImprovedInstructionsText({
        structuredContent,
        topicText: topicTextRef.current,
        fallbackText: content || ''
      });
      improvedDraftRef.current = formatted;
      onSetCustomInstructionsRef.current(formatted);
    }

    function handleImproveDelta({
      requestId,
      delta
    }: {
      requestId?: string;
      delta?: string;
    }) {
      if (!requestId || requestId !== improveRequestIdRef.current || !delta) {
        return;
      }
      improvedDraftRef.current += delta;
      onSetCustomInstructionsRef.current(improvedDraftRef.current);
    }

    function handleImproveComplete({
      requestId,
      content,
      structuredContent
    }: {
      requestId?: string;
      content?: string;
      structuredContent?: string;
    }) {
      if (!requestId || requestId !== improveRequestIdRef.current) return;
      const formatted = deriveImprovedInstructionsText({
        structuredContent,
        topicText: topicTextRef.current,
        fallbackText: content || originalInstructionsRef.current
      });
      improvedDraftRef.current = formatted;
      onSetCustomInstructionsRef.current(formatted);
      improveRequestIdRef.current = null;
      setImproving(false);
    }

    function handleImproveError({
      requestId,
      error: errorMessage
    }: {
      requestId?: string;
      error?: string;
    }) {
      if (!requestId || requestId !== improveRequestIdRef.current) return;
      onSetCustomInstructionsRef.current(originalInstructionsRef.current);
      improveRequestIdRef.current = null;
      setImproving(false);
      setError(
        errorMessage ||
          'Unable to improve custom instructions. Please try again.'
      );
    }

    socket.on('improve_custom_instructions_update', handleImproveUpdate);
    socket.on('improve_custom_instructions_delta', handleImproveDelta);
    socket.on('improve_custom_instructions_complete', handleImproveComplete);
    socket.on('improve_custom_instructions_error', handleImproveError);

    return () => {
      socket.off('improve_custom_instructions_update', handleImproveUpdate);
      socket.off('improve_custom_instructions_delta', handleImproveDelta);
      socket.off('improve_custom_instructions_complete', handleImproveComplete);
      socket.off('improve_custom_instructions_error', handleImproveError);
    };
  }, []);

  if (AI_FEATURES_DISABLED) {
    return (
      <ErrorBoundary componentPath="Chat/Modals/TopicSettingsModal/AIChatTopicMenu">
        <AIDisabledNotice title="Custom AI Instructions Are Unavailable" />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary componentPath="Chat/Modals/TopicSettingsModal/AIChatMenu">
      <div className={topicSettingsSectionClass}>
        <SwitchButton
          checked={isCustomInstructionsOn}
          disabled={disabled}
          ariaLabel="Custom instructions"
          small={false}
          theme={displayedThemeColor}
          style={topicSettingsSwitchStyle}
          onChange={() =>
            onSetIsCustomInstructionsOn(
              (isCustomInstructionsOn) => !isCustomInstructionsOn
            )
          }
          labelStyle={topicSettingsSwitchLabelStyle}
          label="Custom Instructions"
        />
        {isCustomInstructionsOn && (
          <div className={topicSettingsActionsClass}>
            <Button
              onClick={handleGenerateCustomInstructions}
              color="darkBlue"
              variant="soft"
              tone="raised"
              disabled={controlsDisabled}
              style={chatTopicActionStyle}
            >
              {generating ? (
                <>
                  <Icon
                    style={{ marginRight: '0.5rem' }}
                    icon="spinner"
                    pulse
                  />
                  Generating...
                </>
              ) : (
                <>
                  <Icon style={{ marginRight: '0.5rem' }} icon="redo" />
                  Generate
                </>
              )}
            </Button>
            {newCustomInstructions && (
              <Button
                onClick={handleImproveCustomInstructions}
                color="magenta"
                variant="soft"
                tone="raised"
                disabled={controlsDisabled || !!commentExceedsCharLimit}
                style={chatTopicActionStyle}
              >
                {improving ? (
                  <>
                    <Icon
                      style={{ marginRight: '0.5rem' }}
                      icon="spinner"
                      pulse
                    />
                    Improving...
                  </>
                ) : (
                  <>
                    <Icon
                      style={{ marginRight: '0.5rem' }}
                      icon="wand-magic-sparkles"
                    />
                    Improve
                  </>
                )}
              </Button>
            )}
          </div>
        )}
        {error && (
          <div ref={errorRef} tabIndex={-1} role="alert" className={topicSettingsHelpClass} data-error="true">
            {error}
          </div>
        )}
        {isCustomInstructionsOn && (
          <div style={{ width: '100%', marginTop: 16 }}>
            <label htmlFor={inputId} className={topicSettingsLabelClass}>
              Instructions for this topic
            </label>
            <Textarea
              id={inputId}
              innerRef={textareaRef}
              placeholder="Enter instructions..."
              style={{
                width: '100%',
                position: 'relative',
                minHeight: '5rem'
              }}
              hasError={!!commentExceedsCharLimit || !newCustomInstructions.trim()}
              aria-invalid={!!commentExceedsCharLimit || !newCustomInstructions.trim()}
              aria-describedby={`${inputId}-help`}
              minRows={5}
              maxRows={10}
              value={newCustomInstructions}
              disabled={controlsDisabled}
              disableAutoResize={busy}
              onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => {
                if (controlsDisabled) return;
                const value = event.target.value;
                onSetCustomInstructions(value);
                saveDraft({ content: value });
              }}
              onKeyUp={handleKeyUp}
            />
            <p id={`${inputId}-help`} className={topicSettingsHelpClass}
              data-error={!!commentExceedsCharLimit || !newCustomInstructions.trim()}>
              {commentExceedsCharLimit
                ? `Keep instructions within ${charLimit.comment.toLocaleString()} characters. `
                : !newCustomInstructions.trim() ? 'Add instructions or turn this option off. ' : ''}
              {newCustomInstructions.length.toLocaleString()} / {charLimit.comment.toLocaleString()} characters
            </p>
            <div className={topicSettingsActionsClass} style={{ justifyContent: 'space-between', marginTop: 8 }}>
              {hasDraftToRestore ? (
                <Button
                  color="orange"
                  variant="ghost"
                  onClick={handleRestoreDraft}
                  disabled={controlsDisabled}
                  style={chatTopicActionStyle}
                >
                  <Icon icon="rotate-left" style={{ marginRight: '0.5rem' }} />
                  Restore draft
                </Button>
              ) : (
                <div />
              )}
              <DraftSaveIndicator savingState={savingState} />
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );

  function handleGenerateCustomInstructions() {
    if (AI_FEATURES_DISABLED || disabled || generateRequestIdRef.current || improveRequestIdRef.current) return;
    if (generateDedupWaitTimeoutRef.current) {
      clearTimeout(generateDedupWaitTimeoutRef.current);
      generateDedupWaitTimeoutRef.current = null;
    }
    setError('');
    onBusyChangeRef.current?.(true);
    setGenerating(true);
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    generateRequestIdRef.current = requestId;
    generatedDraftRef.current = '';
    socket.emit('generate_custom_instructions', {
      requestId,
      topicText
    });
  }

  function handleImproveCustomInstructions() {
    if (AI_FEATURES_DISABLED || disabled || commentExceedsCharLimit ||
        generateRequestIdRef.current || improveRequestIdRef.current) return;
    const trimmed = newCustomInstructions.trim();
    if (!trimmed) return;
    setError('');
    onBusyChangeRef.current?.(true);
    originalInstructionsRef.current = newCustomInstructions;
    setImproving(true);
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    improveRequestIdRef.current = requestId;
    improvedDraftRef.current = '';
    socket.emit('improve_custom_instructions', {
      requestId,
      customInstructions: trimmed,
      topicText
    });
  }

  function handleKeyUp(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (controlsDisabled || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return;
    if (event.key === ' ') {
      const value = addEmoji(event.currentTarget.value);
      onSetCustomInstructions(value);
      saveDraft({ content: value });
    }
  }

  function handleRestoreDraft() {
    if (!controlsDisabled && savedDraftContent) {
      onSetCustomInstructions(savedDraftContent);
      saveDraft({ content: savedDraftContent });
      setSavedDraftContent(null);
      textareaRef.current?.focus();
    }
  }
}

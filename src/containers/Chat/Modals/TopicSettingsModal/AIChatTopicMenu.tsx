import React, { useEffect, useMemo, useRef, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import SwitchButton from '~/components/Buttons/SwitchButton';
import Textarea from '~/components/Texts/Textarea';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import DraftSaveIndicator from '~/components/DraftSaveIndicator';
import { exceedsCharLimit, addEmoji } from '~/helpers/stringHelpers';
import { deriveImprovedInstructionsText } from '~/helpers/improveCustomInstructions';
import { useDraft } from '~/helpers/hooks';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { socket } from '~/constants/sockets/api';
import { useKeyContext } from '~/contexts';

export default function AIChatTopicMenu({
  newCustomInstructions,
  customInstructions,
  isCustomInstructionsOn,
  topicId,
  topicText,
  onSetCustomInstructions,
  onSetIsCustomInstructionsOn,
  onSetDeleteDraft
}: {
  newCustomInstructions: string;
  customInstructions: string;
  isCustomInstructionsOn: boolean;
  topicId: number;
  topicText: string;
  onSetCustomInstructions: (customInstructions: string) => void;
  onSetIsCustomInstructionsOn: React.Dispatch<React.SetStateAction<boolean>>;
  onSetDeleteDraft?: (deleteFn: () => Promise<void>) => void;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const [generating, setGenerating] = useState(false);
  const [improving, setImproving] = useState(false);
  const [error, setError] = useState('');
  const [savedDraftContent, setSavedDraftContent] = useState<string | null>(
    null
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const generateRequestIdRef = useRef<string | null>(null);
  const improveRequestIdRef = useRef<string | null>(null);
  const generateDedupWaitTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const originalInstructionsRef = useRef('');
  const topicTextRef = useRef(topicText);

  const { savingState, saveDraft, deleteDraft, loadDraft } = useDraft({
    contentType: 'customInstructions',
    rootType: 'topic',
    rootId: topicId,
    enabled: !!userId && isCustomInstructionsOn
  });

  const hasDraftToRestore = useMemo(() => {
    if (!savedDraftContent) return false;
    // Show restore button if draft differs from current content
    return savedDraftContent.trim() !== newCustomInstructions.trim();
  }, [savedDraftContent, newCustomInstructions]);

  // Expose deleteDraft to parent for cleanup after save
  useEffect(() => {
    if (onSetDeleteDraft) {
      onSetDeleteDraft(deleteDraft);
    }
  }, [deleteDraft, onSetDeleteDraft]);

  // Auto-scroll textarea to bottom during generation/improvement
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
    if (isCustomInstructionsOn && userId) {
      handleCheckForDraft();
    }
    async function handleCheckForDraft() {
      const draft = await loadDraft();
      if (draft?.content) {
        setSavedDraftContent(draft.content);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCustomInstructionsOn, userId]);

  useEffect(() => {
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
      onSetCustomInstructions(content || '');
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
      onSetCustomInstructions(content || '');
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
    socket.on('generate_custom_instructions_complete', handleGenerateComplete);
    socket.on('generate_custom_instructions_error', handleGenerateError);

    return () => {
      socket.off('generate_custom_instructions_update', handleGenerateUpdate);
      socket.off(
        'generate_custom_instructions_complete',
        handleGenerateComplete
      );
      socket.off('generate_custom_instructions_error', handleGenerateError);
    };
  }, [onSetCustomInstructions]);

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
      onSetCustomInstructions(formatted);
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
      onSetCustomInstructions(formatted);
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
      onSetCustomInstructions(originalInstructionsRef.current);
      improveRequestIdRef.current = null;
      setImproving(false);
      setError(
        errorMessage ||
          'Unable to improve custom instructions. Please try again.'
      );
    }

    socket.on('improve_custom_instructions_update', handleImproveUpdate);
    socket.on('improve_custom_instructions_complete', handleImproveComplete);
    socket.on('improve_custom_instructions_error', handleImproveError);

    return () => {
      socket.off('improve_custom_instructions_update', handleImproveUpdate);
      socket.off('improve_custom_instructions_complete', handleImproveComplete);
      socket.off('improve_custom_instructions_error', handleImproveError);
    };
  }, [onSetCustomInstructions, setError]);

  return (
    <ErrorBoundary componentPath="Chat/Modals/TopicSettingsModal/AIChatMenu">
      <div
        className={css`
          margin-top: 0.5rem;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        `}
      >
        <SwitchButton
          checked={isCustomInstructionsOn}
          onChange={() =>
            onSetIsCustomInstructionsOn(
              (isCustomInstructionsOn) => !isCustomInstructionsOn
            )
          }
          labelStyle={{
            fontWeight: 'bold',
            fontSize: '1.3rem',
            color: '#333'
          }}
          label="Custom Instructions"
        />
        {isCustomInstructionsOn && (
          <div
            className={css`
              display: flex;
              margin-top: 2rem;
            `}
          >
            <Button
              onClick={handleGenerateCustomInstructions}
              color="darkBlue"
              variant="soft"
              tone="raised"
              disabled={generating || improving}
              style={{
                fontSize: '1rem',
                padding: '1rem',
                marginRight: '1rem'
              }}
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
                disabled={generating || improving}
                style={{
                  fontSize: '1rem',
                  padding: '1rem'
                }}
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
          <div
            className={css`
              margin-top: 1rem;
              color: ${Color.red()};
              font-size: 1.2rem;
              text-align: center;
            `}
          >
            {error}
          </div>
        )}
        {isCustomInstructionsOn && (
          <div style={{ width: '100%', marginTop: '2rem' }}>
            <Textarea
              innerRef={textareaRef}
              placeholder="Enter instructions..."
              style={{
                width: '100%',
                position: 'relative',
                minHeight: '5rem'
              }}
              hasError={!!commentExceedsCharLimit}
              minRows={3}
              maxRows={10}
              value={newCustomInstructions}
              disabled={generating || improving}
              disableAutoResize={generating || improving}
              onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => {
                const value = event.target.value;
                onSetCustomInstructions(value);
                saveDraft({ content: value });
              }}
              onKeyUp={handleKeyUp}
            />
            <div
              className={css`
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 0.5rem;
              `}
            >
              {hasDraftToRestore ? (
                <Button
                  color="orange"
                  variant="ghost"
                  onClick={handleRestoreDraft}
                  style={{ padding: '0.5rem 1rem', fontSize: '1.1rem' }}
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
    if (generating) return;
    if (generateDedupWaitTimeoutRef.current) {
      clearTimeout(generateDedupWaitTimeoutRef.current);
      generateDedupWaitTimeoutRef.current = null;
    }
    setError('');
    setGenerating(true);
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    generateRequestIdRef.current = requestId;
    socket.emit('generate_custom_instructions', {
      requestId,
      topicText
    });
  }

  function handleImproveCustomInstructions() {
    if (improving) return;
    const trimmed = newCustomInstructions.trim();
    if (!trimmed) return;
    setError('');
    originalInstructionsRef.current = newCustomInstructions;
    setImproving(true);
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    improveRequestIdRef.current = requestId;
    socket.emit('improve_custom_instructions', {
      requestId,
      customInstructions: trimmed,
      topicText
    });
  }

  function handleKeyUp(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === ' ') {
      onSetCustomInstructions(addEmoji(event.currentTarget.value));
    }
  }

  function handleRestoreDraft() {
    if (savedDraftContent) {
      onSetCustomInstructions(savedDraftContent);

      setSavedDraftContent(null);
    }
  }
}

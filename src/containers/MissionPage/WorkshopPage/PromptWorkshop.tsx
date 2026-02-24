import React, { useEffect, useMemo, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { useNavigate } from 'react-router-dom';
import { socket } from '~/constants/sockets/api';
import {
  CIEL_TWINKLE_ID,
  ZERO_TWINKLE_ID,
  CHAT_ID_BASE_NUMBER
} from '~/constants/defaultValues';
import Input from '~/components/Texts/Input';
import Textarea from '~/components/Texts/Textarea';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import RichText from '~/components/Texts/RichText';
import zero from '~/assets/zero.png';
import ciel from '~/assets/ciel.png';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

export default function PromptWorkshop({
  mission,
  onSetMissionState,
  style
}: {
  mission: any;
  onSetMissionState: (params: { missionId: number; newState: any }) => void;
  style?: React.CSSProperties;
}) {
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);
  const myUserState = useKeyContext((v) => v.myState.state);
  const persistedWorkshopSaveTarget = useKeyContext(
    (v) => v.myState.state?.missions?.['system-prompt']?.workshopSaveTarget
  );
  const applySystemPromptToAIChat = useAppContext(
    (v) => v.requestHelpers.applySystemPromptToAIChat
  );
  const updateMissionStatus = useAppContext(
    (v) => v.requestHelpers.updateMissionStatus
  );
  const updateTopicShareState = useAppContext(
    (v) => v.requestHelpers.updateTopicShareState
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onOpenNewChatTab = useChatContext((v) => v.actions.onOpenNewChatTab);
  const onUpdateSelectedChannelId = useChatContext(
    (v) => v.actions.onUpdateSelectedChannelId
  );
  const onSetThinkHardForTopic = useChatContext(
    (v) => v.actions.onSetThinkHardForTopic
  );

  // State from mission context
  const systemPromptState = useMemo(() => {
    return (
      mission?.systemPromptState || {
        title: '',
        prompt: '',
        promptEverGenerated: false
      }
    );
  }, [mission?.systemPromptState]);

  const title = systemPromptState.title || '';
  const prompt = systemPromptState.prompt || '';
  const promptEverGenerated = !!systemPromptState.promptEverGenerated;

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userMessage, setUserMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [improving, setImproving] = useState(false);
  const [saveAction, setSaveAction] = useState<null | 'save' | 'share'>(null);
  const [saveTarget, setSaveTarget] = useState<'zero' | 'ciel'>(
    persistedWorkshopSaveTarget === 'ciel' ? 'ciel' : 'zero'
  );
  const [applyingTarget, setApplyingTarget] = useState<null | 'zero' | 'ciel'>(
    null
  );
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const savedTopicIdsRef = useRef<{
    zero?: { topicId: number };
    ciel?: { topicId: number };
  }>({});

  const messageListRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const requestIdRef = useRef<string>('');
  const generateDedupWaitTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const previewDedupWaitTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const trimmedTitle = title.trim();
  const trimmedPrompt = prompt.trim();
  const hasPrompt = trimmedPrompt.length > 0;
  const canGenerate = trimmedTitle.length > 0 && !generating;
  const canSend = hasPrompt && userMessage.trim().length > 0 && !sending;
  const showPromptSection = hasPrompt || promptEverGenerated || generating;
  const showTitleGenerateButton =
    !showPromptSection || (generating && !hasPrompt);

  // Update mission state helper
  function setSystemPromptState(nextState: {
    title?: string;
    prompt?: string;
    promptEverGenerated?: boolean;
  }) {
    onSetMissionState({
      missionId: mission.id,
      newState: {
        systemPromptState: { ...systemPromptState, ...nextState }
      }
    });
  }

  // Socket listeners for generate_custom_instructions
  useEffect(() => {
    return () => {
      if (generateDedupWaitTimeoutRef.current) {
        clearTimeout(generateDedupWaitTimeoutRef.current);
      }
      if (previewDedupWaitTimeoutRef.current) {
        clearTimeout(previewDedupWaitTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function handleGenerateUpdate({
      requestId,
      content
    }: {
      requestId: string;
      content: string;
    }) {
      if (requestId === requestIdRef.current) {
        if (generateDedupWaitTimeoutRef.current) {
          clearTimeout(generateDedupWaitTimeoutRef.current);
          generateDedupWaitTimeoutRef.current = null;
        }
        setSystemPromptState({ prompt: content });
      }
    }

    function handleGenerateComplete({
      requestId,
      content
    }: {
      requestId: string;
      content: string;
    }) {
      if (requestId === requestIdRef.current) {
        if (generateDedupWaitTimeoutRef.current) {
          clearTimeout(generateDedupWaitTimeoutRef.current);
          generateDedupWaitTimeoutRef.current = null;
        }
        setSystemPromptState({ prompt: content });
        setGenerating(false);
      }
    }

    function handleGenerateError({
      requestId,
      error,
      transient,
      guardStatus
    }: {
      requestId: string;
      error: string;
      transient?: boolean;
      guardStatus?: 'processing' | 'completed' | 'conflict';
    }) {
      if (requestId === requestIdRef.current) {
        if (transient && guardStatus === 'processing') {
          if (generateDedupWaitTimeoutRef.current) {
            clearTimeout(generateDedupWaitTimeoutRef.current);
          }
          const pendingRequestId = requestId;
          generateDedupWaitTimeoutRef.current = setTimeout(() => {
            if (requestIdRef.current !== pendingRequestId) return;
            setError(
              'A duplicate generation request is still processing. Please retry if no result appears.'
            );
            setGenerating(false);
            generateDedupWaitTimeoutRef.current = null;
          }, 15000);
          setError(error || 'This generation request is already in progress.');
          return;
        }
        if (generateDedupWaitTimeoutRef.current) {
          clearTimeout(generateDedupWaitTimeoutRef.current);
          generateDedupWaitTimeoutRef.current = null;
        }
        setError(error || 'Failed to generate prompt');
        setGenerating(false);
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mission.id, systemPromptState]);

  useEffect(() => {
    function handleImproveUpdate({
      requestId,
      content
    }: {
      requestId: string;
      content: string;
    }) {
      if (requestId === requestIdRef.current) {
        setSystemPromptState({ prompt: content });
      }
    }

    function handleImproveComplete({
      requestId,
      content
    }: {
      requestId: string;
      content: string;
    }) {
      if (requestId === requestIdRef.current) {
        setSystemPromptState({ prompt: content });
        setImproving(false);
      }
    }

    function handleImproveError({
      requestId,
      error
    }: {
      requestId: string;
      error: string;
    }) {
      if (requestId === requestIdRef.current) {
        setError(error || 'Failed to improve prompt');
        setImproving(false);
      }
    }

    socket.on('improve_custom_instructions_update', handleImproveUpdate);
    socket.on('improve_custom_instructions_complete', handleImproveComplete);
    socket.on('improve_custom_instructions_error', handleImproveError);

    return () => {
      socket.off('improve_custom_instructions_update', handleImproveUpdate);
      socket.off('improve_custom_instructions_complete', handleImproveComplete);
      socket.off('improve_custom_instructions_error', handleImproveError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mission.id, systemPromptState]);

  // Socket listeners for system_prompt_preview (test chat)
  useEffect(() => {
    function handlePreviewUpdate({
      requestId,
      reply
    }: {
      requestId: string;
      reply: string;
    }) {
      if (requestId === requestIdRef.current) {
        if (previewDedupWaitTimeoutRef.current) {
          clearTimeout(previewDedupWaitTimeoutRef.current);
          previewDedupWaitTimeoutRef.current = null;
        }
        setChatMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return [...prev.slice(0, -1), { ...last, content: reply }];
          }
          return [
            ...prev,
            { id: Date.now(), role: 'assistant', content: reply }
          ];
        });
      }
    }

    function handlePreviewComplete({
      requestId,
      reply
    }: {
      requestId: string;
      reply: string;
    }) {
      if (requestId === requestIdRef.current) {
        if (previewDedupWaitTimeoutRef.current) {
          clearTimeout(previewDedupWaitTimeoutRef.current);
          previewDedupWaitTimeoutRef.current = null;
        }
        setChatMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return [...prev.slice(0, -1), { ...last, content: reply }];
          }
          return [
            ...prev,
            { id: Date.now(), role: 'assistant', content: reply }
          ];
        });
        setSending(false);
      }
    }

    function handlePreviewError({
      requestId,
      error,
      transient,
      guardStatus
    }: {
      requestId: string;
      error: string;
      transient?: boolean;
      guardStatus?: 'processing' | 'completed' | 'conflict';
    }) {
      if (requestId === requestIdRef.current) {
        if (transient && guardStatus === 'processing') {
          if (previewDedupWaitTimeoutRef.current) {
            clearTimeout(previewDedupWaitTimeoutRef.current);
          }
          const pendingRequestId = requestId;
          previewDedupWaitTimeoutRef.current = setTimeout(() => {
            if (requestIdRef.current !== pendingRequestId) return;
            setError(
              'A duplicate preview request is still processing. Please retry if no result appears.'
            );
            setSending(false);
            previewDedupWaitTimeoutRef.current = null;
          }, 15000);
          setError(error || 'This preview request is already in progress.');
          return;
        }
        if (previewDedupWaitTimeoutRef.current) {
          clearTimeout(previewDedupWaitTimeoutRef.current);
          previewDedupWaitTimeoutRef.current = null;
        }
        setError(error || 'Failed to get response');
        setSending(false);
      }
    }

    socket.on('system_prompt_preview_update', handlePreviewUpdate);
    socket.on('system_prompt_preview_complete', handlePreviewComplete);
    socket.on('system_prompt_preview_error', handlePreviewError);

    return () => {
      socket.off('system_prompt_preview_update', handlePreviewUpdate);
      socket.off('system_prompt_preview_complete', handlePreviewComplete);
      socket.off('system_prompt_preview_error', handlePreviewError);
    };
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Auto-scroll textarea during generation
  useEffect(() => {
    if ((generating || improving) && textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [generating, improving, prompt]);

  useEffect(() => {
    if (persistedWorkshopSaveTarget === 'zero') {
      setSaveTarget('zero');
    } else if (persistedWorkshopSaveTarget === 'ciel') {
      setSaveTarget('ciel');
    }
  }, [persistedWorkshopSaveTarget]);

  function handleGeneratePrompt() {
    if (!canGenerate) return;
    if (generateDedupWaitTimeoutRef.current) {
      clearTimeout(generateDedupWaitTimeoutRef.current);
      generateDedupWaitTimeoutRef.current = null;
    }
    setError('');
    setGenerating(true);
    const requestId = `gen_${Date.now()}`;
    requestIdRef.current = requestId;
    setSystemPromptState({ prompt: '', promptEverGenerated: true });
    socket.emit('generate_custom_instructions', {
      requestId,
      topicText: trimmedTitle,
      trackProgress: false
    });
  }

  function handleImprovePrompt() {
    if (!hasPrompt || improving || generating) return;
    setError('');
    setImproving(true);
    const requestId = `imp_${Date.now()}`;
    requestIdRef.current = requestId;
    socket.emit('improve_custom_instructions', {
      requestId,
      topicText: trimmedTitle,
      customInstructions: trimmedPrompt,
      trackProgress: false
    });
  }

  function handleSendMessage() {
    if (!canSend) return;
    if (previewDedupWaitTimeoutRef.current) {
      clearTimeout(previewDedupWaitTimeoutRef.current);
      previewDedupWaitTimeoutRef.current = null;
    }
    setError('');
    setSending(true);
    const requestId = `prev_${Date.now()}`;
    requestIdRef.current = requestId;
    const userMsg: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: userMessage.trim()
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setUserMessage('');
    socket.emit('system_prompt_preview', {
      requestId,
      promptTitle: trimmedTitle,
      systemPrompt: trimmedPrompt,
      messages: [...chatMessages, userMsg].map((m) => ({
        role: m.role,
        content: m.content
      })),
      trackProgress: false
    });
  }

  async function handleSave() {
    await savePromptForSelectedTarget(false);
  }

  async function handleSaveAndShare() {
    await savePromptForSelectedTarget(true);
  }

  const sectionClass = css`
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding: 1rem;
    background: #fff;
    border: 1px solid var(--ui-border);
    border-radius: ${borderRadius};
  `;

  const labelClass = css`
    font-size: 1.2rem;
    font-weight: 700;
    color: ${Color.darkerGray()};
  `;

  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 100%;
        @media (max-width: ${mobileMaxWidth}) {
          padding: 0.5rem;
        }
      `}
      style={style}
    >
      {/* Title Section */}
      <section className={sectionClass}>
        <div className={labelClass}>Title</div>
        <Input
          value={title}
          placeholder="e.g., Grammar buddy"
          maxLength={200}
          onChange={(text: string) => setSystemPromptState({ title: text })}
        />
        {showTitleGenerateButton && (
          <Button
            onClick={handleGeneratePrompt}
            disabled={!canGenerate}
            loading={generating}
            color="darkBlue"
            variant="soft"
            tone="raised"
            style={{ marginTop: '0.5rem', fontSize: '1.1rem' }}
          >
            <Icon
              icon="wand-magic-sparkles"
              style={{ marginRight: '0.5rem' }}
            />
            Generate
          </Button>
        )}
      </section>

      {/* Prompt Section */}
      {showPromptSection && (
        <section className={sectionClass}>
          <div
            className={css`
              display: flex;
              align-items: center;
              justify-content: space-between;
            `}
          >
            <div className={labelClass}>System Prompt</div>
            {hasPrompt ? (
              <Button
                onClick={handleImprovePrompt}
                disabled={improving || generating}
                color="magenta"
                variant="ghost"
                style={{ padding: '0.4rem 0.8rem', fontSize: '1rem' }}
              >
                <Icon
                  icon="wand-magic-sparkles"
                  style={{ marginRight: '0.4rem' }}
                />
                {improving ? 'Improving...' : 'Improve'}
              </Button>
            ) : (
              <Button
                onClick={handleGeneratePrompt}
                disabled={!canGenerate}
                color="darkBlue"
                variant="ghost"
                style={{ padding: '0.4rem 0.8rem', fontSize: '1rem' }}
              >
                {generating ? (
                  <>
                    <Icon
                      icon="spinner"
                      pulse
                      style={{ marginRight: '0.4rem' }}
                    />
                    Generating...
                  </>
                ) : (
                  <>
                    <Icon
                      icon="wand-magic-sparkles"
                      style={{ marginRight: '0.4rem' }}
                    />
                    Generate
                  </>
                )}
              </Button>
            )}
          </div>
          <Textarea
            innerRef={textareaRef}
            minRows={3}
            maxRows={8}
            value={prompt}
            placeholder="Enter your system prompt here or click Generate..."
            disabled={improving || generating}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setSystemPromptState({ prompt: e.target.value })
            }
          />
        </section>
      )}

      {/* Chat Preview */}
      {hasPrompt && (
        <section className={sectionClass}>
          <div
            className={css`
              display: flex;
              align-items: center;
              justify-content: space-between;
            `}
          >
            <div className={labelClass}>Test Chat</div>
            {chatMessages.length > 0 && (
              <Button
                color="rose"
                variant="ghost"
                onClick={() => setChatMessages([])}
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.9rem' }}
              >
                <Icon icon="broom" style={{ marginRight: '0.3rem' }} />
                Clear
              </Button>
            )}
          </div>
          <div
            ref={messageListRef}
            className={css`
              border: 1px solid var(--ui-border);
              border-radius: ${borderRadius};
              background: ${Color.highlightGray(0.5)};
              padding: 0.8rem;
              min-height: 10rem;
              max-height: 20rem;
              overflow-y: auto;
              display: flex;
              flex-direction: column;
              gap: 0.8rem;
            `}
          >
            {chatMessages.length === 0 ? (
              <div
                className={css`
                  text-align: center;
                  color: ${Color.gray()};
                  font-size: 1.1rem;
                  padding: 2rem 1rem;
                `}
              >
                Send a message to test your prompt
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={css`
                    align-self: ${msg.role === 'assistant'
                      ? 'flex-start'
                      : 'flex-end'};
                    background: ${msg.role === 'assistant'
                      ? '#fff'
                      : Color.skyBlue(0.1)};
                    border: 1px solid var(--ui-border);
                    border-radius: ${borderRadius};
                    padding: 0.6rem 0.8rem;
                    max-width: 90%;
                    font-size: 1.2rem;
                  `}
                >
                  <div
                    className={css`
                      font-size: 1rem;
                      font-weight: 700;
                      color: ${Color.gray()};
                      margin-bottom: 0.2rem;
                    `}
                  >
                    {msg.role === 'assistant' ? trimmedTitle || 'Agent' : 'You'}
                  </div>
                  <RichText
                    isAIMessage={msg.role === 'assistant'}
                    contentId={msg.id}
                    contentType="systemPromptPreview"
                    section="workshop"
                    maxLines={100}
                  >
                    {msg.content}
                  </RichText>
                </div>
              ))
            )}
          </div>
          <Textarea
            minRows={1}
            maxRows={3}
            placeholder="Type a message..."
            value={userMessage}
            disabled={sending}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setUserMessage(e.target.value)
            }
          />
          <Button
            color="darkBlue"
            variant="soft"
            tone="raised"
            disabled={!canSend}
            onClick={handleSendMessage}
            style={{ alignSelf: 'flex-end' }}
          >
            {sending ? (
              <>
                <Icon icon="spinner" pulse style={{ marginRight: '0.4rem' }} />
                Sending...
              </>
            ) : (
              <>
                <Icon icon="paper-plane" style={{ marginRight: '0.4rem' }} />
                Send
              </>
            )}
          </Button>
        </section>
      )}

      {/* Save Buttons */}
      {hasPrompt && (
        <section className={sectionClass}>
          <div className={labelClass}>Save Prompt</div>
          <div
            className={css`
              display: flex;
              justify-content: center;
            `}
          >
            <span
              className={css`
                font-size: 1.05rem;
                color: ${Color.gray()};
                font-weight: 700;
              `}
            >
              Save target
            </span>
          </div>
          <div
            className={css`
              display: flex;
              justify-content: center;
            `}
          >
            <div
              role="tablist"
              aria-label="Save target"
              className={css`
                display: inline-flex;
                align-items: center;
                gap: 0.3rem;
                width: min(32rem, 100%);
                padding: 0.35rem;
                border-radius: 999px;
                border: 1px solid var(--ui-border);
                background: ${Color.highlightGray(0.35)};
              `}
            >
              <button
                type="button"
                role="tab"
                aria-selected={saveTarget === 'zero'}
                disabled={Boolean(saveAction) || Boolean(applyingTarget)}
                onClick={() => handleSaveTargetChange('zero')}
                className={css`
                  flex: 1;
                  height: 3.6rem;
                  border-radius: 999px;
                  border: 1px solid
                    ${saveTarget === 'zero' ? Color.logoBlue() : 'transparent'};
                  background: ${saveTarget === 'zero'
                    ? Color.logoBlue()
                    : 'transparent'};
                  color: ${saveTarget === 'zero' ? '#fff' : Color.darkerGray()};
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  gap: 0.55rem;
                  font-size: 1.2rem;
                  font-weight: 700;
                  cursor: pointer;
                  transition: all 0.15s ease;
                  &:disabled {
                    opacity: 0.6;
                    cursor: default;
                  }
                `}
              >
                <img
                  src={zero}
                  alt="Zero"
                  className={css`
                    width: 1.4rem;
                    height: 1.4rem;
                    border-radius: 50%;
                    object-fit: cover;
                  `}
                />
                Zero
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={saveTarget === 'ciel'}
                disabled={Boolean(saveAction) || Boolean(applyingTarget)}
                onClick={() => handleSaveTargetChange('ciel')}
                className={css`
                  flex: 1;
                  height: 3.6rem;
                  border-radius: 999px;
                  border: 1px solid
                    ${saveTarget === 'ciel' ? Color.purple() : 'transparent'};
                  background: ${saveTarget === 'ciel'
                    ? Color.purple()
                    : 'transparent'};
                  color: ${saveTarget === 'ciel' ? '#fff' : Color.darkerGray()};
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  gap: 0.55rem;
                  font-size: 1.2rem;
                  font-weight: 700;
                  cursor: pointer;
                  transition: all 0.15s ease;
                  &:disabled {
                    opacity: 0.6;
                    cursor: default;
                  }
                `}
              >
                <img
                  src={ciel}
                  alt="Ciel"
                  className={css`
                    width: 1.4rem;
                    height: 1.4rem;
                    border-radius: 50%;
                    object-fit: cover;
                  `}
                />
                Ciel
              </button>
            </div>
          </div>
          <div
            className={css`
              display: flex;
              gap: 0.6rem;
              flex-wrap: wrap;
            `}
          >
            <Button
              color="darkBlue"
              variant="solid"
              tone="raised"
              loading={saveAction === 'save'}
              disabled={
                Boolean(saveAction) ||
                Boolean(applyingTarget) ||
                generating ||
                improving
              }
              onClick={handleSave}
              style={{ flex: 1, minWidth: '8rem' }}
            >
              <Icon icon="floppy-disk" style={{ marginRight: '0.5rem' }} />
              Save
            </Button>
            <Button
              color="logoBlue"
              variant="solid"
              tone="raised"
              loading={saveAction === 'share'}
              disabled={
                Boolean(saveAction) ||
                Boolean(applyingTarget) ||
                generating ||
                improving
              }
              onClick={handleSaveAndShare}
              style={{ flex: 1, minWidth: '8rem' }}
            >
              <Icon icon="users" style={{ marginRight: '0.5rem' }} />
              Save and Share
            </Button>
          </div>
        </section>
      )}

      {/* Share with AI Buttons */}
      {hasPrompt && (
        <section className={sectionClass}>
          <div className={labelClass}>Share with AI</div>
          <div
            className={css`
              display: flex;
              gap: 0.6rem;
              flex-wrap: wrap;
            `}
          >
            <Button
              color="logoBlue"
              variant="solid"
              tone="raised"
              loading={applyingTarget === 'zero'}
              disabled={
                Boolean(saveAction) ||
                Boolean(applyingTarget) ||
                generating ||
                improving
              }
              onClick={() => handleShareWithAI('zero')}
              style={{ flex: 1, minWidth: '8rem' }}
            >
              <img
                src={zero}
                alt="Zero"
                className={css`
                  width: 1.8rem;
                  height: 1.8rem;
                  border-radius: 50%;
                  margin-right: 0.5rem;
                  background: #fff;
                `}
              />
              Share with Zero
            </Button>
            <Button
              color="purple"
              variant="solid"
              tone="raised"
              loading={applyingTarget === 'ciel'}
              disabled={
                Boolean(saveAction) ||
                Boolean(applyingTarget) ||
                generating ||
                improving
              }
              onClick={() => handleShareWithAI('ciel')}
              style={{ flex: 1, minWidth: '8rem' }}
            >
              <img
                src={ciel}
                alt="Ciel"
                className={css`
                  width: 1.8rem;
                  height: 1.8rem;
                  border-radius: 50%;
                  margin-right: 0.5rem;
                  background: #fff;
                `}
              />
              Share with Ciel
            </Button>
          </div>
        </section>
      )}

      {statusMessage && (
        <div
          className={css`
            color: ${Color.logoBlue()};
            font-size: 1.1rem;
            padding: 0.5rem;
          `}
        >
          {statusMessage}
        </div>
      )}

      {error && (
        <div
          className={css`
            color: ${Color.red()};
            font-size: 1.1rem;
            padding: 0.5rem;
          `}
        >
          {error}
        </div>
      )}
    </div>
  );

  async function savePromptForSelectedTarget(shareAfterSave: boolean) {
    if (!hasPrompt || saveAction || applyingTarget) return;
    setError('');
    setStatusMessage('');
    setSaveAction(shareAfterSave ? 'share' : 'save');
    const target = saveTarget;

    try {
      const existingTopicId = savedTopicIdsRef.current[target]?.topicId;
      const data = await applySystemPromptToAIChat({
        promptTitle: trimmedTitle,
        systemPrompt: trimmedPrompt,
        target,
        emitRefreshEvent: false,
        ...(existingTopicId ? { topicId: existingTopicId } : {})
      });
      if (!Number(data?.topicId) || !Number(data?.channelId)) {
        throw new Error(`Invalid response while saving to ${target}`);
      }

      savedTopicIdsRef.current[target] = { topicId: Number(data.topicId) };

      if (shareAfterSave) {
        try {
          await updateTopicShareState({
            channelId: Number(data.channelId),
            topicId: Number(data.topicId),
            shareWithOtherUsers: true
          });
          setStatusMessage(`Saved to ${capitalizeTarget(target)} and shared.`);
        } catch (shareError) {
          console.error('Failed to share saved prompt:', shareError);
          setStatusMessage(`Saved to ${capitalizeTarget(target)}.`);
          setError(`Saved, but failed to share with other users.`);
        }
      } else {
        setStatusMessage(`Saved to ${capitalizeTarget(target)}.`);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('twinkle:system-prompt-topic-updated')
        );
      }
    } catch (err) {
      console.error('Failed to save prompt:', err);
      setError(`Failed to save to ${capitalizeTarget(target)}`);
    } finally {
      setSaveAction(null);
    }
  }

  function capitalizeTarget(target: 'zero' | 'ciel') {
    return target === 'zero' ? 'Zero' : 'Ciel';
  }

  async function handleSaveTargetChange(target: 'zero' | 'ciel') {
    if (target === saveTarget) return;
    if (saveAction || applyingTarget) return;
    setSaveTarget(target);
    try {
      await updateMissionStatus({
        missionType: 'system-prompt',
        newStatus: { workshopSaveTarget: target }
      });
      if (userId) {
        onSetUserState({
          userId,
          newState: {
            state: {
              ...(myUserState || {}),
              missions: {
                ...(myUserState?.missions || {}),
                'system-prompt': {
                  ...(myUserState?.missions?.['system-prompt'] || {}),
                  workshopSaveTarget: target
                }
              }
            }
          }
        });
      }
    } catch (err) {
      console.error('Failed to save workshop target preference:', err);
    }
  }

  async function handleShareWithAI(target: 'zero' | 'ciel') {
    if (!hasPrompt || saveAction || applyingTarget || generating || improving) {
      return;
    }
    setError('');
    setStatusMessage('');
    setApplyingTarget(target);
    try {
      const existingTopicId = savedTopicIdsRef.current[target]?.topicId;
      const data = await applySystemPromptToAIChat({
        promptTitle: trimmedTitle,
        systemPrompt: trimmedPrompt,
        target,
        emitRefreshEvent: false,
        ...(existingTopicId ? { topicId: existingTopicId } : {})
      });
      if (!Number(data?.topicId) || !Number(data?.channelId)) {
        throw new Error(`Invalid response while sharing with ${target}`);
      }

      savedTopicIdsRef.current[target] = { topicId: Number(data.topicId) };
      setSaveTarget(target);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('twinkle:system-prompt-topic-updated')
        );
      }

      const recipientId = target === 'zero' ? ZERO_TWINKLE_ID : CIEL_TWINKLE_ID;
      onOpenNewChatTab({
        user: { id: userId },
        recipient: { id: recipientId }
      });
      onUpdateSelectedChannelId(Number(data.channelId));
      onSetThinkHardForTopic({
        topicId: Number(data.topicId),
        thinkHard: target === 'ciel'
      });
      const pathId = Number(data.channelId) + Number(CHAT_ID_BASE_NUMBER);
      navigate(`/chat/${pathId}/topic/${data.topicId}`);
    } catch (err) {
      console.error('Failed to share prompt with AI:', err);
      setError(`Failed to share with ${target === 'zero' ? 'Zero' : 'Ciel'}`);
    } finally {
      setApplyingTarget(null);
    }
  }
}

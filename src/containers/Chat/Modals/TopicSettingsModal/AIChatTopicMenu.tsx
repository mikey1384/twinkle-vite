import React, { useEffect, useMemo, useRef, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import SwitchButton from '~/components/Buttons/SwitchButton';
import Textarea from '~/components/Texts/Textarea';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import { useAppContext } from '~/contexts';
import { exceedsCharLimit, addEmoji } from '~/helpers/stringHelpers';
import { deriveImprovedInstructionsText } from '~/helpers/improveCustomInstructions';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { socket } from '~/constants/sockets/api';

export default function AIChatTopicMenu({
  newCustomInstructions,
  customInstructions,
  isCustomInstructionsOn,
  topicText,
  onSetCustomInstructions,
  onSetIsCustomInstructionsOn
}: {
  newCustomInstructions: string;
  customInstructions: string;
  isCustomInstructionsOn: boolean;
  topicText: string;
  onSetCustomInstructions: (customInstructions: string) => void;
  onSetIsCustomInstructionsOn: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const getCustomInstructionsForTopic = useAppContext(
    (v) => v.requestHelpers.getCustomInstructionsForTopic
  );
  const [loading, setLoading] = useState(false);
  const [improving, setImproving] = useState(false);
  const [error, setError] = useState('');
  const improveRequestIdRef = useRef<string | null>(null);
  const originalInstructionsRef = useRef('');
  const topicTextRef = useRef(topicText);

  const commentExceedsCharLimit = useMemo(
    () =>
      exceedsCharLimit({
        contentType: 'comment',
        text: newCustomInstructions
      }),
    [newCustomInstructions]
  );

  useEffect(() => {
    init();
    async function init() {
      if (!customInstructions) {
        setLoading(true);
        try {
          const generatedCustomInstructions =
            await getCustomInstructionsForTopic(topicText);
          onSetCustomInstructions(generatedCustomInstructions);
        } catch (error) {
          console.error('Failed to load custom instructions:', error);
        } finally {
          setLoading(false);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customInstructions]);

  useEffect(() => {
    topicTextRef.current = topicText;
  }, [topicText]);

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
        errorMessage || 'Unable to improve custom instructions. Please try again.'
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
              onClick={handleLoadCustomInstructions}
              color="darkBlue"
              variant="soft"
              tone="raised"
              disabled={loading || improving}
              style={{
                fontSize: '1rem',
                padding: '1rem',
                marginRight: '1rem'
              }}
            >
              {loading ? (
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
                disabled={loading || improving}
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
        {!loading && isCustomInstructionsOn && (
          <div style={{ width: '100%', marginTop: '2rem' }}>
            <Textarea
              placeholder="Enter instructions..."
              style={{
                width: '100%',
                position: 'relative'
              }}
              hasError={!!commentExceedsCharLimit}
              minRows={3}
              value={newCustomInstructions}
              disabled={loading || improving}
              onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                onSetCustomInstructions(event.target.value)
              }
              onKeyUp={handleKeyUp}
            />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );

  async function handleLoadCustomInstructions() {
    setLoading(true);
    try {
      const generatedCustomInstructions = await getCustomInstructionsForTopic(
        topicText
      );
      onSetCustomInstructions(generatedCustomInstructions);
    } catch (error) {
      console.error('Failed to load custom instructions:', error);
    } finally {
      setLoading(false);
    }
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
}

import React, { useMemo, useRef, useEffect } from 'react';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import Input from '~/components/Texts/Input';
import Textarea from '~/components/Texts/Textarea';
import Button from '~/components/Button';
import Icon from '~/components/Icon';

interface PromptEditorProps {
  title: string;
  prompt: string;
  improving: boolean;
  generating: boolean;
  promptEverGenerated: boolean;
  saving?: boolean;
  compact?: boolean;
  onTitleChange: (text: string) => void;
  onPromptChange: (text: string) => void;
  onImprove: () => void;
  onGenerate: () => void;
  style?: React.CSSProperties;
}

export default function PromptEditor({
  title,
  prompt,
  improving,
  generating,
  promptEverGenerated,
  saving = false,
  compact = false,
  onTitleChange,
  onPromptChange,
  onImprove,
  onGenerate,
  style
}: PromptEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const trimmedTitle = title.trim();
  const trimmedPrompt = prompt.trim();
  const hasPrompt = trimmedPrompt.length > 0;
  const canGenerate = trimmedTitle.length > 0 && !generating;
  const showPromptSection = hasPrompt || promptEverGenerated || generating;
  const showTitleGenerateButton =
    !showPromptSection || (generating && !hasPrompt);

  // Auto-scroll textarea to bottom during generation/improvement
  useEffect(() => {
    if ((generating || improving) && textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [generating, improving, prompt]);

  const cardClass = useMemo(
    () =>
      css`
        width: 100%;
        background: #fff;
        border: 1px solid var(--ui-border);
        border-radius: ${borderRadius};
        padding: ${compact ? '1rem' : '1.4rem 1.6rem'};
        box-shadow: none;
        @media (max-width: ${mobileMaxWidth}) {
          padding: ${compact ? '0.8rem' : '1.2rem'};
        }
      `,
    [compact]
  );

  const labelClass = useMemo(
    () =>
      css`
        font-size: ${compact ? '1.2rem' : '1.45rem'};
        font-weight: 700;
        color: ${Color.darkerGray()};
      `,
    [compact]
  );

  const sectionHeaderClass = useMemo(
    () =>
      css`
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
      `,
    []
  );

  return (
    <>
      <section
        className={`${cardClass} ${css`
          display: flex;
          flex-direction: column;
          gap: ${compact ? '0.6rem' : '0.8rem'};
        `}`}
        style={style}
      >
        <div className={sectionHeaderClass}>
          <div className={labelClass}>
            {compact ? 'Title' : 'System Prompt Title'}
          </div>
          {saving && (
            <small style={{ color: Color.gray(), fontWeight: 'bold' }}>
              Saving...
            </small>
          )}
        </div>
        <Input
          value={title}
          placeholder={
            compact
              ? 'e.g., Grammar buddy'
              : 'e.g., Ciel the encouraging grammar buddy'
          }
          maxLength={200}
          onChange={onTitleChange}
        />
        {!compact && (
          <small
            style={{
              marginTop: '0.5rem',
              color: Color.gray(),
              display: 'block'
            }}
          >
            Give your custom agent a memorable name or theme so you can share it
            later.
          </small>
        )}
        {showTitleGenerateButton && (
          <Button
            onClick={onGenerate}
            disabled={!canGenerate}
            loading={generating}
            color="darkBlue"
            variant="soft"
            tone="raised"
            style={{
              marginTop: compact ? '0.5rem' : '1.5rem',
              padding: compact ? '0.8rem 1.5rem' : '1rem 2rem',
              fontSize: compact ? '1.1rem' : '1.2rem',
              alignSelf: 'flex-start'
            }}
          >
            <Icon style={{ marginRight: '0.5rem' }} icon="wand-magic-sparkles" />
            {compact ? 'Generate' : 'Generate System Prompt'}
          </Button>
        )}
      </section>
      {showPromptSection && (
        <section
          className={`${cardClass} ${css`
            display: flex;
            flex-direction: column;
            gap: ${compact ? '0.6rem' : '0.8rem'};
          `}`}
        >
          <div className={sectionHeaderClass}>
            <div className={labelClass}>System Prompt</div>
            {hasPrompt ? (
              <Button
                onClick={onImprove}
                disabled={improving || generating}
                color="magenta"
                variant={compact ? 'ghost' : 'soft'}
                tone={compact ? undefined : 'raised'}
                style={{
                  padding: compact ? '0.4rem 0.8rem' : '0.7rem 1.3rem',
                  fontSize: '1rem'
                }}
              >
                {improving ? (
                  <>
                    <Icon style={{ marginRight: '0.5rem' }} icon="spinner" pulse />
                    Improving...
                  </>
                ) : (
                  <>
                    <Icon
                      style={{ marginRight: compact ? '0.4rem' : '0.5rem' }}
                      icon="wand-magic-sparkles"
                    />
                    {compact ? 'Improve' : 'Improve Prompt'}
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={onGenerate}
                disabled={!canGenerate}
                color="darkBlue"
                variant={compact ? 'ghost' : 'soft'}
                tone={compact ? undefined : 'raised'}
                style={{
                  padding: compact ? '0.4rem 0.8rem' : '0.7rem 1.3rem',
                  fontSize: '1rem'
                }}
              >
                {generating ? (
                  <>
                    <Icon style={{ marginRight: '0.5rem' }} icon="spinner" pulse />
                    Generating...
                  </>
                ) : (
                  <>
                    <Icon
                      style={{ marginRight: compact ? '0.4rem' : '0.5rem' }}
                      icon="wand-magic-sparkles"
                    />
                    {compact ? 'Generate' : 'Generate System Prompt'}
                  </>
                )}
              </Button>
            )}
          </div>
          <Textarea
            innerRef={textareaRef}
            style={{
              width: '100%',
              minHeight: '5rem'
            }}
            placeholder={
              compact
                ? 'Enter your system prompt here or click Generate...'
                : 'e.g., You are Ciel, a helpful grammar coach. Correct the user\'s mistakes gently and provide examples. Keep your tone encouraging.'
            }
            minRows={compact ? 3 : 5}
            maxRows={compact ? 8 : 10}
            disabled={improving || generating}
            disableAutoResize={generating || improving}
            value={prompt}
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
              onPromptChange(event.target.value)
            }
          />
        </section>
      )}
    </>
  );
}

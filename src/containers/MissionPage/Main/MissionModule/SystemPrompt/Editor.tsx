import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import Input from '~/components/Texts/Input';
import Textarea from '~/components/Texts/Textarea';
import Button from '~/components/Button';
import Icon from '~/components/Icon';

interface EditorProps {
  title: string;
  prompt: string;
  improving: boolean;
  hasPrompt: boolean;
  onTitleChange: (text: string) => void;
  onPromptChange: (text: string) => void;
  onImprovePrompt: () => void;
  style?: React.CSSProperties;
}

export default function Editor({
  title,
  prompt,
  improving,
  hasPrompt,
  onTitleChange,
  onPromptChange,
  onImprovePrompt,
  style
}: EditorProps) {
  const cardClass = useMemo(
    () =>
      css`
        width: 100%;
        background: #fff;
        border: 1px solid var(--ui-border);
        border-radius: ${borderRadius};
        padding: 1.4rem 1.6rem;
        box-shadow: none;
        @media (max-width: ${mobileMaxWidth}) {
          padding: 1.2rem;
        }
      `,
    []
  );

  const labelClass = useMemo(
    () =>
      css`
        font-size: 1.45rem;
        font-weight: 700;
        color: ${Color.darkerGray()};
      `,
    []
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
          gap: 0.8rem;
        `}`}
        style={style}
      >
        <div className={labelClass}>System Prompt Title</div>
        <Input
          value={title}
          placeholder="e.g., Ciel the encouraging grammar buddy"
          maxLength={200}
          onChange={onTitleChange}
        />
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
      </section>
      <section
        className={`${cardClass} ${css`
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        `}`}
      >
        <div className={sectionHeaderClass}>
          <div className={labelClass}>System Prompt</div>
          <Button
            onClick={onImprovePrompt}
            disabled={!hasPrompt || improving}
            color="magenta"
            variant="soft"
            tone="raised"
            style={{ padding: '0.7rem 1.3rem', fontSize: '1rem' }}
          >
            {improving ? (
              <>
                <Icon style={{ marginRight: '0.5rem' }} icon="spinner" pulse />
                Improving...
              </>
            ) : (
              <>
                <Icon
                  style={{ marginRight: '0.5rem' }}
                  icon="wand-magic-sparkles"
                />
                Improve Prompt
              </>
            )}
          </Button>
        </div>
        <Textarea
          style={{ width: '100%' }}
          placeholder={`Describe the agent's personality, boundaries, and priorities.\nInclude how Zero or Ciel should speak, what to avoid, and what success looks like.`}
          minRows={5}
          maxRows={16}
          disabled={improving}
          value={prompt}
          onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
            onPromptChange(event.target.value)
          }
        />
      </section>
    </>
  );
}

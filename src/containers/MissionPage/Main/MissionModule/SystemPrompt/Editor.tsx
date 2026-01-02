import React, { useRef, useEffect } from 'react';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import Input from '~/components/Texts/Input';
import Textarea from '~/components/Texts/Textarea';
import Button from '~/components/Button';
import Icon from '~/components/Icon';

const cardClass = css`
  width: 100%;
  background: #fff;
  border: 1px solid var(--ui-border);
  border-radius: ${borderRadius};
  padding: 1.4rem 1.6rem;
  box-shadow: none;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1.2rem;
  }
`;

const labelClass = css`
  font-size: 1.45rem;
  font-weight: 700;
  color: ${Color.darkerGray()};
`;

const sectionHeaderClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`;

interface EditorProps {
  title: string;
  prompt: string;
  improving: boolean;
  generating: boolean;
  hasPrompt: boolean;
  promptEverGenerated: boolean;
  missionCleared?: boolean;
  saving?: boolean;
  onTitleChange: (text: string) => void;
  onPromptChange: (text: string) => void;
  onImprovePrompt: () => void;
  onGeneratePrompt: () => void;
  style?: React.CSSProperties;
}

export default function Editor({
  title,
  prompt,
  improving,
  generating,
  hasPrompt,
  promptEverGenerated,
  missionCleared = false,
  saving = false,
  onTitleChange,
  onPromptChange,
  onImprovePrompt,
  onGeneratePrompt,
  style
}: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const trimmedTitle = title.trim();
  const canGenerate = trimmedTitle.length > 0 && !generating;
  const showPromptSection = hasPrompt || promptEverGenerated;

  const showTitleGenerateButton =
    !showPromptSection || (generating && !hasPrompt);

  useEffect(() => {
    if ((generating || improving) && textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [generating, improving, prompt]);

  return (
    <>
      {!missionCleared && (
        <section
          className={`${cardClass} ${css`
            display: flex;
            flex-direction: column;
            gap: 0.8rem;
          `}`}
          style={style}
        >
          <div className={sectionHeaderClass}>
            <div className={labelClass}>System Prompt Title</div>
            {saving && (
              <small style={{ color: Color.gray(), fontWeight: 'bold' }}>
                Saving...
              </small>
            )}
          </div>
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
          {showTitleGenerateButton && (
            <Button
              onClick={onGeneratePrompt}
              disabled={!canGenerate}
              loading={generating}
              color="darkBlue"
              variant="soft"
              tone="raised"
              style={{
                marginTop: '1.5rem',
                padding: '1rem 2rem',
                fontSize: '1.2rem',
                alignSelf: 'flex-start'
              }}
            >
              <Icon
                style={{ marginRight: '0.5rem' }}
                icon="wand-magic-sparkles"
              />
              Generate System Prompt
            </Button>
          )}
        </section>
      )}
      {showPromptSection && (
        <section
          className={`${cardClass} ${css`
            display: flex;
            flex-direction: column;
            gap: 0.8rem;
          `}`}
        >
          <div className={sectionHeaderClass}>
            <div className={labelClass}>System Prompt</div>
            {hasPrompt ? (
              <Button
                onClick={onImprovePrompt}
                disabled={improving || generating}
                color="magenta"
                variant="soft"
                tone="raised"
                style={{ padding: '0.7rem 1.3rem', fontSize: '1rem' }}
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
                    Improve Prompt
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={onGeneratePrompt}
                disabled={!canGenerate}
                color="darkBlue"
                variant="soft"
                tone="raised"
                style={{ padding: '0.7rem 1.3rem', fontSize: '1rem' }}
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
                    <Icon
                      style={{ marginRight: '0.5rem' }}
                      icon="wand-magic-sparkles"
                    />
                    Generate System Prompt
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
            placeholder="e.g., You are Ciel, a helpful grammar coach. Correct the user's mistakes gently and provide examples. Keep your tone encouraging."
            minRows={5}
            maxRows={10}
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

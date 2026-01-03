import React, { useEffect, useMemo, useState, useRef } from 'react';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import { css } from '@emotion/css';
import { isMobile } from '~/helpers';
import {
  stringIsEmpty,
  exceedsCharLimit,
  truncateText
} from '~/helpers/stringHelpers';
import { useChatContext, useInputContext } from '~/contexts';
import { VOCAB_CHAT_TYPE } from '~/constants/defaultValues';
import { useRoleColor } from '~/theme/useRoleColor';
import { Color, mobileMaxWidth } from '~/constants/css';

const deviceIsMobile = isMobile(navigator);
const typeWordLabel = 'Type a word...';

export default function Input({
  innerRef,
  loading,
  onInput,
  onSubmit,
  registerButtonShown,
  isSubmitting
}: {
  innerRef: React.RefObject<any>;
  loading?: boolean;
  onInput: () => void;
  onSubmit: (text: string) => void;
  registerButtonShown: boolean;
  isSubmitting: boolean;
}) {
  const text = useInputContext((v) => v.state[VOCAB_CHAT_TYPE]?.text || '');
  const onEnterComment = useInputContext((v) => v.actions.onEnterComment);
  const onSetVocabErrorMessage = useChatContext(
    (v) => v.actions.onSetVocabErrorMessage
  );
  const searchRole = useRoleColor('search', { fallback: 'logoBlue' });
  const successRole = useRoleColor('success', { fallback: 'green' });
  const alertRole = useRoleColor('alert', { fallback: 'gold' });
  const successColorKey = successRole.colorKey;
  const alertColorKey = alertRole.colorKey;
  const themeIsGreen = successRole.themeName === 'green';
  const sendButtonColorKey = themeIsGreen ? alertColorKey : successColorKey;
  const [localText, setLocalText] = useState('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accentColor = registerButtonShown
    ? successRole.getColor()
    : searchRole.getColor();
  const accentSoft = registerButtonShown
    ? successRole.getColor(0.18)
    : searchRole.getColor(0.18);
  const accentBorder = registerButtonShown
    ? successRole.getColor(0.35)
    : searchRole.getColor(0.3);
  const accentStyles = {
    '--wm-accent': accentColor,
    '--wm-accent-soft': accentSoft,
    '--wm-accent-border': accentBorder
  } as React.CSSProperties;

  useEffect(() => {
    setLocalText(text);
  }, [text]);

  useEffect(() => {
    if (!deviceIsMobile && innerRef.current) {
      innerRef.current?.focus();
    }
  }, [innerRef]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const messageExceedsCharLimit = useMemo(
    () =>
      exceedsCharLimit({
        inputType: 'message',
        contentType: 'chat',
        text: localText
      }),
    [localText]
  );

  return (
    <div
      className={css`
        display: flex;
        justify-content: center;
        width: 100%;
      `}
    >
      <div
        className={css`
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          background: ${Color.white()};
          border: 2px solid var(--wm-accent-border);
          border-radius: 999px;
          padding: 0.5rem 0.75rem;
          width: 100%;
          max-width: 560px;
          overflow: hidden;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;

          &:focus-within {
            border-color: var(--wm-accent);
            box-shadow: 0 0 0 3px var(--wm-accent-soft);
          }

          @media (max-width: ${mobileMaxWidth}) {
            max-width: 100%;
            padding: 0.4rem 0.6rem;
          }
        `}
        style={accentStyles}
      >
        <div
          className={css`
            width: 32px;
            height: 32px;
            border-radius: 999px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--wm-accent);
            flex-shrink: 0;

            @media (max-width: ${mobileMaxWidth}) {
              width: 28px;
              height: 28px;
            }
          `}
        >
          <Icon
            icon="search"
            className={css`
              color: ${Color.white()};
              font-size: 1rem;

              @media (max-width: ${mobileMaxWidth}) {
                font-size: 0.9rem;
              }
            `}
          />
        </div>
        <input
          ref={innerRef}
          type="text"
          placeholder={typeWordLabel}
          onKeyDown={handleKeyDown}
          value={localText}
          onChange={handleChange}
          className={css`
            flex: 1;
            border: none;
            background: transparent;
            font-size: 1.4rem;
            font-weight: 600;
            color: ${Color.darkerGray()};
            outline: none;
            min-width: 0;
            letter-spacing: 0.01em;
            caret-color: var(--wm-accent);
            line-height: 1;
            height: 32px;
            padding: 0;

            &::placeholder {
              color: ${Color.gray()};
              font-weight: 500;
            }

            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.2rem;
              height: 28px;
            }
          `}
        />
        {registerButtonShown && (
          <Button
            variant="solid"
            shape="pill"
            size="sm"
            disabled={loading || isSubmitting || !!messageExceedsCharLimit}
            color={sendButtonColorKey}
            onClick={handleSubmit}
            className={css`
              border-radius: 50%;
              padding: 0;
              min-width: 32px;
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;

              @media (max-width: ${mobileMaxWidth}) {
                min-width: 28px;
                width: 28px;
                height: 28px;
              }
            `}
          >
            <Icon icon="arrow-up" />
          </Button>
        )}
      </div>
    </div>
  );

  function handleChange(event: any) {
    const newText = event.target.value;
    const regex = /[^a-zA-Z\-'\s]/gi;
    const isInvalid = regex.test(newText.trim());
    if (isInvalid) {
      onSetVocabErrorMessage(
        `"${truncateText({
          text: newText,
          limit: 20
        })}" contains invalid characters. Only letters, hyphens, and apostrophes are allowed.`
      );
      return;
    }
    onInput();
    onSetVocabErrorMessage('');
    setLocalText(newText);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (newText.trim() === '') {
      onEnterComment({
        contentType: VOCAB_CHAT_TYPE,
        text: newText
      });
    } else {
      timeoutRef.current = setTimeout(() => {
        onEnterComment({
          contentType: VOCAB_CHAT_TYPE,
          text: newText
        });
      }, 500);
    }
  }

  function handleKeyDown(event: any) {
    const enterKeyPressed = event.keyCode === 13;
    if (enterKeyPressed && !messageExceedsCharLimit && !loading) {
      event.preventDefault();
      handleSubmit();
    }
  }

  function handleSubmit() {
    if (messageExceedsCharLimit) return;
    innerRef.current?.focus();
    if (stringIsEmpty(localText)) return;
    onSubmit(localText);
  }
}

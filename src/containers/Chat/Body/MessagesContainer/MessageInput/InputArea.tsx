import React, { useEffect, useMemo, useRef } from 'react';
import Textarea from '~/components/Texts/Textarea';
import { addEmoji, stringIsEmpty } from '~/helpers/stringHelpers';
import { isMobile } from '~/helpers';
import { chatComposerInputClass } from '../../../containers';
import { css } from '@emotion/css';
import { Color, borderRadius } from '~/constants/css';

const lengthErrorClass = css`
  position: absolute;
  left: 0;
  right: 1rem;
  bottom: calc(100% + 0.5rem);
  z-index: 2;
  padding: 0.6rem 1rem;
  border: 1px solid ${Color.red()};
  border-radius: ${borderRadius};
  background: #fff;
  color: ${Color.red()};
  font-size: 1.3rem;
  font-weight: bold;
  line-height: 1.4;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
`;

// "Only twosteps, Lucy and 3 others can post in this topic": a quiet line in
// place of the message box. It wraps, so long names are never cut off.
const topicNoticeClass = css`
  flex-grow: 1;
  min-width: 0;
  min-height: 4.3rem;
  margin: 0;
  padding: 0.6rem 1.2rem;
  display: flex;
  align-items: center;
  color: var(--chat-muted-text, #64748b);
  font-size: 1.5rem;
  line-height: 1.45;
  overflow-wrap: anywhere;
`;

const enterMessageLabel = 'Enter a message';
const deviceIsMobileOS = isMobile(navigator);

export default function InputArea({
  forcedDisabled = false,
  forcedPlaceholder,
  idlePlaceholder,
  isBanned,
  isRestrictedChannel,
  innerRef,
  inputText,
  topicPostingNotice,
  topicPostingChecking = false,
  isOwnerPostingOnly,
  isOwner,
  loading,
  isMain,
  onSendMsg,
  onHeightChange,
  onSetText,
  lengthError = null,
  lengthNotice = lengthError
}: {
  forcedDisabled?: boolean;
  forcedPlaceholder?: string;
  // what an empty, open box says (default: "Enter a message...")
  idlePlaceholder?: string;
  isBanned: boolean;
  isRestrictedChannel: boolean;
  // who can post in this topic, when you can't ('' when you can)
  topicPostingNotice: string;
  // the topic's rule is still loading: never clear what was typed
  topicPostingChecking?: boolean;
  isOwnerPostingOnly: boolean;
  isOwner: boolean;
  isMain: boolean;
  innerRef: any;
  inputText: string;
  loading: boolean;
  onSendMsg: () => any;
  onHeightChange: (v: number) => any;
  onSetText: (v: string) => any;
  lengthError?: string | null;
  // What the inline error shows; may also cover text sent from outside the box.
  lengthNotice?: string | null;
}) {
  const lastHeightRef = useRef(0);
  const onHeightChangeRef = useRef(onHeightChange);
  const noticeRef = useRef<HTMLParagraphElement>(null);
  const noticeShown = !!topicPostingNotice && !isMain;

  // Keep callback ref up to date without triggering effect re-runs
  useEffect(() => {
    onHeightChangeRef.current = onHeightChange;
  }, [onHeightChange]);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    let ro: ResizeObserver | null = null;

    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver((entries) => {
        const entry = entries[entries.length - 1];
        const newHeight = Math.round(entry.contentRect.height);
        if (newHeight !== lastHeightRef.current) {
          lastHeightRef.current = newHeight;
          // hidden behind the topic notice: the notice reports its own height
          if (newHeight) onHeightChangeRef.current(el.clientHeight);
        }
      });
      ro.observe(el);
    }

    onHeightChangeRef.current(el.clientHeight);

    return () => {
      ro?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // While the topic notice replaces the box, the composer is sized by it.
  useEffect(() => {
    const el = noticeRef.current;
    if (!noticeShown || !el) return;
    const report = () => onHeightChangeRef.current(el.clientHeight);
    report();
    const ro =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(report) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [noticeShown]);

  // The parent owns the length rule (characters and UTF-8 bytes) so the
  // send button, Enter and the inline message agree.
  const isExceedingCharLimit = !!lengthError;

  const inputDisabled = useMemo(() => {
    if (forcedDisabled) return true;
    if (isRestrictedChannel || isBanned) return true;
    if (noticeShown) return true;
    if (isOwnerPostingOnly && isMain && !isOwner) {
      return true;
    }
    return false;
  }, [
    forcedDisabled,
    isRestrictedChannel,
    isBanned,
    noticeShown,
    isOwnerPostingOnly,
    isMain,
    isOwner
  ]);

  useEffect(() => {
    // While the topic's rule is still loading the box only waits: what was
    // typed stays.
    if (inputDisabled && !topicPostingChecking) {
      onSetText('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputDisabled, topicPostingChecking]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Textarea
        aria-label="Message"
        className={chatComposerInputClass}
        disabled={inputDisabled}
        innerRef={innerRef}
        minRows={1}
        placeholder={getPlaceholder()}
        onKeyDown={handleKeyDown}
        value={inputText}
        onChange={handleChange}
        onKeyUp={handleKeyUp}
        onDrop={handleDrop}
        hasError={isExceedingCharLimit}
        aria-invalid={isExceedingCharLimit || undefined}
        aria-describedby={
          isExceedingCharLimit ? 'chat-message-length-error' : undefined
        }
        style={{
          width: 'auto',
          flexGrow: 1,
          ...(noticeShown ? { display: 'none' } : {}),
          marginRight:
            noticeShown || (isOwnerPostingOnly && !isOwner && isMain)
              ? 0
              : '1rem'
        }}
      />
      {noticeShown && (
        <p ref={noticeRef} role="status" className={topicNoticeClass}>
          {topicPostingNotice}
        </p>
      )}
      {lengthNotice && (
        // Above the box, over the message list: the composer's height is a
        // fixed budget in MessagesContainer, so a row below would be clipped.
        <div id="chat-message-length-error" role="alert" className={lengthErrorClass}>
          {lengthNotice}
        </div>
      )}
    </div>
  );

  function getPlaceholder() {
    if (forcedDisabled && forcedPlaceholder) {
      return forcedPlaceholder;
    }
    if (isBanned) {
      return 'You are banned from chatting with other users on this website...';
    }
    if (isRestrictedChannel) {
      return 'Only the administrator can post messages here...';
    }
    if (noticeShown) {
      return topicPostingNotice;
    }
    if (isOwnerPostingOnly && isMain && !isOwner) {
      return 'Only the owner can post messages on the main chat...';
    }
    return idlePlaceholder || `${enterMessageLabel}...`;
  }

  function handleKeyDown(event: any) {
    // Enter confirms IME text; it must not send the unfinished message.
    // keyCode 229 also covers composition events without isComposing.
    if (event.nativeEvent?.isComposing || event.keyCode === 229) return;
    const shiftKeyPressed = event.shiftKey;
    const enterKeyPressed = event.keyCode === 13;
    if (isExceedingCharLimit) return;
    if (
      enterKeyPressed &&
      !deviceIsMobileOS &&
      !shiftKeyPressed &&
      !isExceedingCharLimit &&
      !loading
    ) {
      event.preventDefault();
      onSendMsg();
    }
  }

  function handleChange(event: any) {
    onSetText(event.target.value);
  }

  function handleKeyUp(event: any) {
    if (event.nativeEvent?.isComposing || event.keyCode === 229) return;
    if (event.key === ' ') {
      const text: string = event.target.value || '';
      if (deviceIsMobileOS && text.length > 20000) return;
      onSetText(addEmoji(text));
    }
  }

  function handleDrop(url: any) {
    const newText = stringIsEmpty(inputText)
      ? `![](${url})`
      : `${inputText}\n![](${url})`;
    onSetText(newText);
  }
}

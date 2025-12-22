import React, { useEffect, useMemo, useRef } from 'react';
import Textarea from '~/components/Texts/Textarea';
import {
  addEmoji,
  exceedsCharLimit,
  stringIsEmpty
} from '~/helpers/stringHelpers';
import { isMobile } from '~/helpers';
import { useKeyContext } from '~/contexts';

const enterMessageLabel = 'Enter a message';
const deviceIsMobileOS = isMobile(navigator);

export default function InputArea({
  currentTopic,
  isBanned,
  isRestrictedChannel,
  innerRef,
  inputText,
  isOnlyOwnerPostingTopic,
  isOwnerPostingOnly,
  isTwoPeopleChannel,
  isOwner,
  loading,
  isMain,
  partner,
  handleSendMsg,
  onHeightChange,
  onSetText
}: {
  currentTopic: any;
  isBanned: boolean;
  isRestrictedChannel: boolean;
  isOnlyOwnerPostingTopic: boolean;
  isOwnerPostingOnly: boolean;
  isTwoPeopleChannel: boolean;
  isOwner: boolean;
  isMain: boolean;
  innerRef: any;
  inputText: string;
  loading: boolean;
  partner?: {
    id: number;
    username: string;
  };
  handleSendMsg: () => any;
  onHeightChange: (v: number) => any;
  onSetText: (v: string) => any;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const lastHeightRef = useRef(0);

  // Use ResizeObserver to detect when textarea actually changes size
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
          onHeightChange(el.clientHeight);
        }
      });
      ro.observe(el);
    }

    // Initial height report
    onHeightChange(el.clientHeight);

    return () => {
      ro?.disconnect();
    };
  }, [onHeightChange, innerRef]);

  const isExceedingCharLimit = useMemo(() => {
    return !!exceedsCharLimit({
      inputType: 'message',
      contentType: 'chat',
      text: inputText
    });
  }, [inputText]);

  const inputDisabled = useMemo(() => {
    if (isRestrictedChannel || isBanned) return true;
    if (isOnlyOwnerPostingTopic && !isMain) {
      if (isTwoPeopleChannel && currentTopic?.userId !== userId) {
        return true;
      }
      return !isTwoPeopleChannel && !isOwner;
    }
    if (isOwnerPostingOnly && isMain && !isOwner) {
      return true;
    }
    return false;
  }, [
    isRestrictedChannel,
    isBanned,
    isOnlyOwnerPostingTopic,
    isOwnerPostingOnly,
    isMain,
    isTwoPeopleChannel,
    currentTopic?.userId,
    userId,
    isOwner
  ]);

  useEffect(() => {
    if (inputDisabled) {
      onSetText('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputDisabled]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Textarea
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
        style={{
          width: 'auto',
          flexGrow: 1,
          marginRight:
            (isOnlyOwnerPostingTopic && !isOwner && !isMain) ||
            (isOwnerPostingOnly && !isOwner && isMain)
              ? 0
              : '1rem'
        }}
      />
    </div>
  );

  function getPlaceholder() {
    if (isBanned) {
      return 'You are banned from chatting with other users on this website...';
    }
    if (isRestrictedChannel) {
      return 'Only the administrator can post messages here...';
    }
    if (isOnlyOwnerPostingTopic && !isMain) {
      if (isTwoPeopleChannel) {
        if (currentTopic.userId !== userId) {
          return `Only ${partner?.username} can post messages on this topic...`;
        }
      } else if (!isOwner) {
        return 'Only the owner can post messages on this topic...';
      }
    }
    if (isOwnerPostingOnly && isMain && !isOwner) {
      return 'Only the owner can post messages on the main chat...';
    }
    return `${enterMessageLabel}...`;
  }

  function handleKeyDown(event: any) {
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
      handleSendMsg();
    }
  }

  function handleChange(event: any) {
    // ResizeObserver handles height updates automatically
    onSetText(event.target.value);
  }

  function handleKeyUp(event: any) {
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
    // ResizeObserver handles height updates automatically
    onSetText(newText);
  }
}

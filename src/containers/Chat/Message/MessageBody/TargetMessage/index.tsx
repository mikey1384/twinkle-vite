import React from 'react';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import TextMessage from './TextMessage';
import WordleResult from './WordleResult';
import useJumpToQuotedMessage from './useJumpToQuotedMessage';
import { getReplyTargetEntry } from '../replyTargetSummary';

// Buttons, links, names and media inside a quote keep their own clicks.
const OWN_CLICK_SELECTOR =
  'a, button, input, textarea, select, img, video, audio, [role="button"], [role="menuitem"], [data-feed-card-interactive], [data-quote-own-click]';

export default function TargetMessage({
  message,
  displayedThemeColor
}: {
  message: any;
  displayedThemeColor: string;
}) {
  const jumpToQuotedMessage = useJumpToQuotedMessage();
  const messageId = Number(message?.id || 0);

  return (
    <div
      data-quoted-message-id={messageId || undefined}
      role={messageId ? 'link' : undefined}
      tabIndex={messageId ? 0 : undefined}
      aria-label={messageId ? 'Show the quoted message' : undefined}
      onClick={(event) => {
        const target = event.target as HTMLElement | null;
        // Clicks inside a modal the quote opened bubble here through the
        // React portal; they are not taps on the quote.
        if (!target || !event.currentTarget.contains(target)) return;
        if (target.closest(OWN_CLICK_SELECTOR)) return;
        jumpToQuotedMessage(messageId);
      }}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        jumpToQuotedMessage(messageId);
      }}
      className={css`
        width: 85%;
        cursor: ${messageId ? 'pointer' : 'default'};
        @media (max-width: ${mobileMaxWidth}) {
          width: 100%;
        }
      `}
    >
      {getReplyTargetEntry(message) === 'wordle' ? (
        <WordleResult
          username={message.username}
          userId={message.userId}
          timeStamp={message.timeStamp}
          wordleResult={message.wordleResult}
        />
      ) : (
        <TextMessage
          displayedThemeColor={displayedThemeColor}
          message={message}
        />
      )}
    </div>
  );
}

// A reply whose quoted message was deleted (or is otherwise gone from this
// chat) says so, without any of what it used to say.
export function RemovedTargetMessage() {
  return (
    <div
      className={css`
        width: 85%;
        margin: 0.5rem 0 1rem;
        padding: 1rem;
        border: 1px dashed ${Color.lightGray()};
        border-radius: ${borderRadius};
        color: ${Color.darkGray()};
        font-size: 1.2rem;
        font-style: italic;
        @media (max-width: ${mobileMaxWidth}) {
          width: 100%;
        }
      `}
    >
      The quoted message was removed.
    </div>
  );
}

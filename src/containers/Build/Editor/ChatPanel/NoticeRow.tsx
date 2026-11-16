import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import RichText from '~/components/Texts/RichText';
import { Color } from '~/constants/css';

// A status line the server wrote into the Build chat (build_chat_messages
// kind 'notice'): an Energy stop, the daily team-forum notice, a build-plan
// button's outcome, a reply that could not be written. It is the site
// talking, not Lumine, so it is not drawn as Lumine's bubble: a full-width
// row in the same family as the chat's "Last run failed" notice, in a
// neutral blue instead of the failure rose.
export default function NoticeRow({ content }: { content: string }) {
  return (
    <div
      role="note"
      aria-label="Notice"
      className={css`
        box-sizing: border-box;
        width: 100%;
        min-width: 0;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        align-items: start;
        gap: 0.55rem;
        padding: 0.6rem 0.75rem;
        border-radius: 10px;
        border: 1px solid ${Color.logoBlue(0.28)};
        background: ${Color.logoBlue(0.07)};
        color: var(--chat-text);
        font-size: var(--build-workshop-body-font-size);
        line-height: 1.45;
        overflow-wrap: anywhere;
        word-break: break-word;
      `}
    >
      <Icon
        icon="info-circle"
        aria-hidden="true"
        className={css`
          margin-top: 0.2rem;
          color: ${Color.logoBlue()};
        `}
      />
      <div
        className={css`
          min-width: 0;
        `}
      >
        <RichText maxLines={12} readMoreColor={Color.logoBlue()}>
          {content}
        </RichText>
      </div>
    </div>
  );
}

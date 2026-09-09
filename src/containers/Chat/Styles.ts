import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { chatTimestampClass } from './typography';

export const MessageStyle = {
  container: css`
    display: flex;
    align-items: flex-start;
    gap: 1.2rem;
    width: 100%;
    padding: 0.8rem 1.2rem;
    position: relative;
  `,
  profilePic: css`
    width: 3.6rem;
    flex: 0 0 auto;
    @media (max-width: ${mobileMaxWidth}) {
      width: 3.2rem;
    }
  `,
  content: css`
    --chat-message-actions-width: 100px;
    --chat-message-actions-height: 44px;
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    position: relative;
    &[data-grouped-actions='true'] {
      padding-right: var(--chat-message-actions-width);
      min-height: var(--chat-message-actions-height);
    }
    @media (max-width: ${mobileMaxWidth}) {
      /* Two 30px controls, their 4px gap, and 8px clear of the text. */
      --chat-message-actions-width: 72px;
      --chat-message-actions-height: 30px;
    }
  `,
  authorRow: css`
    min-height: 2.4rem;
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    column-gap: 0.7rem;
    overflow-wrap: anywhere;
    &[data-message-actions='true'] {
      min-height: var(--chat-message-actions-height);
      padding-right: var(--chat-message-actions-width);
    }
    @media (max-width: ${mobileMaxWidth}) {
      align-content: center;
    }
  `,
  messageWrapper: css`
    margin-top: 0.5rem;
    position: relative;
  `,
  messageSurface: css`
    width: fit-content;
    min-width: 0;
    max-width: 100%;
    padding: 0.9rem 1.2rem;
    border: 1px solid #e2e8f0;
    border-radius: 4px 14px 14px 14px;
    background: #f5f7fa;
    &[data-message-surface='own'] {
      background: color-mix(in srgb, var(--theme-bg, #418ceb) 12%, white);
      border-color: color-mix(in srgb, var(--theme-bg, #418ceb) 30%, #e2e8f0);
    }
    &[data-message-surface='ai'] {
      width: 100%;
      background: #fff;
      border-left: 3px solid var(--theme-bg, #418ceb);
    }
    @media (max-width: ${mobileMaxWidth}) {
      padding: 8px 10px;
      border-radius: 4px 12px 12px 12px;
    }
  `,
  timeStamp: chatTimestampClass,
  relatedConversationsButton: css`
    margin-top: 2rem;
    margin-bottom: -1rem;
  `
};

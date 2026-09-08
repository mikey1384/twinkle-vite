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
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    position: relative;
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

import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export const MessageStyle = {
  container: css`
    display: flex;
    justify-content: space-between;
    width: 100%;
    padding: 1rem;
    position: relative;
  `,
  profilePic: css`
    width: 5vw;
    @media (max-width: ${mobileMaxWidth}) {
      width: 6vw;
    }
  `,
  messageWrapper: css`
    margin-top: 0.5rem;
    position: relative;
  `,
  timeStamp: css`
    font-size: 1rem;
    color: ${Color.gray()};
    @media (max-width: ${mobileMaxWidth}) {
      font-size: 0.8rem;
    }
  `,
  relatedConversationsButton: css`
    margin-top: 1rem;
  `
};

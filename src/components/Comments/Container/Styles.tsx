import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

export const commentContainer = css`
  display: flex;
  width: 100%;
  flex-direction: column;
  position: relative;
  padding-top: 1rem;
  margin-bottom: 1.25rem;
  font-size: 1.6rem;
  .dropdown-wrapper {
    right: 0;
    position: absolute;
  }
  .content-wrapper {
    display: flex;
    width: 100%;
    position: relative;
    > aside {
      margin-top: 1rem;
      width: 7rem;
      justify-content: center;
      display: flex;
    }
    > section {
      flex-grow: 1;
      min-width: CALC(100% - 7rem);
      margin-left: 1rem;
    }
  }
  .timestamp {
    color: ${Color.gray()};
    > a {
      color: ${Color.gray()};
    }
  }
  .to {
    font-size: 1.3rem;
    line-height: 2.3rem;
    font-weight: bold;
  }
  .username {
    font-size: 1.8rem;
  }
  .comment__content {
    padding-top: 1.5rem;
  }
  .reply-button {
    margin-left: 0.5rem;
  }
  .comment__likes {
    margin-top: 0.5rem;
    font-size: 1.2rem;
    line-height: 1.5;
    font-weight: bold;
    color: ${Color.darkerGray()};
  }
  /* The action row (see ActionRow.tsx) never wraps to a second row: when the
     buttons do not fit, the row scrolls sideways. Buttons keep their natural
     size. */
  .comment__action-row > div:first-of-type {
    flex: 0 1 auto;
  }
  .comment__action-row .comment__buttons > * {
    flex: 0 0 auto;
  }
  .comment__action-group {
    flex: 0 0 auto;
    flex-wrap: nowrap;
  }
  .comment__buttons {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
  }
  @media (max-width: ${mobileMaxWidth}) {
    .likes {
      font-size: 1.8rem;
      margin-top: 0.5rem;
      font-weight: bold;
      color: ${Color.darkerGray()};
    }
    button {
      font-size: 1.1rem;
    }
  }
`;

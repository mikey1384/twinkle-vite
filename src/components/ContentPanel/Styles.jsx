import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';

export const container = css`
  background: #fff;
  width: 100%;
  border: 1px solid ${Color.borderGray()};
  border-radius: ${borderRadius};
  position: static;
  &:last-child {
    margin-bottom: 0;
  }
  .heading {
    user-select: none;
    padding: 1rem;
    display: flex;
    align-items: center;
    width: 100%;
    justify-content: space-between;
  }
  .body {
    width: 100%;
    font-size: 1.7rem;
    line-height: 1.7;
    padding: 0;
    position: static;
    z-index: 10;
    .bottom-interface {
      padding: 0 1rem 0 1rem;
      display: flex;
      flex-direction: column;
      @media (max-width: ${mobileMaxWidth}) {
        padding: 0 0.5rem 0 0.5rem;
      }
    }
  }
  .content-panel__likes {
    font-weight: bold;
    color: ${Color.darkerGray()};
    font-size: 1.2rem;
    line-height: 1;
  }
  .subject {
    font-size: 2rem;
    font-weight: bold;
    white-space: pre-wrap;
    overflow-wrap: break-word;
    word-break: break-word;
    margin-bottom: 1.5rem;
  }
  .title {
    font-size: 1.7rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: pre-wrap;
    overflow-wrap: break-word;
    word-break: break-word;
  }
  .timestamp {
    font-size: 1rem;
    color: ${Color.gray()};
  }
  @media (max-width: ${mobileMaxWidth}) {
    border-radius: 0;
    border-left: none;
    border-right: none;
    .body {
      font-size: 1.8rem;
    }
    .heading {
      > a,
      > span {
        font-size: 1.7rem;
      }
      > small {
        font-size: 1.2rem;
      }
      > button {
        font-size: 1.2rem;
      }
    }
  }
`;

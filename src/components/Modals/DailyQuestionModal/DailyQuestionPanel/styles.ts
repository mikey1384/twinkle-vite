import { css, keyframes } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { PAPER } from '../paperTheme';

export const pulseAnimation = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

export const containerCls = css`
  padding: 2.4rem 2rem 2rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1.6rem 1rem 1.4rem;
  }
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 300px;
`;

export const centeredContainerCls = css`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 300px;
`;

export const innerContainerCls = css`
  margin-top: -7rem;
  display: flex;
  width: 100%;
  justify-content: center;
  align-items: center;
  flex-direction: column;
`;

export const questionTextCls = css`
  max-width: calc(720 * var(--px));
  font-family: ${PAPER.serif};
  font-size: 2.6rem;
  color: ${PAPER.ink};
  line-height: 1.4;
  font-weight: 500;
  text-align: center;
  margin: 0 0 1.2rem;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 2rem;
  }
`;

export const questionTextSmallCls = css`
  font-family: ${PAPER.serif};
  font-size: 1.6rem;
  color: ${PAPER.inkSoft};
  line-height: 1.45;
  text-align: center;
  margin-bottom: 1rem;
  font-style: italic;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.2rem;
  }
`;

export const todayPreferenceRowCls = css`
  display: flex;
  width: 100%;
  max-width: calc(560 * var(--px));
  margin-bottom: 1.5rem;
  border: 1px solid ${PAPER.line};
  border-radius: 16px;
  background: ${PAPER.paperDeep};
  overflow: hidden;
  @media (max-width: ${mobileMaxWidth}) {
    flex-direction: column;
  }
  > div:not(:last-child) {
    border-right: 1px solid ${PAPER.line};
  }
  @media (max-width: ${mobileMaxWidth}) {
    > div:not(:last-child) {
      border-right: 0;
      border-bottom: 1px solid ${PAPER.line};
    }
  }
`;

export const todayPreferenceCardCls = css`
  flex: 1;
  min-width: 0;
  padding: 0.95rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  text-align: center;
  align-items: center;
`;

export const todayPreferenceLabelCls = css`
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: ${PAPER.accent};
`;

export const todayPreferenceValueCls = css`
  font-size: 1.2rem;
  font-weight: 700;
  color: ${PAPER.ink};
  line-height: 1.35;
`;

export const instructionBoxCls = css`
  background: ${PAPER.paperDeep};
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  width: 100%;
  max-width: calc(500 * var(--px));
`;

export const instructionListCls = css`
  margin: 0;
  padding-left: 1.5rem;
  font-size: 1.3rem;
  color: ${PAPER.inkSoft};
  line-height: 1.8;
  li {
    margin-bottom: 0.3rem;
  }
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.2rem;
  }
`;

export const ruleTitleCls = css`
  font-weight: 700;
  color: ${PAPER.ink};
`;

export const ruleWarningCls = css`
  font-weight: 700;
  color: ${PAPER.warn};
`;

export const ruleSuccessCls = css`
  font-weight: 700;
  color: ${PAPER.done};
`;

export const timerContainerCls = css`
  text-align: center;
  margin-bottom: 1rem;
`;

export const textareaCls = css`
  width: 100%;
  min-height: 240px;
  padding: 1.4rem 1.6rem;
  font-size: 1.7rem;
  line-height: 1.75;
  color: ${PAPER.ink};
  background: ${PAPER.paper};
  border: 1px solid ${PAPER.lineStrong};
  border-radius: 14px;
  resize: vertical;
  font-family: inherit;
  &:focus {
    outline: none;
    border-color: ${PAPER.accent};
  }
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.3rem;
  }
`;

export const statsRowCls = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  font-size: 1.2rem;
  width: 100%;
`;

export const buttonContainerCls = css`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
`;

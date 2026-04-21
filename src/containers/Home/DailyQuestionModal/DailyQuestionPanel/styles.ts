import { css, keyframes } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

export const pulseAnimation = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

export const containerCls = css`
  padding: 1.5rem;
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
  font-size: 1.7rem;
  color: ${Color.black()};
  line-height: 1.5;
  font-weight: 500;
  text-align: center;
  margin-bottom: 1.5rem;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.5rem;
  }
`;

export const questionTextSmallCls = css`
  font-size: 1.4rem;
  color: ${Color.darkerGray()};
  line-height: 1.4;
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
  max-width: 560px;
  margin-bottom: 1.5rem;
  border: 1px solid ${Color.borderGray()};
  border-radius: 16px;
  background: ${Color.highlightGray()};
  overflow: hidden;
  @media (max-width: ${mobileMaxWidth}) {
    flex-direction: column;
  }
  > div:not(:last-child) {
    border-right: 1px solid ${Color.borderGray()};
  }
  @media (max-width: ${mobileMaxWidth}) {
    > div:not(:last-child) {
      border-right: 0;
      border-bottom: 1px solid ${Color.borderGray()};
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
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: ${Color.lightGray()};
`;

export const todayPreferenceValueCls = css`
  font-size: 1.2rem;
  font-weight: 700;
  color: ${Color.black()};
  line-height: 1.35;
`;

export const instructionBoxCls = css`
  background: ${Color.highlightGray()};
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  width: 100%;
  max-width: 500px;
`;

export const instructionListCls = css`
  margin: 0;
  padding-left: 1.5rem;
  font-size: 1.3rem;
  color: ${Color.darkerGray()};
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
  color: ${Color.black()};
`;

export const ruleWarningCls = css`
  font-weight: 700;
  color: ${Color.rose()};
`;

export const ruleSuccessCls = css`
  font-weight: 700;
  color: ${Color.green()};
`;

export const timerContainerCls = css`
  text-align: center;
  margin-bottom: 1rem;
`;

export const textareaCls = css`
  width: 100%;
  min-height: 200px;
  padding: 1rem;
  font-size: 1.5rem;
  line-height: 1.7;
  border: 1px solid ${Color.borderGray()};
  border-radius: 8px;
  resize: vertical;
  font-family: inherit;
  &:focus {
    outline: none;
    border-color: ${Color.logoBlue()};
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

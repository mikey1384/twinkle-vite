import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';

export const PanelStyle = css`
  background: #fff;
  border-radius: ${borderRadius};
  border: 1px solid ${Color.borderGray()};
  margin-bottom: 1rem;
  padding: 1.5rem 2rem;
  small {
    font-size: 1.3rem;
    line-height: 2.5rem;
  }
  > p {
    color: ${Color.darkerGray()};
    margin-bottom: 1rem;
    font-size: 2rem;
    font-weight: bold;
  }
  .button-container {
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
  @media (max-width: ${mobileMaxWidth}) {
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
`;

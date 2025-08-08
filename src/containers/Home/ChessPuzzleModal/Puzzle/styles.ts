import { css } from '@emotion/css';
import { tabletMaxWidth } from '~/constants/css';

export const surface = '#ffffff';
export const surfaceAlt = '#f7f7f7';
export const borderSubtle = '#dddddd';

// Sophisticated shadow system like Airbnb
export const shadowCard = '0 6px 16px rgba(0,0,0,0.12)';
export const shadowButton =
  '0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)';
export const shadowButtonHover =
  '0 2px 4px rgba(0,0,0,0.08), 0 8px 16px rgba(0,0,0,0.1)';

// Refined border radius
export const radiusCard = '12px';
export const radiusButton = '8px';
export const radiusSmall = '6px';

// Shared card container style
export const cardCls = css`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: ${radiusCard};
  padding: 1rem;

  @media (max-width: ${tabletMaxWidth}) {
    padding: 0.8rem;
  }
`;

export const analysisBadgeCls = css`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.6rem;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
  color: #0f172a;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 0.85rem;
  animation: fadeIn 200ms ease;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export const headerNavCls = css`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 0.25rem;
  button {
    cursor: pointer;
    border: 1px solid #bfdbfe;
    background: #eff6ff;
    color: #1e40af;
    border-radius: 9999px;
    padding: 0.25rem 0.6rem;
    font-weight: 800;
    line-height: 1;
  }
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const returnToStartBtnCls = css`
  margin-left: 0.5rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: #0f172a;
  background: #e2e8f0;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.2rem 0.5rem;
  cursor: pointer;
  &:hover {
    background: #eef2f7;
  }
`;

export const analysisFadeCls = css`
  animation: fadeSwap 140ms ease;
  @keyframes fadeSwap {
    from {
      opacity: 0.85;
      transform: translateY(1px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

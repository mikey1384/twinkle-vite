import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

export const footerActionsClass = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
  > button {
    min-height: 44px;
    min-width: 44px;
    max-width: 100%;
    white-space: normal;
    overflow-wrap: anywhere;
  }
  @media (max-width: ${mobileMaxWidth}) {
    > button {
      font-size: 14px;
    }
  }
`;

export const exchangeGrid = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 26rem), 1fr));
  gap: 1.6rem;
  width: 100%;
  align-items: start;
  @media (max-width: 650px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 1.2rem;
  }
`;

export const panelClass = css`
  --trade-accent: #9a510c;
  --trade-tint: #fff8ef;
  --trade-line: #edc99e;
  &[data-side='receive'] {
    --trade-accent: #126b65;
    --trade-tint: #effaf7;
    --trade-line: #aad9cc;
  }
  min-width: 0;
  border: 1px solid var(--trade-line);
  border-radius: 1.4rem;
  background: #fff;
  color: #24334a;
  overflow: hidden;
  > header {
    padding: 1.5rem 1.6rem;
    background: var(--trade-tint);
    border-bottom: 1px solid var(--trade-line);
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .direction {
    display: grid;
    place-items: center;
    width: 3.4rem;
    height: 3.4rem;
    border: 1px solid var(--trade-line);
    border-radius: 1rem;
    color: var(--trade-accent);
    flex-shrink: 0;
    font-size: 1.6rem;
  }
  h3 {
    margin: 0;
    font-size: 1.7rem;
    font-weight: 800;
    color: var(--trade-accent);
  }
  .partner {
    font-size: 1.2rem;
    margin-top: 0.2rem;
    overflow-wrap: anywhere;
  }
  .inventory {
    padding: 1.4rem;
  }
  .empty {
    border: 1px dashed #d4dce6;
    border-radius: 1rem;
    padding: 2.4rem 1.2rem;
    text-align: center;
    color: #67758a;
    font-size: 1.3rem;
    line-height: 1.6;
  }
  .empty strong {
    display: block;
    color: #344359;
  }
`;

export const assetListClass = css`
  display: grid;
  gap: 0.9rem;
  min-width: 0;
  .asset {
    padding: 1rem;
    border: 1px solid #e0e6ee;
    border-radius: 1rem;
    background: #fff;
    min-width: 0;
  }
  .asset-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.7rem;
    font-size: 1.1rem;
    color: #617087;
  }
  .asset-heading b {
    color: #344359;
  }
  .asset--card {
    padding: 0;
    overflow: hidden;
  }
  .asset-actions {
    display: flex;
    justify-content: flex-end;
    padding: 0 1rem 0.8rem;
  }




  .remove {
    border: 0;
    background: #f1f4f8;
    color: #536178;
    border-radius: 0.5rem;
    padding: 0.35rem 0.7rem;
    font-size: 1.1rem;
    cursor: pointer;
  }
  .coins {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    font-size: 1.6rem;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }
  .ownership {
    margin-top: 0.6rem;
    color: #855018;
    font-size: 1.1rem;
    font-weight: 600;
  }
`;

export const noticeClass = css`
  padding: 1.2rem 1.4rem;
  border: 1px solid #dce4ee;
  border-radius: 1rem;
  background: #f5f8fc;
  font-size: 1.3rem;
  line-height: 1.6;
  color: #40526b;
  margin: 1.4rem 0;
  &[data-warning='true'] {
    border-color: #ebc896;
    background: #fff8ed;
    color: #80501c;
  }
  p {
    margin: 0;
  }
`;

export const errorClass = css`
  color: #a12235;
  background: #fff3f3;
  border: 1px solid #eebac2;
  padding: 1rem 1.2rem;
  border-radius: 0.8rem;
  font-size: 1.3rem;
  line-height: 1.5;
`;

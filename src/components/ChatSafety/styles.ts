import { css } from '@emotion/css';

export const safetyTextClass = css`
  width: 100%;
  color: #253247;
  font-size: 1.5rem;
  line-height: 1.5;
`;

export const safetyHintClass = css`
  margin: 1rem 0 0;
  color: #52607a;
  font-size: 1.4rem;
  line-height: 1.45;
`;

export const safetyFieldsetClass = css`
  margin: 0;
  padding: 0;
  border: 0;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  legend {
    padding: 0;
    margin-bottom: 1rem;
    font-size: 1.6rem;
    font-weight: 700;
  }
`;

// Each reason is a whole-row radio: a big touch target (min 48px) that the
// keyboard reaches with Tab and moves through with the arrow keys.
export const safetyOptionClass = css`
  display: flex;
  align-items: flex-start;
  gap: 1.2rem;
  min-height: 48px;
  box-sizing: border-box;
  padding: 1rem 1.2rem;
  border: 1px solid #dce3ed;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  touch-action: manipulation;
  input {
    flex: 0 0 auto;
    width: 2rem;
    height: 2rem;
    margin: 0.15rem 0 0;
    accent-color: #b42318;
    cursor: pointer;
  }
  .label {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
  }
  .hint {
    display: block;
    margin-top: 0.2rem;
    color: #52607a;
    font-size: 1.3rem;
    line-height: 1.4;
  }
  &:hover {
    background: #f5f7fa;
  }
  &:has(input:checked) {
    border-color: #b42318;
    background: #fff5f4;
  }
  &:has(input:focus-visible) {
    outline: 2px solid #334155;
    outline-offset: 1px;
  }
`;

export const safetyNoteClass = css`
  display: block;
  margin-top: 1.6rem;
  font-size: 1.5rem;
  font-weight: 700;
`;

import { css } from '@emotion/css';

export const chatFormClass = css`
  width: 100%;
  min-width: 0;
  height: max-content;
  color: #253247;
  font-size: 14px;
  line-height: 1.5;
  > header { position: sticky; top: 0; z-index: 1; padding: 20px 68px 12px 20px; background: #fff; }
  h2 { margin: 0; font-size: 20px; line-height: 1.3; font-weight: 700; }
  .description { margin: 6px 0 0; color: #526176; font-size: 14px; }
  > main { display: flex; flex-direction: column; gap: 20px; padding: 8px 20px 24px; }
  label, .field-title { display: block; margin: 0 0 6px; font-size: 14px; font-weight: 600; }
  input[type='text'], input[type='search'] { width: 100%; min-width: 0; min-height: 46px; padding: 10px 12px; border: 1px solid #b8c4d4; border-radius: 10px; background: #fff; color: #253247; font: inherit; font-size: 16px; line-height: 1.5; }
  input::placeholder { color: #64748b; opacity: 1; }
  input:focus-visible, button:focus-visible { outline: 2px solid #334155; outline-offset: 2px; }
  input[type='text']:focus-visible, input[type='search']:focus-visible {
    border-color: #64748b;
    box-shadow: 0 0 0 1px #64748b;
    outline-color: transparent;
    outline-offset: 0;
  }
  @media (forced-colors: active) {
    input[type='text']:focus-visible, input[type='search']:focus-visible {
      outline-color: Highlight;
      outline-offset: 2px;
    }
  }
  .field-hint { margin: 6px 0 0; color: #526176; font-size: 13px; }
  .error { margin: 0; padding: 12px; color: #8b2735; background: #fff1f2; border: 1px solid #edc4ca; border-radius: 10px; overflow-wrap: anywhere; scroll-margin-block: 120px 84px; }
  input, main button { scroll-margin-block: 120px 84px; }
  .setting { padding: 14px 0 0; border-top: 1px solid #e9edf2; }
  .setting label { display: flex; align-items: center; gap: 12px; min-height: 44px; margin: 0; cursor: pointer; }
  .setting input { appearance: none; position: relative; width: 48px; height: 28px; margin: 0; border: 1px solid #94a3b8; border-radius: 20px; flex-shrink: 0; background: #dce3ed; cursor: pointer; }
  .setting input::before { content: ''; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: white; box-shadow: 0 1px 3px #33415555; }
  .setting input:checked { background: #334155; border-color: #334155; }
  .setting input:checked::before { transform: translateX(20px); }
  .choice-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .choice { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; min-height: 150px; padding: 18px; border: 0; border-radius: 10px; background: #f8fafc; color: #253247; text-align: left; font: inherit; cursor: pointer; }
  .choice > svg { font-size: 26px; color: var(--theme-bg, #418ceb); }
  .choice strong { font-size: 16px; }
  .choice span { color: #526176; font-size: 14px; }
  .choice:hover { background: #edf2f8; }
  @media (max-width: 480px) {
    > header { padding: 16px 64px 10px 16px; }
    > main { padding: 8px 16px 20px; }
    .choice-grid { grid-template-columns: minmax(0, 1fr); }
    .choice { min-height: 120px; }
  }
`;

export const chatFormModalClass = css`
  button[aria-label='Close modal'] {
    top: 8px;
    right: 8px;
    width: 44px;
    height: 44px;
    border: 0;
    background: transparent;
    color: #334155;
    border-radius: 6px;
    font-size: 16px;
    z-index: 3;
  }
`;

export const chatFormActionStyle = {
  minHeight: 44,
  minWidth: 44,
  padding: '10px 16px',
  borderRadius: 10,
  fontSize: 14,
  color: '#253247'
};

import { css } from '@emotion/css';

export const topicSettingsFormClass = css`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  min-width: 0;
  color: #273449;
  font-size: calc(16 * var(--px));
  line-height: 1.5;
  input[type='text'], textarea {
    width: 100%;
    min-height: 44px;
    font-size: calc(16 * var(--px));
    line-height: 1.6;
    color: #273449;
  }
  input:focus-visible, textarea:focus-visible {
    outline: 2px solid #526176;
    outline-offset: 2px;
  }
  label:has(> input[role='switch']) {
    min-height: 44px;
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
  }
`;

export const topicSettingsLabelClass = css`
  display: block;
  margin-bottom: 8px;
  color: #334155;
  font-size: calc(14 * var(--px));
  font-weight: 600;
`;

export const topicSettingsHelpClass = css`
  margin: 8px 0 0;
  color: #526176;
  font-size: calc(13 * var(--px));
  line-height: 1.5;
  overflow-wrap: anywhere;
  &[data-error='true'] { color: #b42318; }
`;

export const topicSettingsSectionClass = css`
  width: 100%;
  min-width: 0;
  padding: 16px 0 0;
  border-top: 1px solid #e9edf2;
`;

export const topicSettingsActionsClass = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  margin-top: 16px;
  > button { border: 0; font-family: inherit; font-weight: 500; text-transform: none; }
  > [aria-live] { color: #526176; font-size: calc(13 * var(--px)); }
`;

export const topicSettingsSwitchStyle = {
  width: '100%',
  flexDirection: 'row' as const,
  justifyContent: 'space-between',
  gap: '12px'
};

export const topicSettingsSwitchLabelStyle = {
  fontSize: 'calc(14 * var(--px))',
  lineHeight: 1.5,
  color: '#334155',
  margin: 0
};

// "Who can post in this topic": three plain choices and, for chosen
// members, one compact row with an Edit button.
export const topicPostingOptionsClass = css`
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
  > legend { padding: 0; }
  > label {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 40px;
    margin: 0;
    color: #334155;
    font-size: calc(15 * var(--px));
    cursor: pointer;
  }
  > label > input {
    width: 18px;
    height: 18px;
    margin: 0;
    flex-shrink: 0;
    accent-color: #334155;
  }
  &:disabled > label { cursor: default; opacity: 0.7; }
`;

export const topicPostingChosenRowClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  margin: 4px 0 0 28px;
  padding: 6px 6px 6px 12px;
  border-radius: 10px;
  background: #f4f6f9;
  color: #334155;
  font-size: calc(14 * var(--px));
  > span { min-width: 0; overflow-wrap: anywhere; }
  > span b { font-weight: 600; }
  > button { flex-shrink: 0; }
`;

import { css } from '@emotion/css';

export const topicSettingsFormClass = css`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  min-width: 0;
  color: #273449;
  font-size: 16px;
  line-height: 1.5;
  input[type='text'], textarea {
    width: 100%;
    min-height: 44px;
    font-size: 16px;
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
  font-size: 14px;
  font-weight: 600;
`;

export const topicSettingsHelpClass = css`
  margin: 8px 0 0;
  color: #526176;
  font-size: 13px;
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
  > [aria-live] { color: #526176; font-size: 13px; }
`;

export const topicSettingsSwitchStyle = {
  width: '100%',
  flexDirection: 'row' as const,
  justifyContent: 'space-between',
  gap: '12px'
};

export const topicSettingsSwitchLabelStyle = {
  fontSize: '14px',
  lineHeight: 1.5,
  color: '#334155',
  margin: 0
};

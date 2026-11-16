import React from 'react';
import { css } from '@emotion/css';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { chatTopicModalClass } from '../../topicStyles';
import { topicSettingsHelpClass } from '../styles';

export type ImportChoice = 'keep' | 'notes' | 'instructions';

// A file was picked: the member says what Zero or Ciel should do with it.
export default function ImportFileModal({
  fileName,
  assistantName,
  busyChoice,
  error,
  onChoose,
  onHide
}: {
  fileName: string;
  assistantName: string;
  busyChoice: ImportChoice | null;
  error: string;
  onChoose: (choice: ImportChoice) => void;
  onHide: () => void;
}) {
  const choices: Array<{
    key: ImportChoice;
    icon: string;
    title: string;
    detail: string;
  }> = [
    {
      key: 'keep',
      icon: 'paperclip',
      title: 'Keep it as a file',
      detail: `${assistantName} reads the whole file every time you chat here.`
    },
    {
      key: 'notes',
      icon: 'pencil-alt',
      title: 'Put its words in my notes',
      detail: `You can change the words, and ${assistantName} can suggest updates.`
    },
    {
      key: 'instructions',
      icon: 'sliders-h',
      title: 'Use it as Custom Instructions',
      detail: `For a file that tells ${assistantName} how to act.`
    }
  ];
  return (
    <Modal
      modalKey="TopicBrainImportFile"
      isOpen
      onClose={() => {
        if (!busyChoice) onHide();
      }}
      size="sm"
      modalLevel={3}
      title="Add a file"
      aria-label="What to do with this file"
      className={chatTopicModalClass}
      style={{ width: 'min(480px, calc(100vw - 24px))', maxWidth: '100%' }}
      bodyPadding="12px"
      footer={
        <Button variant="ghost" disabled={!!busyChoice} onClick={onHide}>
          Cancel
        </Button>
      }
    >
      <div style={{ width: '100%' }}>
        <p className={titleCls}>
          What should {assistantName} do with <b>{fileName}</b>?
        </p>
        <div className={listCls}>
          {choices.map((choice) => (
            <button
              key={choice.key}
              type="button"
              className={choiceCls}
              disabled={!!busyChoice}
              onClick={() => onChoose(choice.key)}
            >
              <Icon
                icon={busyChoice === choice.key ? 'spinner' : choice.icon}
                pulse={busyChoice === choice.key}
              />
              <span>
                <b>{choice.title}</b>
                <small>{choice.detail}</small>
              </span>
            </button>
          ))}
        </div>
        {error && (
          <p role="alert" className={topicSettingsHelpClass} data-error="true">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}

const titleCls = css`
  margin: 0 0 12px;
  color: #273449;
  font-size: calc(16 * var(--px));
  line-height: 1.5;
  overflow-wrap: anywhere;
`;

const listCls = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const choiceCls = css`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 56px;
  padding: 10px 14px;
  border: 1px solid #dbe2ea;
  border-radius: 12px;
  background: #fff;
  color: #273449;
  font: inherit;
  text-align: left;
  cursor: pointer;
  > span {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  b {
    font-size: calc(16 * var(--px));
    font-weight: 700;
  }
  small {
    color: #526176;
    font-size: calc(14 * var(--px));
    line-height: 1.4;
  }
  &:hover:not(:disabled),
  &:focus-visible:not(:disabled) {
    border-color: var(--chat-topic-accent, #418ceb);
    background: #f7f9fc;
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
`;

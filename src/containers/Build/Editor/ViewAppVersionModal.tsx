import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import Modal from '~/components/Modal';

const promptClass = css`
  margin: 0;
  color: var(--chat-text);
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.5;
`;

const choicesClass = css`
  display: grid;
  gap: 0.75rem;
  margin-top: 1rem;
`;

const choiceClass = css`
  width: 100%;
  border: 2px solid var(--ui-border);
  border-radius: 10px;
  background: #fff;
  color: var(--chat-text);
  padding: 1rem;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.8rem;
  align-items: center;
  text-align: left;
  font-family: inherit;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    transform 0.15s ease;

  &:hover,
  &:focus-visible {
    background: rgba(65, 140, 235, 0.08);
    border-color: #1d4ed8;
    outline: none;
    transform: translateY(-1px);
  }
`;

const choiceIconClass = css`
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 999px;
  background: rgba(65, 140, 235, 0.12);
  color: #1d4ed8;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
`;

const choiceTitleClass = css`
  display: block;
  font-size: 1.1rem;
  font-weight: 900;
  line-height: 1.25;
`;

const choiceDescriptionClass = css`
  display: block;
  margin-top: 0.25rem;
  font-size: 1.1rem;
  font-weight: 650;
  line-height: 1.4;
  opacity: 0.72;
`;

export default function ViewAppVersionModal({
  onClose,
  onOpenPublished,
  onOpenWorkspace
}: {
  onClose: () => void;
  onOpenPublished: () => void;
  onOpenWorkspace: () => void;
}) {
  return (
    <Modal
      modalKey="BuildViewAppVersionModal"
      isOpen
      onClose={onClose}
      title="Choose app version"
      size="sm"
    >
      <p className={promptClass}>
        Your saved workspace has changes that are not live yet. Which version
        would you like to open full screen?
      </p>
      <div className={choicesClass}>
        <button
          type="button"
          className={choiceClass}
          onClick={onOpenWorkspace}
        >
          <span className={choiceIconClass}>
            <Icon icon="laptop-code" />
          </span>
          <span>
            <span className={choiceTitleClass}>Latest saved version</span>
            <span className={choiceDescriptionClass}>
              Open the same version currently shown in Workspace Preview.
            </span>
          </span>
        </button>
        <button
          type="button"
          className={choiceClass}
          onClick={onOpenPublished}
        >
          <span className={choiceIconClass}>
            <Icon icon="globe" />
          </span>
          <span>
            <span className={choiceTitleClass}>Live published version</span>
            <span className={choiceDescriptionClass}>
              Open the version currently available to everyone.
            </span>
          </span>
        </button>
      </div>
    </Modal>
  );
}

import React from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import Modal from '~/components/Modal';
import { Color } from '~/constants/css';
import type {
  BuildProjectFileContributionAction,
  BuildProjectFileDraftActionChoice,
  BuildProjectFileDraftActionPrompt
} from './hooks/useProjectFileDrafts';

interface ProjectFileDraftActionModalProps {
  prompt: BuildProjectFileDraftActionPrompt | null;
  onChoose: (choice: BuildProjectFileDraftActionChoice) => void;
}

export default function ProjectFileDraftActionModal({
  prompt,
  onChoose
}: ProjectFileDraftActionModalProps) {
  if (!prompt) return null;

  const copy = getProjectFileDraftActionCopy(prompt.action);
  return (
    <Modal
      modalKey="ProjectFileDraftActionModal"
      isOpen
      onClose={() => onChoose('cancel')}
      closeOnBackdropClick
      title="Unsaved Files"
      size="sm"
      modalLevel={2}
      footer={
        <div
          className={css`
            display: flex;
            justify-content: flex-end;
            gap: 0.7rem;
            flex-wrap: wrap;
          `}
        >
          <Button variant="ghost" onClick={() => onChoose('cancel')}>
            Cancel
          </Button>
          <Button
            variant="outline"
            color="red"
            onClick={() => onChoose('discard')}
          >
            {copy.discardLabel}
          </Button>
          <Button color="logoBlue" onClick={() => onChoose('save')}>
            {copy.saveLabel}
          </Button>
        </div>
      }
    >
      <div
        className={css`
          display: grid;
          gap: 0.9rem;
          color: ${Color.darkerGray()};
          font-size: 1.1rem;
          line-height: 1.45;
        `}
      >
        <p
          className={css`
            margin: 0;
            font-weight: 800;
          `}
        >
          The code workspace has unsaved file changes.
        </p>
        <p
          className={css`
            margin: 0;
          `}
        >
          Choose what should happen to those changes before {copy.actionText}.
        </p>
      </div>
    </Modal>
  );
}

function getProjectFileDraftActionCopy(
  action: BuildProjectFileContributionAction
) {
  if (action === 'merge') {
    return {
      actionText: 'merging',
      saveLabel: 'Save and merge',
      discardLabel: 'Discard draft and merge'
    };
  }
  if (action === 'update-from-main') {
    return {
      actionText: 'updating from main',
      saveLabel: 'Save and continue',
      discardLabel: 'Discard draft and continue'
    };
  }
  if (action === 'replace') {
    return {
      actionText: 'replacing',
      saveLabel: 'Save and continue',
      discardLabel: 'Discard draft and continue'
    };
  }
  return {
    actionText: 'completing the merge',
    saveLabel: 'Save and continue',
    discardLabel: 'Discard draft and continue'
  };
}

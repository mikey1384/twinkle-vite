import React from 'react';
import { css } from '@emotion/css';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import { mobileMaxWidth } from '~/constants/css';

const noticeClass = css`
  border: 2px solid #db2777;
  border-radius: 8px;
  background: color-mix(in srgb, #ec4899 10%, #ffffff);
  color: #831843;
  padding: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
  box-shadow: 0 2px 0 rgba(190, 24, 93, 0.16);
  @media (max-width: ${mobileMaxWidth}) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const copyClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
  strong {
    font-size: 1.1rem;
    font-weight: 900;
  }
  span {
    color: #4b5563;
    font-size: 1.1rem;
    font-weight: 800;
    line-height: 1.35;
  }
`;

const errorClass = css`
  color: #be123c !important;
  overflow-wrap: anywhere;
`;

export interface BranchMainUpdateNoticeProps {
  canUpdate: boolean;
  className?: string;
  disabled?: boolean;
  error?: string;
  loading?: boolean;
  onUpdate: () => Promise<void> | void;
}

export default function BranchMainUpdateNotice({
  canUpdate,
  className,
  disabled = false,
  error = '',
  loading = false,
  onUpdate
}: BranchMainUpdateNoticeProps) {
  const title = canUpdate ? 'Main has updates' : 'Branch needs attention';
  const body = canUpdate
    ? 'Update this branch with the latest main changes.'
    : 'Resolve the branch update issue before continuing.';

  return (
    <div
      className={[noticeClass, className].filter(Boolean).join(' ')}
      aria-live="polite"
    >
      <div className={copyClass}>
        <strong>{title}</strong>
        <span>{body}</span>
        {error ? <span className={errorClass}>{error}</span> : null}
      </div>
      {canUpdate ? (
        <GameCTAButton
          variant="magenta"
          size="sm"
          icon="redo"
          shiny
          loading={loading}
          disabled={loading || disabled}
          onClick={handleUpdateClick}
        >
          Update from Main
        </GameCTAButton>
      ) : null}
    </div>
  );

  function handleUpdateClick() {
    void onUpdate();
  }
}

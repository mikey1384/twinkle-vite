import React from 'react';
import { css, cx } from '@emotion/css';
import Icon from '~/components/Icon';

const editBuildDetailsButtonClass = css`
  width: 2.15rem;
  height: 2.15rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border: 1px solid var(--ui-border);
  border-radius: 999px;
  background: #fff;
  color: var(--chat-text);
  cursor: pointer;
  opacity: 0.78;
  transition:
    opacity 0.18s ease,
    transform 0.18s ease,
    border-color 0.18s ease,
    background-color 0.18s ease;

  &:hover {
    opacity: 1;
    transform: translateY(-1px);
    border-color: var(--ui-border-strong);
    background: #f8faff;
  }

  &:focus-visible {
    outline: 2px solid var(--ui-border-strong);
    outline-offset: 2px;
  }
`;

export default function EditBuildDetailsButton({
  className,
  onClick
}: {
  className?: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      className={cx(editBuildDetailsButtonClass, className)}
      aria-label="Edit build details"
      title="Edit build details"
      onClick={onClick}
    >
      <Icon icon="pencil-alt" />
    </button>
  );
}

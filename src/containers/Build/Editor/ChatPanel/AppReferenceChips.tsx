import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import {
  getBuildAppReferenceLabel,
  type BuildAppReference
} from '../helpers/appReferences';

export default function AppReferenceChips({
  apps,
  disabled = false,
  onRemove
}: {
  apps: BuildAppReference[];
  disabled?: boolean;
  onRemove?: (id: number) => void;
}) {
  if (!apps.length) return null;
  return (
    <div aria-label="Referenced apps" className={chipsClass}>
      {apps.map((app) => (
        <span
          key={app.id}
          className={chipClass}
          title={app.username ? `${app.title} · ${app.username}` : app.title}
        >
          <Icon icon="link" />
          {onRemove ? (
            <span className={titleClass}>
              {getBuildAppReferenceLabel(app, apps)}
            </span>
          ) : (
            <a
              className={titleClass}
              href={`/build/${app.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {getBuildAppReferenceLabel(app, apps)}
            </a>
          )}
          {onRemove ? (
            <button
              type="button"
              aria-label={`Remove ${getBuildAppReferenceLabel(app, apps)} reference`}
              disabled={disabled}
              onClick={() => onRemove(app.id)}
            >
              <Icon icon="xmark" />
            </button>
          ) : null}
        </span>
      ))}
    </div>
  );
}

const chipsClass = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.65rem;
`;
const chipClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  max-width: 100%;
  padding: 0.35rem 0.6rem;
  border: 1px solid #cfdef7;
  border-radius: 7px;
  background: #eff5ff;
  color: #385a8d;
  font-size: 1.1rem;
  line-height: 1.5;
  > svg {
    flex-shrink: 0;
  }
  button {
    display: grid;
    place-items: center;
    border: 0;
    background: transparent;
    color: #637b9f;
    padding: 0.3rem;
    min-width: 2.3rem;
    min-height: 2.3rem;
    border-radius: 4px;
    cursor: pointer;
    &:hover:not(:disabled) {
      background: #dce8fc;
    }
    &:disabled {
      opacity: 0.5;
      cursor: default;
    }
  }
`;
const titleClass = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: inherit;
  font-weight: 600;
`;

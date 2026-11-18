import React from 'react';
import { css } from '@emotion/css';

export interface ProfileActionPreviewData {
  kind: 'profile_action';
  title: string;
  before: string[];
  after: string[];
}
export function isProfileActionPreview(
  value: unknown
): value is ProfileActionPreviewData {
  const preview = value as ProfileActionPreviewData | undefined;
  return (
    preview?.kind === 'profile_action' &&
    typeof preview.title === 'string' &&
    Array.isArray(preview.before) &&
    preview.before.every((line) => typeof line === 'string') &&
    Array.isArray(preview.after) &&
    preview.after.every((line) => typeof line === 'string')
  );
}

export default function ProfileActionPreview({
  preview
}: {
  preview: ProfileActionPreviewData;
}) {
  return (
    <section className={previewStyle} aria-label={preview.title}>
      <strong>{preview.title}</strong>
      <div className="values">
        <div>
          <h4>Before</h4>
          {preview.before.map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>
        <div>
          <h4>After</h4>
          {preview.after.map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>
      </div>
    </section>
  );
}

const previewStyle = css`
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 1rem;
  border: 1px solid var(--ui-border, #cbd5e1);
  border-radius: 0.8rem;
  color: var(--chat-text, #2f3747);
  background: var(--chat-bg, #f8fafc);
  font-size: 1.1rem;
  line-height: 1.5;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  .values {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }
  .values > div {
    flex: 1 1 16rem;
    min-width: 0;
  }
  h4 {
    font-size: 1rem;
    margin: 0.8rem 0 0.4rem;
  }
  p {
    margin: 0.3rem 0;
  }
`;

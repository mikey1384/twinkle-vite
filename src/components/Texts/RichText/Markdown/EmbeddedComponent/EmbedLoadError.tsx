import React from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';

export default function EmbedLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className={embedLoadErrorClass}>
      <p role="alert">Couldn’t load this attachment.</p>
      <Button
        color="logoBlue"
        variant="soft"
        aria-label="Retry attachment"
        style={{ minHeight: 44, fontSize: '14px', color: '#334155' }}
        onClick={(event) => {
          event?.stopPropagation();
          onRetry();
        }}
      >
        Retry
      </Button>
    </div>
  );
}

const embedLoadErrorClass = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px 12px;
  width: 100%;
  min-width: 0;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  color: #526176;
  text-align: center;
  p {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
`;

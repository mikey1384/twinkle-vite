import React from 'react';
import { css } from '@emotion/css';
import MathText from './MathText';

// The paper's text: <u>…</u> underlines (grammar, vocabulary, referents),
// <b>…</b> bold (GMAT boldface reasoning) and '* word: 뜻' glosses set small and right-aligned below the passage,
// as the real booklet prints them. Built as elements; never raw HTML.
export default function PaperText({ text }: { text: string }) {
  const lines = String(text || '').split('\n');
  const body = lines.filter((line) => !line.startsWith('* '));
  const glosses = lines.filter((line) => line.startsWith('* '));
  return (
    <>
      {body
        .join('\n')
        .split(/(<u>[\s\S]*?<\/u>|<b>[\s\S]*?<\/b>)/g)
        .map((part, i) =>
          part.startsWith('<u>') && part.endsWith('</u>') ? (
            <u key={i}>{part.slice(3, -4)}</u>
          ) : part.startsWith('<b>') && part.endsWith('</b>') ? (
            <b key={i}>{part.slice(3, -4)}</b>
          ) : (
            <MathText key={i} text={part} />
          )
        )}
      {glosses.length > 0 && (
        <span className={glossesCls}>
          {glosses.map((gloss, i) => (
            <span key={i}>{gloss}</span>
          ))}
        </span>
      )}
    </>
  );
}

const glossesCls = css`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-top: 0.6rem;
  font-size: 1.2rem;
  white-space: normal;
`;

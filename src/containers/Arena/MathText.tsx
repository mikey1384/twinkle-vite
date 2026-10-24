import React from 'react';
import katex from 'katex';
import { css } from '@emotion/css';

// Math on the paper (수능 수학, KMC, 과학탐구): authors write \( … \) inline
// and \[ … \] for a displayed line, never $ (English items print prices).
// KaTeX renders MathML only, as RichText does, so no KaTeX stylesheet or
// fonts are needed; the browser sets it in the paper's serif.
const MATH = /(\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/g;

export function hasMath(text: string) {
  return /\\\(|\\\[/.test(String(text || ''));
}

export default function MathText({ text }: { text: string }) {
  const value = String(text ?? '');
  if (!hasMath(value)) return <>{value}</>;
  return (
    <>
      {value.split(MATH).map((part, i) => {
        const display = part.startsWith('\\[') && part.endsWith('\\]');
        const inline = part.startsWith('\\(') && part.endsWith('\\)');
        if (!display && !inline) {
          return <React.Fragment key={i}>{part}</React.Fragment>;
        }
        const html = renderTex(part.slice(2, -2), display);
        return (
          <span
            key={i}
            className={display ? displayCls : inlineCls}
            // KaTeX output from our own reviewed bank; trust stays off, so
            // no \href or \htmlClass reaches the page
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </>
  );
}

function renderTex(tex: string, display: boolean) {
  try {
    return katex.renderToString(tex, {
      displayMode: display,
      output: 'mathml',
      throwOnError: false,
      trust: false,
      strict: 'ignore'
    });
  } catch {
    return escapeHtml(tex);
  }
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const inlineCls = css`
  math {
    font-size: 1.08em;
  }
`;

const displayCls = css`
  display: block;
  margin: 0.6em 0;
  overflow-x: auto;
  overflow-y: hidden;
  text-align: center;
  math {
    font-size: 1.1em;
  }
`;

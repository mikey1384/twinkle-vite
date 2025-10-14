import React, { useRef, useState } from 'react';
import Code from '~/components/Texts/Code';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth, borderRadius } from '~/constants/css';
import localize from '~/constants/localize';

const copiedLabel = localize('copied');

export default function CopyCode({
  className,
  codeToCopy,
  style
}: {
  className?: string;
  codeToCopy: string;
  style: React.CSSProperties;
}) {
  const [copiedShown, setCopiedShown] = useState(false);
  const codeRef = useRef(null);
  return (
    <div className={className} style={{ position: 'relative', ...style }}>
      <Code
        codeRef={codeRef}
        language="jsx"
        className={css`
          border-radius: ${borderRadius};
          padding: 1.5rem;
          font-size: 1.2rem;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.1rem;
          }
        `}
      >
        {codeToCopy}
      </Code>
      <div
        className={css`
          top: 1rem;
          right: 1rem;
          opacity: 0.8;
          position: absolute;
          &:hover {
            opacity: 1;
          }
          @media (max-width: ${mobileMaxWidth}) {
            margin-left: 0;
      }
    `}
  >
    <Button
      variant="soft"
      tone="raised"
      onClick={() => {
        setCopiedShown(true);
        handleCopyToClipboard();
            setTimeout(() => setCopiedShown(false), 700);
          }}
        >
          <Icon icon="copy" />
          <span style={{ marginLeft: '0.7rem' }}>Copy</span>
        </Button>
        <div
          style={{
            zIndex: 300,
            display: copiedShown ? 'block' : 'none',
            marginTop: '0.2rem',
            right: 0,
            position: 'absolute',
            background: '#fff',
            fontSize: '1.2rem',
            padding: '1rem',
            wordBreak: 'keep-all',
            border: `1px solid ${Color.borderGray()}`
          }}
        >
          {copiedLabel}
        </div>
      </div>
    </div>
  );

  async function handleCopyToClipboard() {
    if (codeRef.current) {
      const range = document.createRange();
      range.selectNode(codeRef.current);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
    }
    try {
      await navigator.clipboard.writeText(codeToCopy);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }
}

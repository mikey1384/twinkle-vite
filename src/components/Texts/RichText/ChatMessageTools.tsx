import React, { useEffect, useRef, useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import AIAudioButton from './AIAudioButton';

export default function ChatMessageTools({ text, contentKey, voice, audioShown }: {
  text: string;
  contentKey: string;
  voice?: string;
  audioShown: boolean;
}) {
  const [copyStatus, setCopyStatus] = useState('');
  const request = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setCopyStatus('');
    return () => {
      request.current += 1;
      if (timer.current !== null) clearTimeout(timer.current);
    };
  }, [contentKey, text]);

  return (
    <div role="group" aria-label="Message reading tools" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', gap: 6, flexWrap: 'wrap', minWidth: 0, marginTop: 8 }}>
      <Button aria-label={copyStatus === 'copied' ? 'Message copied' : 'Copy message'}
        variant="soft" tone="raised" color="darkerGray" onClick={handleCopy}
        style={{ minHeight: 44, minWidth: 44, padding: 10, borderRadius: 12, flexShrink: 0, fontSize: 14 }}>
        <Icon icon={copyStatus === 'copied' ? 'check' : 'copy'} />
      </Button>
      {audioShown && <AIAudioButton chat text={text} contentKey={contentKey} voice={voice} />}
      {copyStatus === 'failed' && <span role="alert" style={{ flexBasis: '100%', fontSize: 13, lineHeight: 1.5, color: '#9f2737', textAlign: 'right' }}>Could not copy this message. Please try again.</span>}
    </div>
  );

  async function handleCopy() {
    const version = ++request.current;
    if (timer.current !== null) clearTimeout(timer.current);
    setCopyStatus('');
    try {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        if (request.current !== version) return;
        const focused = document.activeElement;
        const input = document.createElement('textarea');
        input.value = text;
        input.style.position = 'fixed';
        input.style.opacity = '0';
        try {
          document.body.appendChild(input);
          input.select();
          if (!document.execCommand('copy')) throw new Error('Copy failed');
        } finally {
          input.remove();
          if (focused instanceof HTMLElement && focused.isConnected) focused.focus({ preventScroll: true });
        }
      }
      if (request.current !== version) return;
      setCopyStatus('copied');
      timer.current = setTimeout(() => {
        if (request.current === version) setCopyStatus('');
        timer.current = null;
      }, 2000);
    } catch {
      if (request.current === version) setCopyStatus('failed');
    }
  }
}

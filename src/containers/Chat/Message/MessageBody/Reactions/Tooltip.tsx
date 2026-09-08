import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { css } from '@emotion/css';
import { positionReactionPicker } from '../reactionPickerLayout';
import type { ReactionPerson } from './useReactionPeople';

export default function Tooltip({ id, parentContext, displayedReactedUsers, total, loading }: {
  id: string;
  parentContext: DOMRect;
  displayedReactedUsers: ReactionPerson[];
  total: number;
  loading: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0, ready: false });
  const names = displayedReactedUsers.map((person) => person.username).filter(Boolean);
  const remaining = Math.max(0, total - names.length);
  const text = names.length
    ? `${names.join(names.length === 2 && !remaining ? ' and ' : ', ')}${remaining ? ` and ${remaining} ${remaining === 1 ? 'other' : 'others'}` : ''}`
    : loading ? 'Loading people…' : `${total} ${total === 1 ? 'person' : 'people'} reacted`;

  useLayoutEffect(() => {
    const tooltip = ref.current;
    if (!tooltip) return;
    const next = positionReactionPicker(parentContext, {
      top: 4, left: 4,
      right: document.documentElement.clientWidth - 4,
      bottom: document.documentElement.clientHeight - 4
    }, { width: tooltip.offsetWidth, height: tooltip.offsetHeight + 6 });
    setPosition({ left: parentContext.left + next.left, top: parentContext.top + next.top + (next.above ? 0 : 6), ready: true });
  }, [parentContext, text]);

  return createPortal(
    <div ref={ref} id={id} role="tooltip" translate="no" className={tooltipClass}
      style={{ left: position.left, top: position.top, visibility: position.ready ? 'visible' : 'hidden' }}>
      {text}
    </div>, document.getElementById('outer-layer') || document.body
  );
}

const tooltipClass = css`
  position: fixed;
  z-index: 100000000;
  pointer-events: none;
  max-width: min(280px, calc(100vw - 16px));
  box-sizing: border-box;
  padding: 8px 12px;
  border: 1px solid #dce3ed;
  border-radius: 10px;
  background: #fff;
  color: #253247;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.14);
  font-size: 13px;
  line-height: 1.45;
  font-weight: 500;
  text-align: center;
  overflow-wrap: anywhere;
`;

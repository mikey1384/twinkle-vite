import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import ChatReactionEmoji from '~/components/ChatReactionEmoji';
import {
  chatReactionOptions,
  getChatReaction,
  type ChatReactionKey
} from '~/constants/chatReactions';
import {
  DEFAULT_QUICK_REACTIONS,
  QUICK_REACTION_LIMIT,
  readQuickReactions,
  saveQuickReactions,
  subscribeQuickReactions
} from '~/helpers/quickChatReactions';
import { getReactionPickerBounds, positionReactionPicker } from './reactionPickerLayout';

type Page = 'quick' | 'all' | 'customize';

export default function ReactionPicker({
  id, userId, anchorRef, onReact, onDismiss
}: {
  id: string;
  userId: number;
  anchorRef: React.RefObject<HTMLDivElement | null>;
  onReact: (reaction: string) => void;
  onDismiss: () => void;
}) {
  const [page, setPage] = useState<Page>('quick');
  const [quick, setQuick] = useState(() => readQuickReactions(userId));
  const [draft, setDraft] = useState<readonly ChatReactionKey[]>(quick);
  const [notice, setNotice] = useState('');
  const [position, setPosition] = useState<ReturnType<typeof positionReactionPicker> & { width: number }>();
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousPage = useRef(page);
  const titleId = useId();
  const helpId = useId();
  const customizing = page === 'customize';

  useEffect(() => subscribeQuickReactions(userId, () => {
    setQuick(readQuickReactions(userId));
  }), [userId]);

  useLayoutEffect(() => {
    if (previousPage.current === page) return;
    previousPage.current = page;
    if (panelRef.current) panelRef.current.scrollTop = 0;
    headingRef.current?.focus({ preventScroll: true });
  }, [page]);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const anchor = anchorRef.current;
    if (!panel || !anchor) return;
    function updatePosition() {
      if (!panel || !anchor) return;
      const bounds = getReactionPickerBounds(anchor);
      const next = {
        ...positionReactionPicker(anchor.getBoundingClientRect(), bounds, {
          width: panel.offsetWidth, height: panel.scrollHeight + 8
        }),
        width: Math.max(58, Math.min(224, bounds.right - bounds.left - 8))
      };
      setPosition(previous => previous && Object.keys(next).every(
        key => previous[key as keyof typeof next] === next[key as keyof typeof next]
      ) ? previous : next);
    }
    updatePosition();
    const observer = new ResizeObserver(updatePosition);
    if (contentRef.current) observer.observe(contentRef.current);
    function handleScroll(event: Event) {
      if (!panel || panel.contains(event.target as Node)) return;
      // Native keyboard focus can scroll an ancestor to reveal the trigger
      // or an inline choice. Keep that focused picker alive and refit it.
      if (anchor?.contains(panel.ownerDocument.activeElement)) updatePosition();
      else onDismiss();
    }
    window.addEventListener('resize', updatePosition);
    panel.ownerDocument.addEventListener('scroll', handleScroll, true);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updatePosition);
      panel.ownerDocument.removeEventListener('scroll', handleScroll, true);
    };
  }, [anchorRef, onDismiss, page, notice, draft.length, quick.length]);

  const options = page === 'quick'
    ? quick.map(key => getChatReaction(key)!)
    : chatReactionOptions;

  return (
    <div
      className={popoverClass}
      style={{
        top: position?.top ?? '100%', left: position?.left,
        right: position ? undefined : 0,
        paddingTop: position?.above ? 0 : 6,
        paddingBottom: position?.above ? 6 : 0
      }}
      onKeyDown={event => {
        if (event.key !== 'Escape' || page === 'quick') return;
        event.preventDefault();
        event.stopPropagation();
        setNotice('');
        setPage(customizing ? 'all' : 'quick');
      }}
    >
      <div ref={panelRef} id={id} role="group" aria-label="Choose a reaction"
        className={panelClass} style={{ maxHeight: position?.maxHeight, width: position?.width }}>
        <div ref={contentRef}>
          <header className={headerClass}>
            {page !== 'quick' && <button type="button" className={backClass}
              aria-label={customizing ? 'Cancel customization' : 'Back to quick reactions'}
              onClick={() => { setNotice(''); setPage(customizing ? 'all' : 'quick'); }}>
              <span aria-hidden="true">←</span>
            </button>}
            <h3 ref={headingRef} id={titleId} tabIndex={-1}>
              {customizing ? 'Your quick picks' : page === 'all' ? 'All reactions' : 'Quick reactions'}
            </h3>
          </header>
          <p id={helpId} role="status" className={helpClass}
            style={{ display: customizing || notice ? undefined : 'none' }}>
            {notice || (customizing ? `Choose 1–${QUICK_REACTION_LIMIT}. New picks go last. Saved on this browser.` : '')}
          </p>
          <div className={gridClass} role="group" aria-labelledby={titleId}
            aria-describedby={customizing ? helpId : undefined}>
            {options.map(({ key, label }) => {
              const selected = draft.includes(key);
              return <button key={key} type="button" className={choiceClass}
                aria-label={customizing ? `${label} quick reaction` : `React with ${label}`}
                aria-pressed={customizing ? selected : undefined}
                title={label}
                onClick={event => {
                  event.stopPropagation();
                  if (!customizing) { onReact(key); return; }
                  if (!selected && draft.length >= QUICK_REACTION_LIMIT) {
                    setNotice('Remove one quick pick before adding another.');
                    return;
                  }
                  setNotice('');
                  setDraft(values => selected ? values.filter(value => value !== key) : [...values, key]);
                }}>
                <ChatReactionEmoji reaction={key} size={28} />
                {customizing && selected && <span className={orderClass} aria-hidden="true">{draft.indexOf(key) + 1}</span>}
              </button>;
            })}
          </div>
          <footer className={footerClass}>
            {customizing ? <>
              <p className={countClass}>{draft.length} of {QUICK_REACTION_LIMIT} selected</p>
              <button type="button" className={textButtonClass} onClick={() => {
                setDraft([...DEFAULT_QUICK_REACTIONS]); setNotice('');
              }}>Restore defaults</button>
              <button type="button" className={saveClass} disabled={!draft.length} onClick={() => {
                const persisted = saveQuickReactions(userId, draft);
                setQuick(readQuickReactions(userId));
                setNotice(persisted ? '' : 'Saved for this session. Browser storage is unavailable.');
                setPage('quick');
              }}>Save quick reactions</button>
            </> : <button type="button" className={textButtonClass} onClick={() => {
              setNotice('');
              if (page === 'all') { setDraft([...quick]); setPage('customize'); }
              else setPage('all');
            }}>{page === 'quick' ? 'More reactions' : 'Customize quick reactions'}</button>}
          </footer>
        </div>
      </div>
    </div>
  );
}

const popoverClass = css`
  position: absolute;
  z-index: 5000;
`;
const panelClass = css`
  width: 224px;
  overflow-y: auto;
  overscroll-behavior: contain;
  box-sizing: border-box;
  border: 1px solid #dce3ed;
  border-radius: 12px;
  background: #fff;
  color: #334155;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.16);
  font-family: inherit;
  button:focus-visible { outline: 2px solid #334155; outline-offset: -2px; }
`;
const headerClass = css`
  && {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0;
  margin: 0;
  min-height: 36px;
  padding: 0 10px;
  }
  h3 { margin: 0; font-size: 13px; line-height: 1.4; font-weight: 600; }
  h3:focus { outline: none; }
`;
const gridClass = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(44px, 1fr));
  justify-items: center;
  gap: 4px;
  padding: 0 6px 6px;
`;
const choiceClass = css`
  position: relative;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  touch-action: manipulation;
  &:hover, &:focus-visible { background: #eef2f7; }
  &[aria-pressed='true'] { background: #e7eef8; box-shadow: inset 0 0 0 2px #526a92; }
`;
const orderClass = css`
  position: absolute;
  bottom: 1px;
  right: 2px;
  display: grid;
  place-items: center;
  min-width: 14px;
  height: 14px;
  padding: 0 2px;
  border-radius: 5px;
  background: #334155;
  color: white;
  font-size: 10px;
  line-height: 1;
  font-weight: 700;
`;
const helpClass = css`
  && {
  margin: 0;
  padding: 0 10px 10px;
  font-size: 12px;
  line-height: 1.45;
  color: #526176;
  }
`;
const footerClass = css`
  margin: 0;
  padding: 4px;
  border-top: 1px solid #e2e8f0;
`;
const textButtonClass = css`
  display: block;
  width: 100%;
  min-height: 44px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #334155;
  padding: 6px;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
  cursor: pointer;
  touch-action: manipulation;
  &:hover { background: #eef2f7; }
`;
const backClass = css`
  ${textButtonClass};
  flex-shrink: 0;
  width: 44px;
  margin-left: -8px;
  font-size: 20px;
`;
const saveClass = css`
  ${textButtonClass};
  background: #334155;
  color: white;
  &:hover { background: #1e293b; }
  &:focus-visible { outline-color: white !important; }
  &:disabled { opacity: 0.45; cursor: default; }
`;
const countClass = css`
  && {
  margin: 0;
  padding: 4px 6px;
  font-size: 12px;
  line-height: 1.4;
  color: #526176;
  }
`;

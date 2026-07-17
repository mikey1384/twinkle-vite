import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

export interface SwitcherItem {
  key: string;
  to: string;
  icon: string;
  label: string;
  pinned: boolean;
}

export type SwitcherKind = 'pinned' | 'dynamic' | 'added';

export interface SwitcherSection {
  kind: SwitcherKind;
  title: string;
  items: SwitcherItem[];
}

// how long neighbors take to slide aside, and how long the lifted row takes to
// drop into its new slot once released
const SHIFT_MS = 200;
const SETTLE_MS = 190;
const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

// header/footer chrome mirrors `components/Modal`: no dividers, white header,
// wellGray footer bar. This sheet is fullscreen rather than a modal, so the
// footer also absorbs the bottom safe-area inset.
const overlayClass = css`
  position: fixed;
  inset: 0;
  z-index: 100000;
  background: #fff;
  display: flex;
  flex-direction: column;
  padding-top: env(safe-area-inset-top, 0px);
`;

const headerClass = css`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: #fff;
  .title {
    font-size: 1.6rem;
    font-weight: 600;
    color: ${Color.black()};
  }
  .close {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border: none;
    border-radius: 6px;
    background: none;
    color: ${Color.gray()};
    cursor: pointer;
    transition: all 0.2s ease;
    @media (hover: hover) and (pointer: fine) {
      &:hover {
        background-color: ${Color.borderGray()};
        color: ${Color.black()};
      }
    }
  }
`;

const bodyClass = css`
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 0.5rem 1rem 2rem;
`;

const footerClass = css`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  /* root font-size drops to 8px under 767px, so keep the gap generous */
  padding: 2rem 1.5rem;
  padding-bottom: calc(2rem + env(safe-area-inset-bottom, 0px));
  background-color: ${Color.wellGray(0.3)};
`;

const sectionTitleClass = css`
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${Color.darkGray()};
  padding: 1.4rem 0.6rem 0.4rem;
`;

const emptySectionClass = css`
  padding: 0.6rem 0.9rem 0.4rem;
  color: ${Color.gray()};
  font-size: 1.1rem;
`;

const rowClass = css`
  position: relative;
  display: flex;
  align-items: stretch;
  margin: 0.6rem 0.5rem;
  border: 1px solid ${Color.borderGray()};
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  /* transforms are driven imperatively while dragging; no transform transition
     lives here so clearing the inline styles on drop never animates */
  &.dragging {
    z-index: 2;
    border-color: ${Color.gray()};
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
    transition: box-shadow 140ms ease, border-color 140ms ease;
  }
  .handle {
    flex-shrink: 0;
    width: 4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${Color.gray()};
    font-size: 1.4rem;
    cursor: grab;
    touch-action: none;
    border-right: 1px solid ${Color.borderGray()};
  }
  &.dragging .handle {
    cursor: grabbing;
    color: ${Color.darkGray()};
  }
  .main {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.3rem 1.2rem;
    border: none;
    background: transparent;
    text-decoration: none;
    color: ${Color.black()};
    font-size: 1.3rem;
    font-weight: 600;
    cursor: pointer;
  }
  .main .label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .main .tab-icon {
    flex-shrink: 0;
    color: ${Color.darkGray()};
  }
  .action {
    flex-shrink: 0;
    width: 4.4rem;
    border: none;
    border-left: 1px solid ${Color.borderGray()};
    background: transparent;
    color: ${Color.darkGray()};
    font-size: 1.4rem;
    cursor: pointer;
  }
  .action.pinned {
    color: ${Color.brownOrange()};
  }
  /* dynamic (last-viewed) tabs match the desktop convention: italic label */
  .main .label.dynamic {
    font-style: italic;
  }
  /* dynamic rows carry labeled actions — they exist to surface the long-press
     menu's capabilities to users who never discover the long press */
  .dynamic-action {
    flex-shrink: 0;
    width: 5.6rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    border: none;
    border-left: 1px solid ${Color.borderGray()};
    background: transparent;
    color: ${Color.darkGray()};
    font-size: 1.3rem;
    cursor: pointer;
    span {
      font-size: 1rem;
      font-weight: 600;
    }
  }
  .dynamic-action.pin {
    color: ${Color.brownOrange()};
  }
  .dynamic-action.danger {
    color: ${Color.rose()};
  }
`;

export default function MobileTabSwitcher({
  sections,
  onReorder,
  onTogglePin,
  onRemove,
  onPinDynamic,
  onAddDynamic,
  onDismissDynamic,
  onNavigate,
  onClose
}: {
  sections: SwitcherSection[];
  onReorder: (kind: SwitcherKind, fromIndex: number, toIndex: number) => void;
  onTogglePin: (key: string) => void;
  onRemove: (key: string) => void;
  onPinDynamic: (key: string) => void;
  onAddDynamic: (key: string) => void;
  onDismissDynamic: (key: string) => void;
  onNavigate: () => void;
  onClose: () => void;
}) {
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const dragRef = useRef<{
    kind: SwitcherKind;
    rows: HTMLElement[];
    index: number;
    target: number;
    step: number;
    startY: number;
    minDy: number;
    maxDy: number;
  } | null>(null);
  const cleanupRef = useRef<null | (() => void)>(null);
  const settleTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
      if (settleTimerRef.current) window.clearTimeout(settleTimerRef.current);
    };
  }, []);

  return (
    <div className={overlayClass} role="dialog" aria-label="Your tabs">
      <div className={headerClass}>
        <span className="title">Tabs</span>
        <button
          type="button"
          className="close"
          onClick={onClose}
          aria-label="Close tabs"
        >
          <Icon icon="times" />
        </button>
      </div>
      <div className={bodyClass}>
        {sections.map((section) => (
          <div key={section.kind}>
            <div className={sectionTitleClass}>{section.title}</div>
            {section.items.length === 0 ? (
              <div className={emptySectionClass}>None yet</div>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {section.items.map((item, index) => (
                  <li
                    key={item.key}
                    className={`${rowClass}${
                      draggingKey === item.key ? ' dragging' : ''
                    }`}
                  >
                    {section.kind === 'pinned' && section.items.length > 1 ? (
                      <div
                        className="handle"
                        aria-label="Drag to reorder"
                        onPointerDown={(e) =>
                          handleDragStart(e, section, index)
                        }
                      >
                        <Icon icon="grip-lines" />
                      </div>
                    ) : null}
                    <Link className="main" to={item.to} onClick={onNavigate}>
                      <Icon className="tab-icon" icon={item.icon || 'clone'} />
                      <span
                        className={`label${
                          section.kind === 'dynamic' ? ' dynamic' : ''
                        }`}
                      >
                        {item.label}
                      </span>
                    </Link>
                    {section.kind === 'dynamic' ? (
                      <>
                        <button
                          type="button"
                          className="dynamic-action pin"
                          onClick={() => onPinDynamic(item.key)}
                          aria-label="Pin this page"
                        >
                          {/* outline = pin action; the filled thumbtack is
                              reserved for the already-pinned state */}
                          <Icon icon={['far', 'thumbtack']} />
                          <span>Pin</span>
                        </button>
                        <button
                          type="button"
                          className="dynamic-action"
                          onClick={() => onAddDynamic(item.key)}
                          aria-label="Add as tab"
                        >
                          <Icon icon="plus" />
                          <span>Add</span>
                        </button>
                        <button
                          type="button"
                          className="dynamic-action danger"
                          onClick={() => onDismissDynamic(item.key)}
                          aria-label="Close tab"
                        >
                          <Icon icon="trash-alt" />
                          <span>Close</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className={`action${item.pinned ? ' pinned' : ''}`}
                          onClick={() => onTogglePin(item.key)}
                          aria-label={item.pinned ? 'Unpin tab' : 'Pin tab'}
                        >
                          <Icon
                            icon={
                              item.pinned ? 'thumbtack' : ['far', 'thumbtack']
                            }
                          />
                        </button>
                        <button
                          type="button"
                          className="action"
                          onClick={() => onRemove(item.key)}
                          aria-label="Close tab"
                        >
                          <Icon icon="trash-alt" />
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
      <div className={footerClass}>
        <Button variant="ghost" onClick={onClose} size="lg">
          Close
        </Button>
      </div>
    </div>
  );

  function handleDragStart(
    event: React.PointerEvent<HTMLDivElement>,
    section: SwitcherSection,
    index: number
  ) {
    if (section.kind !== 'pinned') return;
    // ignore new grabs while a previous drop is still settling
    if (dragRef.current || settleTimerRef.current) return;
    event.preventDefault();
    const ul = event.currentTarget.closest('ul');
    if (!ul) return;
    const rows = Array.from(ul.children) as HTMLElement[];
    if (rows.length < 2) return;
    // rows are uniform height, so one step covers row height + collapsed gap
    const step =
      rows[1].getBoundingClientRect().top - rows[0].getBoundingClientRect().top;
    if (!step) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);

    for (let i = 0; i < rows.length; i++) {
      rows[i].style.willChange = 'transform';
      if (i === index) {
        rows[i].style.transform = 'scale(1.02)';
      } else {
        rows[i].style.transition = `transform ${SHIFT_MS}ms ${EASE}`;
      }
    }
    dragRef.current = {
      kind: section.kind,
      rows,
      index,
      target: index,
      step,
      startY: event.clientY,
      minDy: -index * step,
      maxDy: (rows.length - 1 - index) * step
    };
    setDraggingKey(section.items[index].key);

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    cleanupRef.current = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      cleanupRef.current = null;
    };

    function onMove(e: PointerEvent) {
      const drag = dragRef.current;
      if (!drag) return;
      const dy = Math.min(
        drag.maxDy,
        Math.max(drag.minDy, e.clientY - drag.startY)
      );
      drag.target = drag.index + Math.round(dy / drag.step);
      drag.rows[drag.index].style.transform = `translateY(${dy}px) scale(1.02)`;
      for (let i = 0; i < drag.rows.length; i++) {
        if (i === drag.index) continue;
        const shifted =
          i < drag.index && i >= drag.target
            ? drag.step
            : i > drag.index && i <= drag.target
            ? -drag.step
            : 0;
        drag.rows[i].style.transform = `translateY(${shifted}px)`;
      }
    }

    function onUp() {
      cleanupRef.current?.();
      const drag = dragRef.current;
      if (!drag) return;
      dragRef.current = null;

      // drop the lifted row exactly onto the slot it will occupy after the
      // reorder, so committing the new order lands without a visual jump
      const lifted = drag.rows[drag.index];
      lifted.style.transition = `transform ${SETTLE_MS}ms ${EASE}, box-shadow ${SETTLE_MS}ms ease`;
      lifted.style.transform = `translateY(${
        (drag.target - drag.index) * drag.step
      }px) scale(1)`;
      lifted.style.boxShadow = 'none';

      settleTimerRef.current = window.setTimeout(() => {
        settleTimerRef.current = null;
        for (const row of drag.rows) row.removeAttribute('style');
        if (drag.target !== drag.index) {
          onReorder(drag.kind, drag.index, drag.target);
        }
        setDraggingKey(null);
      }, SETTLE_MS);
    }
  }
}

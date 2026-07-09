import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

export interface SwitcherItem {
  key: string;
  to: string;
  icon: string;
  label: string;
  pinned: boolean;
  // pinned/added tabs can be pinned-toggled + removed; defaults cannot
  managed: boolean;
}

export type SwitcherKind = 'pinned' | 'default' | 'added';

export interface SwitcherSection {
  kind: SwitcherKind;
  title: string;
  items: SwitcherItem[];
}

const overlayClass = css`
  position: fixed;
  inset: 0;
  z-index: 100000;
  background: #fff;
  display: flex;
  flex-direction: column;
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
`;

const headerClass = css`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid ${Color.borderGray()};
  .title {
    font-size: 1.6rem;
    font-weight: 800;
    color: ${Color.black()};
  }
  .close {
    border: none;
    background: transparent;
    color: ${Color.darkGray()};
    font-size: 1.9rem;
    cursor: pointer;
    padding: 0.4rem 0.8rem;
  }
`;

const bodyClass = css`
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 0.5rem 1rem 2rem;
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
  display: flex;
  align-items: stretch;
  margin: 0.6rem 0.5rem;
  border: 1px solid ${Color.borderGray()};
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  &.active {
    border-color: ${Color.logoBlue()};
    box-shadow: inset 0 0 0 1px ${Color.logoBlue()};
  }
  &.dragging {
    border-color: ${Color.logoBlue()};
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
    opacity: 0.95;
  }
  &.drop-before {
    box-shadow: inset 0 3px 0 ${Color.logoBlue()};
  }
  &.drop-after {
    box-shadow: inset 0 -3px 0 ${Color.logoBlue()};
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
`;

export default function MobileTabSwitcher({
  sections,
  currentPathKey,
  onReorder,
  onTogglePin,
  onRemove,
  onNavigate,
  onClose
}: {
  sections: SwitcherSection[];
  currentPathKey: string;
  onReorder: (kind: SwitcherKind, fromIndex: number, toIndex: number) => void;
  onTogglePin: (key: string) => void;
  onRemove: (key: string) => void;
  onNavigate: () => void;
  onClose: () => void;
}) {
  const [drag, setDrag] = useState<{
    kind: SwitcherKind;
    index: number;
    overIndex: number;
  } | null>(null);
  // live row rects for the section being dragged (top→bottom), captured on grab
  const rowMidsRef = useRef<number[]>([]);
  const cleanupRef = useRef<null | (() => void)>(null);

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
                      item.to === currentPathKey ? ' active' : ''
                    }${
                      drag &&
                      drag.kind === section.kind &&
                      drag.index === index
                        ? ' dragging'
                        : ''
                    }${dropHint(section.kind, index)}`}
                  >
                    {section.items.length > 1 ? (
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
                      <span className="label">{item.label}</span>
                    </Link>
                    {item.managed ? (
                      <>
                        <button
                          type="button"
                          className={`action${item.pinned ? ' pinned' : ''}`}
                          onClick={() => onTogglePin(item.key)}
                          aria-label={item.pinned ? 'Unpin tab' : 'Pin tab'}
                        >
                          <Icon icon="thumbtack" />
                        </button>
                        <button
                          type="button"
                          className="action"
                          onClick={() => onRemove(item.key)}
                          aria-label="Remove tab"
                        >
                          <Icon icon="trash-alt" />
                        </button>
                      </>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  function dropHint(kind: SwitcherKind, index: number) {
    if (!drag || drag.kind !== kind || drag.overIndex === drag.index) return '';
    if (drag.overIndex !== index) return '';
    return drag.overIndex > drag.index ? ' drop-after' : ' drop-before';
  }

  function handleDragStart(
    event: React.PointerEvent<HTMLDivElement>,
    section: SwitcherSection,
    index: number
  ) {
    event.preventDefault();
    // capture the vertical midpoint of every row in this section's <ul>
    const ul = event.currentTarget.closest('ul');
    if (!ul) return;
    const rows = [...ul.children] as HTMLElement[];
    rowMidsRef.current = rows.map((r) => {
      const rect = r.getBoundingClientRect();
      return rect.top + rect.height / 2;
    });
    setDrag({ kind: section.kind, index, overIndex: index });

    function onMove(e: PointerEvent) {
      const mids = rowMidsRef.current;
      let over = mids.length - 1;
      for (let i = 0; i < mids.length; i++) {
        if (e.clientY < mids[i]) {
          over = i;
          break;
        }
      }
      setDrag((d) => (d ? { ...d, overIndex: over } : d));
    }
    function onUp() {
      cleanupRef.current?.();
      setDrag((d) => {
        if (d && d.overIndex !== d.index) {
          onReorder(d.kind, d.index, d.overIndex);
        }
        return null;
      });
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    cleanupRef.current = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      cleanupRef.current = null;
    };
  }
}

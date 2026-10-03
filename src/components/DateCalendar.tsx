import React, { useEffect, useMemo, useRef, useState } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { Color, mobileMaxWidth } from '~/constants/css';

// An Airbnb-style date picker: a field that opens a calendar panel with two
// months side by side (one on phones). Days outside [min, max] are greyed out
// and cannot be picked; today is marked. Values are 'YYYY-MM-DD' strings
// (local dates, no time zone shifting).
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function toKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function parseKey(key: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key || '');
  return match ? { y: Number(match[1]), m: Number(match[2]) - 1, d: Number(match[3]) } : null;
}

function todayKey() {
  const now = new Date();
  return toKey(now.getFullYear(), now.getMonth(), now.getDate());
}

function prettyDate(key: string) {
  const p = parseKey(key);
  if (!p) return '';
  return new Date(p.y, p.m, p.d).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function Month({
  year,
  month,
  value,
  min,
  max,
  marked,
  onPick
}: {
  year: number;
  month: number;
  value: string;
  min?: string;
  max?: string;
  marked?: Set<string>;
  onPick: (key: string) => void;
}) {
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const today = todayKey();
  const cells: (number | null)[] = [
    ...Array.from({ length: first }, () => null),
    ...Array.from({ length: days }, (_, i) => i + 1)
  ];
  return (
    <div style={{ flex: 1, minWidth: '25rem' }}>
      <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.5rem', marginBottom: '1rem' }}>
        {new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </div>
      <div
        className={css`
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          row-gap: 0.2rem;
          text-align: center;
        `}
      >
        {WEEKDAYS.map((w) => (
          <div key={w} style={{ fontSize: '1.15rem', fontWeight: 700, color: Color.gray(), paddingBottom: '0.6rem' }}>
            {w}
          </div>
        ))}
        {cells.map((day, index) => {
          if (!day) return <div key={`blank-${index}`} />;
          const key = toKey(year, month, day);
          const disabled = (!!min && key < min) || (!!max && key > max);
          const selected = key === value;
          const isToday = key === today;
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              aria-label={prettyDate(key)}
              onClick={() => onPick(key)}
              className={css`
                position: relative;
                width: 4rem;
                height: 4rem;
                margin: 0 auto;
                border-radius: 50%;
                border: 1.5px solid ${selected ? '#222' : 'transparent'};
                background: ${selected ? '#222' : 'transparent'};
                color: ${selected ? '#fff' : disabled ? Color.lightGray() : '#222'};
                font-family: inherit;
                font-size: 1.4rem;
                font-weight: ${isToday || selected ? 700 : 500};
                text-decoration: ${disabled ? 'line-through' : 'none'};
                cursor: ${disabled ? 'default' : 'pointer'};
                &:hover:not(:disabled) {
                  border-color: #222;
                }
                @media (max-width: ${mobileMaxWidth}) {
                  width: 3.8rem;
                  height: 3.8rem;
                }
              `}
            >
              {day}
              {(isToday || marked?.has(key)) && !selected && (
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    bottom: '0.4rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '0.5rem',
                    height: '0.5rem',
                    borderRadius: '50%',
                    background: marked?.has(key) ? Color.green() : '#222'
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function DateCalendar({
  id,
  value,
  onChange,
  min,
  max,
  marked,
  placeholder = 'Pick a date',
  disabled
}: {
  id?: string;
  value: string;
  onChange: (key: string) => void;
  min?: string;
  max?: string;
  // dates to mark with a green dot (e.g. offered time slots)
  marked?: string[];
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const start = parseKey(value) || parseKey(min || '') || parseKey(todayKey())!;
  const [view, setView] = useState({ y: start.y, m: start.m });
  const [twoMonths, setTwoMonths] = useState(
    () => typeof window === 'undefined' || window.innerWidth > 720
  );
  const wrapRef = useRef<HTMLDivElement>(null);
  const markedSet = useMemo(() => new Set(marked || []), [marked]);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onResize = () => setTwoMonths(window.innerWidth > 720);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  const shift = (delta: number) =>
    setView(({ y, m }) => {
      const next = new Date(y, m + delta, 1);
      return { y: next.getFullYear(), m: next.getMonth() };
    });
  const minMonth = parseKey(min || '');
  const atStart = !!minMonth && view.y === minMonth.y && view.m <= minMonth.m;
  const second = new Date(view.y, view.m + 1, 1);

  return (
    <div ref={wrapRef} style={{ position: 'relative', maxWidth: '100%' }}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={css`
          display: inline-flex;
          align-items: center;
          gap: 0.8rem;
          min-width: 22rem;
          max-width: 100%;
          padding: 1rem 1.4rem;
          border-radius: 1rem;
          border: 1.5px solid ${open ? '#222' : 'var(--ui-border)'};
          background: #fff;
          font-family: inherit;
          font-size: 1.5rem;
          text-align: left;
          cursor: ${disabled ? 'default' : 'pointer'};
          color: ${value ? '#222' : Color.gray()};
        `}
      >
        <Icon icon="calendar-day" style={{ color: Color.logoBlue() }} />
        {value ? prettyDate(value) : placeholder}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Choose a date"
          className={css`
            position: absolute;
            z-index: 30;
            top: calc(100% + 0.8rem);
            left: 0;
            background: #fff;
            border-radius: 1.6rem;
            box-shadow: 0 0.8rem 2.8rem rgba(0, 0, 0, 0.18);
            padding: 2rem 2.2rem 1.6rem;
            width: ${twoMonths ? '62rem' : 'min(34rem, 92vw)'};
            @media (max-width: ${mobileMaxWidth}) {
              position: fixed;
              left: 50%;
              top: 50%;
              transform: translate(-50%, -50%);
              padding: 1.6rem;
            }
          `}
        >
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              aria-label="Previous month"
              disabled={atStart}
              onClick={() => shift(-1)}
              className={arrowClass}
              style={{ left: 0, opacity: atStart ? 0.3 : 1 }}
            >
              <Icon icon="chevron-left" />
            </button>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => shift(1)}
              className={arrowClass}
              style={{ right: 0 }}
            >
              <Icon icon="chevron-right" />
            </button>
            <div style={{ display: 'flex', gap: '3rem' }}>
              <Month
                year={view.y}
                month={view.m}
                value={value}
                min={min}
                max={max}
                marked={markedSet}
                onPick={(key) => {
                  onChange(key);
                  setOpen(false);
                }}
              />
              {twoMonths && (
                <Month
                  year={second.getFullYear()}
                  month={second.getMonth()}
                  value={value}
                  min={min}
                  max={max}
                  marked={markedSet}
                  onPick={(key) => {
                    onChange(key);
                    setOpen(false);
                  }}
                />
              )}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.2rem' }}>
            <button
              type="button"
              onClick={() => onChange('')}
              style={{ border: 0, background: 'none', textDecoration: 'underline', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '1.35rem' }}
            >
              Clear date
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{ border: 0, borderRadius: '0.8rem', background: '#222', color: '#fff', padding: '0.8rem 1.6rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '1.35rem' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const arrowClass = css`
  position: absolute;
  top: -0.4rem;
  width: 3.2rem;
  height: 3.2rem;
  border-radius: 50%;
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 1.4rem;
  &:hover:not(:disabled) {
    background: ${Color.highlightGray()};
  }
`;

import React, { useMemo, useState } from 'react';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import {
  bodyClass,
  errorClass,
  fieldClass,
  linkButtonClass,
  noteClass,
  primaryButtonClass,
  selectClass,
  stepClass,
  titleClass
} from './stepStyles';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

// After an invite's Continue: when were you born? Under 14 needs a parent's
// or guardian's approval (Mikey, 2026-09-27); the server checks it again.
export default function AgeCheck({
  initialYear,
  initialMonth,
  onBack,
  onContinue
}: {
  initialYear?: number;
  initialMonth?: number;
  onBack: () => void;
  onContinue: (birth: { birthYear: number; birthMonth: number }) => void;
}) {
  const [year, setYear] = useState(initialYear ? String(initialYear) : '');
  const [month, setMonth] = useState(initialMonth ? String(initialMonth) : '');
  const years = useMemo(() => {
    const thisYear = new Date().getUTCFullYear();
    return Array.from({ length: 100 }, (_, index) => thisYear - index);
  }, []);
  const isFuture = useMemo(() => {
    if (!year || !month) return false;
    const now = new Date();
    return (
      Number(year) * 12 + Number(month) >
      now.getUTCFullYear() * 12 + now.getUTCMonth() + 1
    );
  }, [year, month]);
  const ready = !!year && !!month && !isFuture;

  return (
    <div className={stepClass}>
      <div className={titleClass}>When were you born?</div>
      <p className={bodyClass}>
        Everyone who joins by invitation answers this. If you're under 14,
        we'll ask a parent or guardian to say yes first.
      </p>
      <div
        className={css`
          display: flex;
          gap: 1rem;
          width: 100%;
          max-width: 36rem;
          margin-top: 0.4rem;
          @media (max-width: ${mobileMaxWidth}) {
            flex-direction: column;
          }
        `}
      >
        <div className={fieldClass}>
          <label htmlFor="signup-birth-month">Month</label>
          <select
            id="signup-birth-month"
            autoFocus
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className={selectClass}
          >
            <option value="">Choose a month</option>
            {MONTHS.map((name, index) => (
              <option key={name} value={index + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className={fieldClass}>
          <label htmlFor="signup-birth-year">Year</label>
          <select
            id="signup-birth-year"
            value={year}
            onChange={(event) => setYear(event.target.value)}
            className={selectClass}
          >
            <option value="">Choose a year</option>
            {years.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </div>
      {isFuture && (
        <p role="alert" className={errorClass}>
          That month hasn't happened yet. Please check the year.
        </p>
      )}
      <button
        type="button"
        disabled={!ready}
        onClick={handleContinue}
        className={primaryButtonClass}
      >
        Continue
      </button>
      <p className={noteClass}>
        We only use this to know whether a parent or guardian needs to approve.
      </p>
      <button type="button" onClick={onBack} className={linkButtonClass}>
        Back
      </button>
    </div>
  );

  function handleContinue() {
    if (!ready) return;
    onContinue({ birthYear: Number(year), birthMonth: Number(month) });
  }
}

import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import { Link } from 'react-router-dom';
import { Color } from '~/constants/css';
import type { AdminCrewRow, QuestStepKey } from './types';
import { crewPath } from './DirectoryCard';

const STEP_LABEL: Record<QuestStepKey, string> = {
  crew: '1 Crew',
  plan: '2 Plan',
  grownUp: '3 Grown-up',
  film: '4 Meet & film',
  review: '5 Review'
};

const DAY = 86400;

// Admin only: every live crew, most stuck first, whether or not anything was
// submitted, so the bottlenecks are visible without opening each crew.
export default function AdminCrewBoard({ crews }: { crews: AdminCrewRow[] }) {
  const now = Math.floor(Date.now() / 1000);
  const rows = useMemo(
    () =>
      [...crews]
        .map((crew) => ({ ...crew, idleDays: Math.max(0, Math.floor((now - crew.updatedAt) / DAY)) }))
        .sort((a, b) => b.idleDays - a.idleDays),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [crews]
  );
  const stuck = rows.filter((crew) => crew.idleDays >= 3).length;
  return (
    <div style={{ marginTop: '1rem' }}>
      <b style={{ fontSize: '1.5rem' }}>
        All live crews: {rows.length}
        {stuck ? ` · ${stuck} idle for 3+ days` : ''}
      </b>
      {rows.length === 0 ? (
        <p style={{ fontSize: '1.4rem', color: Color.darkerGray() }}>No live crews right now.</p>
      ) : (
        <ul
          className={css`
            list-style: none;
            margin: 0.8rem 0 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            gap: 0.6rem;
          `}
        >
          {rows.map((crew) => {
            const blocked = crew.idleDays >= 7 ? Color.red() : crew.idleDays >= 3 ? Color.orange() : Color.darkGray();
            return (
              <li
                key={crew.crewId}
                className={css`
                  display: flex;
                  gap: 1rem;
                  align-items: center;
                  flex-wrap: wrap;
                  padding: 0.8rem 1rem;
                  border: 1px solid var(--ui-border);
                  border-radius: 1rem;
                  background: #fff;
                  font-size: 1.35rem;
                `}
              >
                <span
                  style={{
                    padding: '0.1rem 0.8rem',
                    borderRadius: 999,
                    background: Color.logoBlue(0.1),
                    color: Color.darkBlue(),
                    fontWeight: 700,
                    fontSize: '1.2rem'
                  }}
                >
                  {crew.currentStep ? STEP_LABEL[crew.currentStep] : 'Done'}
                </span>
                <div style={{ flex: 1, minWidth: '18rem' }}>
                  <b>{crew.displayName}</b> <span style={{ color: Color.darkGray() }}>#{crew.crewId}</span>
                  <span style={{ color: Color.darkerGray() }}>
                    {' '}
                    · {crew.members.length} student{crew.members.length === 1 ? '' : 's'}
                    {crew.parents.asked ? ` · parents ${crew.parents.approved}/${crew.parents.asked}` : ''}
                    {crew.branchesToVerify.length ? ` · ${crew.branchesToVerify.length} branch to verify` : ''}
                  </span>
                  <div style={{ color: Color.darkerGray() }}>{crew.blocking.replace(/^Next:\s*/, '')}</div>
                </div>
                <span style={{ color: blocked, fontWeight: 700 }}>
                  {crew.idleDays === 0 ? 'active today' : `idle ${crew.idleDays}d`}
                </span>
                <Link to={crewPath(crew.crewId)}>Open</Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

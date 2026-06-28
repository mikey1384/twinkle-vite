import React from 'react';
import { Link } from 'react-router-dom';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { formatTime } from '../../AiCosts/helpers/formatters';
import { subsectionHeaderClass } from '../../AiCosts/styles';
import type { CohortAnalytics } from './index';

export default function GrowthPanel({
  growing,
  dormant
}: {
  growing: CohortAnalytics['growing'];
  dormant: CohortAnalytics['dormant'];
}) {
  return (
    <div
      className={css`
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.6rem;
        padding: 0 1.6rem 1.6rem;
        @media (max-width: ${mobileMaxWidth}) {
          grid-template-columns: 1fr;
        }
      `}
    >
      <div>
        <h3 className={subsectionHeaderClass}>Growing</h3>
        {growing.length === 0 ? (
          <p className={mutedClass}>No notable users grew this period.</p>
        ) : (
          <ul className={listClass}>
            {growing.map((row) => (
              <li key={row.userId}>
                <Link to={`/management/notable-users/${row.userId}`}>
                  {row.username}
                </Link>
                <span style={{ color: Color.green(), fontWeight: 700 }}>
                  +{row.deltaActiveDays} active days
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <h3 className={subsectionHeaderClass}>Dormant (30d+)</h3>
        {dormant.length === 0 ? (
          <p className={mutedClass}>No dormant notable users.</p>
        ) : (
          <ul className={listClass}>
            {dormant.map((row) => (
              <li key={row.userId}>
                <Link to={`/management/notable-users/${row.userId}`}>
                  {row.username}
                </Link>
                <span style={{ color: Color.rose() }}>
                  {row.lastActive
                    ? `last seen ${formatTime(row.lastActive)}`
                    : 'no activity on record'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const listClass = css`
  list-style: none;
  margin: 0;
  padding: 0;
  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.7rem 0;
    border-bottom: 1px solid ${Color.borderGray()};
    font-size: 1.4rem;
  }
  li a {
    font-weight: 700;
  }
`;

const mutedClass = css`
  color: ${Color.gray()};
  font-size: 1.4rem;
  padding: 0.7rem 0;
`;

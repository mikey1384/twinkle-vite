import React, { useEffect, useMemo, useState } from 'react';
import { css } from '@emotion/css';
import ErrorBoundary from '~/components/ErrorBoundary';
import SectionPanel from '~/components/SectionPanel';
import Table from '../Table';
import { useAppContext } from '~/contexts';
import { Color } from '~/constants/css';
import { apprenticeSentViaLabel } from '~/constants/apprentice';
import { timeSince } from '~/helpers/timeStampHelpers';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import ApprenticeApplicationModal from './ApprenticeApplicationModal';

export interface ApprenticeApplicantRow {
  userId: number;
  username: string;
  revision: number;
  firstSubmittedAt: number | null;
  lastSubmittedAt: number | null;
  lastChanged: string[];
  observations: number;
  lastObservedAt: number | null;
  // '' when the member sent it; else Zero or Ciel sent it for them
  lastSentVia?: string;
}

// Mikey's Apprentice applications, for Mikey alone (the API answers nobody
// else). Read-only: reading decides nothing, and nobody is notified. Drafts
// a member never sent stay private to them.
export default function ApprenticeApplications() {
  const loadApprenticeApplications = useAppContext(
    (v) => v.requestHelpers.loadApprenticeApplications
  );
  const [data, setData] = useState<{
    applicants: ApprenticeApplicantRow[];
    unsentDrafts: number;
  } | null>(null);
  const [openUserId, setOpenUserId] = useState<number | null>(null);

  useEffect(() => {
    let canceled = false;
    loadApprenticeApplications()
      .then((result: any) => {
        if (!canceled) {
          setData({
            applicants: Array.isArray(result?.applicants)
              ? result.applicants
              : [],
            unsentDrafts: Number(result?.unsentDrafts || 0)
          });
        }
      })
      .catch(() => {
        if (!canceled) setData({ applicants: [], unsentDrafts: 0 });
      });
    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ErrorBoundary componentPath="Management/Main/ApprenticeApplications">
      <ApprenticeApplicationsTable
        loaded={!!data}
        applicants={data?.applicants || []}
        unsentDrafts={data?.unsentDrafts || 0}
        onOpen={setOpenUserId}
      />
      {openUserId && (
        <ApprenticeApplicationModal
          userId={openUserId}
          onHide={() => setOpenUserId(null)}
        />
      )}
    </ErrorBoundary>
  );
}

export function ApprenticeApplicationsTable({
  loaded,
  applicants,
  unsentDrafts,
  onOpen
}: {
  loaded: boolean;
  applicants: ApprenticeApplicantRow[];
  unsentDrafts: number;
  onOpen: (userId: number) => void;
}) {
  const tableHeaderRole = useRoleColor('tableHeader', { fallback: 'logoBlue' });
  const tableHeaderColor = useMemo(
    () => tableHeaderRole.colorKey || 'logoBlue',
    [tableHeaderRole.colorKey]
  );
  return (
    <SectionPanel
      title="Apprentice Applications"
      isEmpty={applicants.length === 0}
      emptyMessage={
        unsentDrafts
          ? `No applications sent yet (${unsentDrafts} unsent draft${
              unsentDrafts === 1 ? '' : 's'
            })`
          : 'No applications yet'
      }
      loaded={loaded}
      innerStyle={{ paddingLeft: 0, paddingRight: 0 }}
    >
      <Table
        color={tableHeaderColor}
        columns={`
          minmax(12rem, 1fr)
          minmax(8rem, 0.6fr)
          minmax(12rem, 1fr)
          minmax(18rem, 1.6fr)
          minmax(10rem, 0.8fr)
        `}
      >
        <thead>
          <tr>
            <th>User</th>
            <th>Versions</th>
            <th>Last sent</th>
            <th>Changed last time</th>
            <th>Observations</th>
          </tr>
        </thead>
        <tbody>
          {applicants.map((row) => (
            <tr
              key={row.userId}
              onClick={() => onOpen(row.userId)}
              className={rowClass}
            >
              <td
                className={css`
                  font-weight: bold;
                  font-size: 1.6rem;
                `}
              >
                {row.username}
              </td>
              <td>{row.revision}</td>
              <td>
                {row.lastSubmittedAt ? timeSince(row.lastSubmittedAt) : '-'}
                {apprenticeSentViaLabel(row.lastSentVia)
                  ? ` · ${apprenticeSentViaLabel(row.lastSentVia)}`
                  : ''}
              </td>
              <td>{row.lastChanged.join(', ') || '-'}</td>
              <td>{row.observations || '-'}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      {unsentDrafts > 0 && applicants.length > 0 && (
        <div className={noteClass}>
          {unsentDrafts} more member{unsentDrafts === 1 ? ' has' : 's have'} an
          unsent draft (private until sent).
        </div>
      )}
    </SectionPanel>
  );
}

const rowClass = css`
  cursor: pointer;
  td {
    display: flex;
    align-items: center;
  }
`;

const noteClass = css`
  margin: 1.4rem 1.6rem 0;
  font-size: 1.3rem;
  color: ${Color.gray()};
`;

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import InvalidPage from '~/components/InvalidPage';
import SectionPanel from '~/components/SectionPanel';
import { mobileMaxWidth } from '~/constants/css';
import { ADMIN_MANAGEMENT_LEVEL } from '~/constants/defaultValues';
import {
  useAppContext,
  useKeyContext,
  useManagementContext
} from '~/contexts';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import { rangeClass } from '../AiCosts/styles';
import Table from '../Table';
import AddNotableUserModal from './AddNotableUserModal';
import Overview from './Overview';

interface NotableUser {
  id: number;
  userId: number;
  username: string;
  storedUsername?: string;
  sourceSheet: string;
  sourceRowNumber: number;
  sourceSortOrder: number;
  sourceSchoolLevel: string;
  sourceUsername: string;
  sourceUserIdRaw?: string | null;
  realName?: string | null;
  currentRealName?: string | null;
  branch?: string | null;
  className?: string | null;
  parentsPhone?: string | null;
  parentsEmail?: string | null;
  meetupRecommendation?: string | null;
  notableCategory?: string | null;
  reason?: string | null;
  additionalInfo?: string | null;
  questionNote?: string | null;
  resolutionMethod: string;
}

const tableColumns = `
  minmax(8rem, 0.7fr)
  minmax(15rem, 1.1fr)
  minmax(15rem, 1.1fr)
  minmax(11rem, 0.8fr)
  minmax(20rem, 1.4fr)
  minmax(18rem, 1.2fr)
  minmax(18rem, 1.2fr)
  minmax(14rem, 1fr)
  minmax(18rem, 1.2fr)
  minmax(18rem, 1.2fr)
  minmax(24rem, 1.4fr)
  minmax(24rem, 1.4fr)
  minmax(44rem, 2fr)
  minmax(38rem, 1.8fr)
  minmax(28rem, 1.4fr)
  minmax(20rem, 1.1fr)
`;

export default function NotableUsers() {
  const [addModalShown, setAddModalShown] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [notableUsers, setNotableUsers] = useState<NotableUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const view = useManagementContext((v) => v.state.notableUsersView);
  const onSetNotableUsersView = useManagementContext(
    (v) => v.actions.onSetNotableUsersView
  );
  const managementLevel = useKeyContext((v) => v.myState.managementLevel);
  const loadNotableUsers = useAppContext(
    (v) => v.requestHelpers.loadNotableUsers
  );
  const loadNotableUsersCSV = useAppContext(
    (v) => v.requestHelpers.loadNotableUsersCSV
  );
  const addNotableUser = useAppContext((v) => v.requestHelpers.addNotableUser);
  const tableHeaderRole = useRoleColor('tableHeader', { fallback: 'logoBlue' });
  const tableHeaderColor = tableHeaderRole.colorKey || 'logoBlue';
  const canView = managementLevel >= ADMIN_MANAGEMENT_LEVEL;
  const filteredNotableUsers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return notableUsers;
    return notableUsers.filter((row) =>
      [
        row.userId,
        row.username,
        row.sourceUsername,
        row.sourceSchoolLevel,
        row.notableCategory,
        row.realName,
        row.currentRealName,
        row.branch,
        row.className,
        row.parentsPhone,
        row.parentsEmail,
        row.meetupRecommendation,
        row.reason,
        row.additionalInfo,
        row.questionNote,
        row.sourceSheet
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [notableUsers, searchQuery]);

  useEffect(() => {
    if (!canView) return;
    let canceled = false;
    void init();

    async function init() {
      setLoaded(false);
      setError('');
      try {
        const rows = await loadNotableUsers();
        if (canceled) return;
        setNotableUsers(sortNotableUsers(rows || []));
      } catch (loadError: any) {
        if (canceled) return;
        setError(loadError?.message || 'Failed to load notable users');
      } finally {
        if (!canceled) {
          setLoaded(true);
        }
      }
    }

    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView]);

  if (!canView) {
    return (
      <InvalidPage
        title="Admin only"
        text="Notable Users is only available to admins."
      />
    );
  }

  return (
    <ErrorBoundary componentPath="Management/NotableUsers">
      <div
        className={css`
          display: flex;
          justify-content: flex-end;
          margin-bottom: 1rem;
        `}
      >
        <div className={rangeClass}>
          <button
            className={view === 'overview' ? 'active' : ''}
            onClick={() => onSetNotableUsersView('overview')}
          >
            Overview
          </button>
          <button
            className={view === 'roster' ? 'active' : ''}
            onClick={() => onSetNotableUsersView('roster')}
          >
            Roster
          </button>
        </div>
      </div>
      {view === 'overview' && <Overview />}
      {view === 'roster' && (
        <SectionPanel
          title="Notable Users"
        isEmpty={!error && filteredNotableUsers.length === 0}
        emptyMessage="No notable users found"
        searchPlaceholder="Search Notable Users"
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
        loaded={loaded}
        innerStyle={{ paddingLeft: 0, paddingRight: 0 }}
        button={
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button
              color="darkerGray"
              variant="solid"
              tone="raised"
              disabled={!loaded}
              onClick={handleOpenAddModal}
            >
              <Icon icon="plus" />
              <span style={{ marginLeft: '0.7rem' }}>Add User</span>
            </Button>
            <Button
              color="darkerGray"
              variant="solid"
              tone="raised"
              loading={downloading}
              onClick={handleDownloadCSV}
            >
              <Icon icon="file-csv" />
            </Button>
          </div>
        }
      >
        {!!error && (
          <div
            className={css`
              padding: 1.2rem 2rem;
              font-size: 1.2rem;
              color: #b91c1c;
            `}
          >
            {error}
          </div>
        )}
        <div
          className={css`
            width: 100%;
            overflow-x: auto;
            @media (max-width: ${mobileMaxWidth}) {
              border-top: 1px solid var(--ui-border);
            }
          `}
        >
          <Table
            color={tableHeaderColor}
            columns={tableColumns}
            headerFontSize="1.3rem"
            style={{ minWidth: '365rem' }}
          >
            <thead>
              <tr>
                <th>User ID</th>
                <th>Username</th>
                <th>Source Username</th>
                <th>Level</th>
                <th>Category</th>
                <th>Real Name</th>
                <th>Current Name</th>
                <th>Branch</th>
                <th>Class</th>
                <th>Parent Phone</th>
                <th>Parent Email</th>
                <th>Meetup</th>
                <th>Reason</th>
                <th>Additional Info</th>
                <th>Question Note</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotableUsers.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link to={`/management/notable-users/${row.userId}`}>
                      {row.userId}
                    </Link>
                  </td>
                  <td style={{ fontWeight: 'bold' }}>
                    <Link to={`/users/${row.username}`}>{row.username}</Link>
                  </td>
                  <Cell value={row.sourceUsername} />
                  <Cell value={row.sourceSchoolLevel} />
                  <Cell value={row.notableCategory} />
                  <Cell value={row.realName} />
                  <Cell value={row.currentRealName} />
                  <Cell value={row.branch} />
                  <Cell value={row.className} />
                  <Cell value={row.parentsPhone} />
                  <Cell value={row.parentsEmail} />
                  <Cell value={row.meetupRecommendation} />
                  <Cell value={row.reason} />
                  <Cell value={row.additionalInfo} />
                  <Cell value={row.questionNote} />
                  <Cell value={`${row.sourceSheet} #${row.sourceRowNumber}`} />
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </SectionPanel>
      )}
      {addModalShown && (
        <AddNotableUserModal
          existingUserIds={notableUsers.map((row) => row.userId)}
          onHide={() => setAddModalShown(false)}
          onSubmit={handleAddUser}
        />
      )}
    </ErrorBoundary>
  );

  async function handleAddUser(userId: number) {
    const { notableUser } = (await addNotableUser(userId)) || {};
    if (!notableUser) {
      throw new Error('Failed to add notable user');
    }
    if (notableUser) {
      setNotableUsers((rows) =>
        sortNotableUsers(
          rows
            .filter(
              (row) =>
                row.id !== notableUser.id && row.userId !== notableUser.userId
            )
            .concat(notableUser)
        )
      );
    }
  }

  function handleOpenAddModal() {
    if (!loaded) return;
    setAddModalShown(true);
  }

  async function handleDownloadCSV() {
    setDownloading(true);
    try {
      const response = await loadNotableUsersCSV();
      const blob =
        response instanceof Blob
          ? response
          : new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'notable-users.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (downloadError) {
      console.error('Error downloading notable users CSV:', downloadError);
    } finally {
      setDownloading(false);
    }
  }
}

function Cell({ value }: { value?: string | number | null }) {
  const text = String(value ?? '');
  return <td title={text}>{text}</td>;
}

function sortNotableUsers(rows: NotableUser[]) {
  return [...rows].sort((a, b) => {
    if (a.sourceSortOrder !== b.sourceSortOrder) {
      return a.sourceSortOrder - b.sourceSortOrder;
    }
    return a.id - b.id;
  });
}

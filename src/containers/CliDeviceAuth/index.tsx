import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { css } from '@emotion/css';
import API_URL from '~/constants/URL';
import Button from '~/components/Button';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useAppContext, useKeyContext } from '~/contexts';

interface CliDeviceSession {
  userCode: string;
  clientName: string;
  scopes: string[];
  status: 'pending' | 'approved' | 'completed' | 'expired' | string;
  expiresAt: number | null;
}

export default function CliDeviceAuth() {
  const auth = useAppContext((v) => v.requestHelpers.auth);
  const authRef = useRef(auth);
  const onOpenSigninModal = useAppContext(
    (v) => v.user.actions.onOpenSigninModal
  );
  const userId = useKeyContext((v) => v.myState.userId);
  const [codeInput, setCodeInput] = useState(() => readCodeFromLocation());
  const [approving, setApproving] = useState(false);
  const [status, setStatus] = useState('');
  const [session, setSession] = useState<CliDeviceSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const compactCode = useMemo(() => compactCliCode(codeInput), [codeInput]);
  const normalizedCode = useMemo(
    () => formatCompactCliCode(compactCode),
    [compactCode]
  );
  const hasCompleteCode = compactCode.length === 8;
  const canApprove =
    !!userId &&
    hasCompleteCode &&
    session?.status === 'pending' &&
    !sessionLoading &&
    !approving;

  useEffect(() => {
    authRef.current = auth;
  });

  useEffect(() => {
    let cancelled = false;

    setSession(null);
    setSessionError('');
    if (!userId || !hasCompleteCode) {
      setSessionLoading(false);
      return;
    }

    setSessionLoading(true);
    axios
      .get(`${API_URL}/cli/device/session`, {
        ...authRef.current(),
        params: { code: normalizedCode }
      })
      .then((response) => {
        if (cancelled) return;
        setSession(response.data || null);
      })
      .catch((error: any) => {
        if (cancelled) return;
        setSessionError(
          error?.response?.data?.error ||
            error?.message ||
            'This code could not be loaded.'
        );
      })
      .finally(() => {
        if (cancelled) return;
        setSessionLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hasCompleteCode, normalizedCode, userId]);

  return (
    <main className={pageClass}>
      <section className={panelClass}>
        <div className={eyebrowClass}>Twinkle CLI</div>
        <h1 className={titleClass}>Connect Lumine</h1>
        <p className={bodyClass}>
          Review the code from your terminal before granting this CLI access to
          your Twinkle builds.
        </p>
        <label className={labelClass}>
          Code
          <input
            className={inputClass}
            value={codeInput}
            onChange={(event) => {
              setCodeInput(normalizeCliCode(event.target.value));
              setStatus('');
            }}
            placeholder="ABCD-EFGH"
            autoCapitalize="characters"
            autoComplete="one-time-code"
          />
        </label>
        {userId && hasCompleteCode ? (
          <CliSessionDetails
            session={session}
            loading={sessionLoading}
            error={sessionError}
          />
        ) : null}
        {userId ? (
          <Button
            variant="solid"
            color="green"
            disabled={!canApprove}
            onClick={handleApprove}
          >
            {approving ? 'Approving...' : 'Approve'}
          </Button>
        ) : (
          <Button variant="solid" color="blue" onClick={onOpenSigninModal}>
            Sign in to approve
          </Button>
        )}
        {status && <p className={statusClass}>{status}</p>}
      </section>
    </main>
  );

  async function handleApprove() {
    if (!canApprove) return;
    setApproving(true);
    setStatus('');
    try {
      await axios.post(
        `${API_URL}/cli/device/approve`,
        { userCode: normalizedCode },
        auth()
      );
      setStatus('Approved. You can return to your terminal.');
      setSession((current) =>
        current ? { ...current, status: 'approved' } : current
      );
    } catch (error: any) {
      setStatus(
        error?.response?.data?.error ||
          error?.message ||
          'This code could not be approved.'
      );
    } finally {
      setApproving(false);
    }
  }
}

function CliSessionDetails({
  session,
  loading,
  error
}: {
  session: CliDeviceSession | null;
  loading: boolean;
  error: string;
}) {
  if (loading) {
    return <p className={statusClass}>Loading CLI request...</p>;
  }
  if (error) {
    return <p className={errorClass}>{error}</p>;
  }
  if (!session) return null;

  return (
    <div className={detailsClass}>
      <div className={detailRowClass}>
        <span>Client</span>
        <strong>{session.clientName || 'Lumine CLI'}</strong>
      </div>
      <div className={detailRowClass}>
        <span>Code</span>
        <strong>{session.userCode}</strong>
      </div>
      <div className={detailBlockClass}>
        <span>Permissions</span>
        <ul className={scopeListClass}>
          {session.scopes.map((scope) => (
            <li key={scope}>
              <strong>{scope}</strong>
              <span>{scopeDescription(scope)}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className={detailRowClass}>
        <span>Status</span>
        <strong>{formatSessionStatus(session.status)}</strong>
      </div>
      {session.expiresAt ? (
        <div className={detailRowClass}>
          <span>Expires</span>
          <strong>{formatUnixTime(session.expiresAt)}</strong>
        </div>
      ) : null}
    </div>
  );
}

function readCodeFromLocation() {
  try {
    return normalizeCliCode(
      new URLSearchParams(window.location.search).get('code')
    );
  } catch {
    return '';
  }
}

function compactCliCode(value: unknown) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8);
}

function normalizeCliCode(value: unknown) {
  return formatCompactCliCode(compactCliCode(value));
}

function formatCompactCliCode(compact: string) {
  if (compact.length <= 4) return compact;
  return `${compact.slice(0, 4)}-${compact.slice(4)}`;
}

function scopeDescription(scope: string) {
  switch (scope) {
    case 'build:read':
      return 'Read the build and saved project files.';
    case 'build:check':
      return 'Run launch readiness checks.';
    case 'build:publish':
      return 'Publish saved build changes.';
    default:
      return 'Requested CLI permission.';
  }
}

function formatSessionStatus(status: string) {
  switch (status) {
    case 'pending':
      return 'Waiting for approval';
    case 'approved':
      return 'Approved';
    case 'completed':
      return 'Already used';
    case 'expired':
      return 'Expired';
    default:
      return status || 'Unknown';
  }
}

function formatUnixTime(value: number) {
  const date = new Date(value * 1000);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString();
}

const pageClass = css`
  min-height: 100%;
  display: grid;
  place-items: center;
  padding: 4rem 1.25rem;
  background: ${Color.wellGray()};
`;

const panelClass = css`
  width: min(100%, 34rem);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 2rem;
  border: 1px solid ${Color.borderGray()};
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);

  @media (max-width: ${mobileMaxWidth}) {
    padding: 1.5rem;
  }
`;

const eyebrowClass = css`
  color: ${Color.logoBlue()};
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
`;

const titleClass = css`
  margin: 0;
  color: ${Color.black()};
  font-size: 2rem;
  line-height: 1.15;
`;

const bodyClass = css`
  margin: 0;
  color: ${Color.darkerGray()};
  font-size: 1.1rem;
  line-height: 1.5;
`;

const labelClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  color: ${Color.black()};
  font-size: 1.1rem;
  font-weight: 600;
`;

const inputClass = css`
  width: 100%;
  min-height: 3rem;
  padding: 0.6rem 0.8rem;
  border: 1px solid ${Color.borderGray()};
  border-radius: 6px;
  color: ${Color.black()};
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
`;

const statusClass = css`
  margin: 0;
  color: ${Color.black()};
  font-size: 1.1rem;
  line-height: 1.4;
`;

const errorClass = css`
  margin: 0;
  color: ${Color.redOrange()};
  font-size: 1.1rem;
  line-height: 1.4;
`;

const detailsClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1rem;
  border: 1px solid ${Color.borderGray()};
  border-radius: 8px;
  background: ${Color.wellGray()};
`;

const detailRowClass = css`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  color: ${Color.darkerGray()};
  font-size: 1.1rem;
  line-height: 1.4;

  strong {
    color: ${Color.black()};
    text-align: right;
  }
`;

const detailBlockClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  color: ${Color.darkerGray()};
  font-size: 1.1rem;
  line-height: 1.4;
`;

const scopeListClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  margin: 0;
  padding-left: 1.2rem;
  color: ${Color.black()};
  font-size: 1.1rem;
  line-height: 1.4;

  li {
    padding-left: 0.1rem;
  }

  strong,
  span {
    display: block;
  }

  span {
    color: ${Color.darkerGray()};
  }
`;

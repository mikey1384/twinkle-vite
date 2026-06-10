import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { css } from '@emotion/css';
import API_URL from '~/constants/URL';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { useAppContext, useKeyContext } from '~/contexts';

interface CliDeviceSession {
  userCode: string;
  clientName: string;
  scopes: string[];
  status: 'pending' | 'approved' | 'completed' | 'expired' | string;
  expiresAt: number | null;
}

const displayFontFamily =
  "'Trebuchet MS', 'Comic Sans MS', 'Segoe UI', 'Arial Rounded MT Bold', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

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
  const isApproved = session?.status === 'approved';

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
        <div className={headerClass}>
          <span className={eyebrowClass}>
            <Icon icon="sparkles" />
            Twinkle Build
          </span>
          <h1 className={titleClass}>Connect Lumine</h1>
          <p className={bodyClass}>
            {isApproved
              ? 'Lumine is now connected to your terminal.'
              : 'Make sure this code matches the one in your terminal.'}
          </p>
        </div>
        <label className={labelClass}>
          Code from your terminal
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
        <p className={safetyNoteClass}>
          <Icon icon="lock" />
          Only approve if you started Lumine yourself.
        </p>
        {isApproved ? (
          <div className={successClass} role="status">
            <span className={successIconClass}>
              <Icon icon="check" />
            </span>
            <div>
              <h2>You&rsquo;re connected!</h2>
              <p>
                All done &mdash; you can close this tab and go back to your
                terminal.
              </p>
            </div>
          </div>
        ) : (
          <>
            {userId && hasCompleteCode ? (
              <CliSessionDetails
                session={session}
                loading={sessionLoading}
                error={sessionError}
              />
            ) : null}
            <div className={buttonWrapClass}>
              {userId ? (
                <GameCTAButton
                  variant="success"
                  size="lg"
                  shiny={canApprove}
                  loading={approving}
                  style={{ width: '100%' }}
                  disabled={!canApprove}
                  onClick={handleApprove}
                >
                  {approving ? 'Approving...' : 'Approve Lumine'}
                </GameCTAButton>
              ) : (
                <GameCTAButton
                  variant="logoBlue"
                  size="lg"
                  shiny
                  style={{ width: '100%' }}
                  onClick={onOpenSigninModal}
                >
                  Sign in to approve
                </GameCTAButton>
              )}
            </div>
            {status && <p className={statusClass}>{status}</p>}
          </>
        )}
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
      setStatus('');
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
    return <p className={statusClass}>Checking your code...</p>;
  }
  if (error) {
    return <p className={errorClass}>{error}</p>;
  }
  if (!session) return null;

  const permissionItems = getPracticalPermissionItems(session.scopes);
  const showPermissionItems =
    session.status === 'pending' && permissionItems.length > 0;

  return (
    <div className={detailsClass}>
      <div className={requestHeaderClass}>
        <span className={requestIconClass}>
          <Icon icon="wand-magic-sparkles" />
        </span>
        <div className={requestTextClass}>
          <h2>{getFriendlyClientName(session.clientName)} wants to connect.</h2>
          <p>{sessionStatusMessage(session.status)}</p>
        </div>
      </div>
      {showPermissionItems ? (
        <ul className={permissionListClass}>
          {permissionItems.map((item) => (
            <li key={item}>
              <Icon icon="check" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function getFriendlyClientName(clientName: string) {
  const trimmed = String(clientName || '').trim();
  if (!trimmed || trimmed.toLowerCase() === 'lumine cli') {
    return 'Lumine';
  }
  return trimmed;
}

function getPracticalPermissionItems(scopes: string[] | null | undefined) {
  const scopeSet = new Set(Array.isArray(scopes) ? scopes : []);
  const items: string[] = [];

  if (scopeSet.has('build:read')) {
    items.push('Open your saved Build projects.');
  }
  if (scopeSet.has('build:write')) {
    items.push('Save changes to your Build projects.');
  }
  if (scopeSet.has('build:check') && scopeSet.has('build:publish')) {
    items.push('Check and launch your Build when you choose.');
  } else if (scopeSet.has('build:check')) {
    items.push('Check whether a Build is ready to launch.');
  } else if (scopeSet.has('build:publish')) {
    items.push('Launch your Build when you choose.');
  }
  if (scopeSet.has('build:sdk')) {
    items.push(
      "Read and update your Build's app data the way the app does, " +
        'including saved app data, shared app data, and app notifications.'
    );
  }

  return items;
}

function sessionStatusMessage(status: string) {
  switch (status) {
    case 'pending':
      return 'After you approve, Lumine can help in these ways.';
    case 'approved':
      return 'Approved. You can go back to your terminal.';
    case 'completed':
      return 'This code was already used. Start Lumine again to get a new code.';
    case 'expired':
      return 'This code expired. Start Lumine again to get a new code.';
    default:
      return 'Start Lumine again if this does not look right.';
  }
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

const pageClass = css`
  min-height: 100%;
  display: grid;
  place-items: center;
  padding: 4rem 1.25rem;
  background:
    linear-gradient(
      180deg,
      rgba(248, 251, 255, 0.98),
      rgba(255, 248, 252, 0.9)
    ),
    #f8fbff;
`;

const panelClass = css`
  width: min(100%, 36rem);
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  padding: 2rem;
  border: 1px solid rgba(65, 140, 235, 0.2);
  border-radius: ${borderRadius};
  background: #fff;
  box-shadow: 0 14px 35px rgba(15, 23, 42, 0.1);

  @media (max-width: ${mobileMaxWidth}) {
    padding: 1.4rem;
  }
`;

const headerClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
`;

const eyebrowClass = css`
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.45rem 0.9rem;
  border: 1px solid rgba(65, 140, 235, 0.28);
  border-radius: 999px;
  background: rgba(65, 140, 235, 0.14);
  color: #1d4ed8;
  font-family: ${displayFontFamily};
  font-size: 1.1rem;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
`;

const titleClass = css`
  margin: 0;
  color: #172033;
  font-family: ${displayFontFamily};
  font-size: 2.65rem;
  font-weight: 900;
  line-height: 1.08;

  @media (max-width: ${mobileMaxWidth}) {
    font-size: 2.25rem;
  }
`;

const bodyClass = css`
  max-width: 32rem;
  margin: 0;
  color: #344055;
  font-size: 1.15rem;
  line-height: 1.6;
`;

const labelClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  color: #172033;
  font-size: 1.1rem;
  font-weight: 800;
`;

const inputClass = css`
  width: 100%;
  min-height: 3.4rem;
  padding: 0.75rem 0.95rem;
  border: 1px solid rgba(65, 140, 235, 0.28);
  border-radius: ${borderRadius};
  background: #fff;
  color: #172033;
  font-size: 1.55rem;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;

  &:focus {
    outline: none;
    border-color: #418ceb;
    box-shadow: 0 0 0 3px rgba(65, 140, 235, 0.14);
  }
`;

const safetyNoteClass = css`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin: -0.35rem 0 0;
  color: #4b5563;
  font-size: 1.1rem;
  line-height: 1.4;

  svg {
    color: ${Color.logoBlue()};
  }
`;

const buttonWrapClass = css`
  display: flex;
`;

const statusClass = css`
  margin: 0;
  color: #172033;
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
  gap: 0.95rem;
  padding-top: 0.2rem;
`;

const successClass = css`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.9rem;
  align-items: center;
  padding: 1.1rem 1.15rem;
  border-radius: ${borderRadius};
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.42);

  h2 {
    margin: 0;
    color: #14532d;
    font-size: 1.4rem;
    font-weight: 900;
    line-height: 1.2;
  }

  p {
    margin: 0.35rem 0 0;
    color: #166534;
    font-size: 1.15rem;
    line-height: 1.45;
  }
`;

const successIconClass = css`
  width: 2.9rem;
  height: 2.9rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #22c55e;
  color: #fff;
  font-size: 1.4rem;
`;

const requestHeaderClass = css`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.85rem;
  align-items: center;
  padding: 0.9rem 0;
  border-top: 1px solid rgba(65, 140, 235, 0.16);
  border-bottom: 1px solid rgba(65, 140, 235, 0.16);
`;

const requestIconClass = css`
  width: 2.7rem;
  height: 2.7rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(255, 213, 100, 0.26);
  color: #d97706;
  font-size: 1.2rem;
`;

const requestTextClass = css`
  min-width: 0;

  h2 {
    margin: 0;
    color: #172033;
    font-size: 1.2rem;
    font-weight: 900;
    line-height: 1.25;
  }

  p {
    margin: 0.25rem 0 0;
    color: #556070;
    font-size: 1.1rem;
    line-height: 1.35;
  }
`;

const permissionListClass = css`
  display: grid;
  gap: 0.65rem;
  margin: 0;
  padding: 0;
  list-style: none;
  color: #172033;
  font-size: 1.1rem;
  line-height: 1.4;

  li {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 0.55rem;
    align-items: start;
  }

  svg {
    margin-top: 0.15rem;
    color: ${Color.green()};
  }
`;

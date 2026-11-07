import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import { useAppContext } from '~/contexts';
import Icon from '~/components/Icon';
import { ARENA } from './theme';

// The preference also applies to Boss Records, so it stays accessible after
// the Weekly League and Rising panels were removed from the Arena entrance.
export default function BoardVisibility() {
  const loadArenaLeague = useAppContext((v) => v.requestHelpers.loadArenaLeague);
  const setArenaLeagueHidden = useAppContext(
    (v) => v.requestHelpers.setArenaLeagueHidden
  );
  const [hidden, setHidden] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let alive = true;
    setError('');
    loadArenaLeague()
      .then((data: { hidden: boolean }) => {
        if (typeof data?.hidden !== 'boolean') throw new Error('Missing preference');
        if (alive) setHidden(data.hidden);
      })
      .catch(() => {
        if (alive) setError('Your board visibility could not be loaded.');
      });
    return () => {
      alive = false;
    };
    // Request helpers are provided by the application context.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retry]);

  return (
    <div className={wrapCls}>
      {hidden === null ? (
        <p>
          {!error && <><Icon icon="spinner" pulse />{' '}</>}
          {error || 'Loading your board visibility…'}
          {error && (
            <button type="button" onClick={() => setRetry((value) => value + 1)}>
              Try again
            </button>
          )}
        </p>
      ) : (
        <>
          <label>
            <input
              type="checkbox"
              checked={hidden}
              disabled={saving}
              onChange={(event) => handleHidden(event.target.checked)}
            />
            Hide me from other hunters&apos; boards (you still see your own rank)
            {/* the box keeps the saved value until the server answers; the
                spinner's slot is always there, so the text never reflows */}
            <span className={savingSlotCls} role="status">
              {saving && (
                <>
                  <Icon icon="spinner" pulse />
                  <span className={hiddenTextCls}>Saving</span>
                </>
              )}
            </span>
          </label>
          {error && <p role="alert">{error}</p>}
        </>
      )}
    </div>
  );

  async function handleHidden(nextHidden: boolean) {
    setSaving(true);
    setError('');
    try {
      const data = await setArenaLeagueHidden(nextHidden);
      if (typeof data?.hidden !== 'boolean') throw new Error('Missing preference');
      setHidden(data.hidden);
    } catch {
      setError('Your board visibility could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  }
}

const savingSlotCls = css`
  flex: none;
  width: 1.4em;
  margin-top: 0.15rem;
`;

// read by screen readers, not shown
const hiddenTextCls = css`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
`;

const wrapCls = css`
  padding: 1.2rem 1.4rem;
  border-top: 2px solid ${ARENA.line};
  font-size: 1.3rem;
  color: ${ARENA.inkSoft};
  label {
    display: flex;
    align-items: flex-start;
    gap: 0.8rem;
    cursor: pointer;
  }
  input {
    flex-shrink: 0;
    margin-top: 0.25rem;
    accent-color: ${ARENA.ink};
  }
  p {
    margin: 0.6rem 0 0;
  }
  button {
    margin-left: 0.8rem;
    color: ${ARENA.ink};
    text-decoration: underline;
    cursor: pointer;
  }
`;

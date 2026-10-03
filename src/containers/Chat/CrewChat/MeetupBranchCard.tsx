import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { Color } from '~/constants/css';

interface BranchView {
  id: number;
  name: string;
  status: 'pending' | 'official' | 'rejected';
  mergedIntoId: number;
  mergedIntoName: string;
  firstUsername: string;
  firstCrewId: number;
  members: number;
}

// The owner alert for a branch name nobody has entered before (Zero's DM,
// rootType 'meetupBranch'): decide whether it is a real branch. Official = real;
// not real = the members' branch text is cleared and their crew chat is told;
// merge = same as an official branch (members are rewritten to its name).
export default function MeetupBranchCard({ branchId }: { branchId: number }) {
  const loadMeetupBranch = useAppContext((v) => v.requestHelpers.loadMeetupBranch);
  const loadMeetupBranchChoices = useAppContext(
    (v) => v.requestHelpers.loadMeetupBranchChoices
  );
  const reviewMeetupBranch = useAppContext((v) => v.requestHelpers.reviewMeetupBranch);
  const [branch, setBranch] = useState<BranchView | null>(null);
  const [official, setOfficial] = useState<{ id: number; name: string }[]>([]);
  const [mergeInto, setMergeInto] = useState(0);
  const [changing, setChanging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([loadMeetupBranch(branchId), loadMeetupBranchChoices()])
      .then(([loaded, choices]) => {
        if (!active) return;
        setBranch(loaded?.branch || null);
        setOfficial(choices?.official || []);
      })
      .catch(() => {
        if (active) setBranch(null);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  if (!branch) return null;
  const decided = branch.status !== 'pending' && !changing;
  const mergeTargets = official.filter((item) => item.id !== branch.id);
  return (
    <div
      className={css`
        margin-top: 0.5rem;
        padding: 1.2rem 1.4rem;
        border: 1px solid ${Color.logoBlue(0.35)};
        background: ${Color.logoBlue(0.05)};
        border-radius: 8px;
        max-width: 46rem;
        font-size: 1.35rem;
        color: ${Color.black()};
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
      `}
    >
      <div>
        <Icon icon="location-dot" style={{ color: Color.logoBlue(), marginRight: '0.6rem' }} />
        Branch to check: <b>&quot;{branch.name}&quot;</b>
        <div style={{ color: Color.darkerGray(), fontSize: '1.25rem', marginTop: '0.2rem' }}>
          {branch.members} member{branch.members === 1 ? '' : 's'} use it · first entered by{' '}
          {branch.firstUsername || 'a member'}
          {branch.firstCrewId ? ` in crew #${branch.firstCrewId}` : ''}
        </div>
      </div>
      {decided ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <b
            style={{
              color: branch.status === 'official' ? Color.green() : Color.red()
            }}
          >
            {branch.status === 'official'
              ? 'Official branch'
              : branch.mergedIntoName
              ? `Merged into "${branch.mergedIntoName}"`
              : 'Marked not real'}
          </b>
          <Button size="sm" variant="ghost" color="darkGray" onClick={() => setChanging(true)}>
            Change decision
          </Button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <Button size="sm" color="green" disabled={busy} onClick={() => review('official')}>
              <Icon icon="check" style={{ marginRight: '0.5rem' }} />
              Make official
            </Button>
            <Button size="sm" variant="soft" color="red" disabled={busy} onClick={() => review('reject')}>
              Not a real branch
            </Button>
          </div>
          {mergeTargets.length > 0 && (
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ color: Color.darkerGray() }}>or same as</span>
              <select
                aria-label="Official branch to merge into"
                value={mergeInto}
                onChange={(event) => setMergeInto(Number(event.target.value))}
                className={css`
                  font-family: inherit;
                  font-size: 1.3rem;
                  padding: 0.4rem 0.6rem;
                  border-radius: 0.6rem;
                  border: 1px solid var(--ui-border);
                `}
              >
                <option value={0}>Pick a branch</option>
                {mergeTargets.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="soft"
                color="logoBlue"
                disabled={busy || !mergeInto}
                onClick={() => review('merge')}
              >
                Merge
              </Button>
            </div>
          )}
        </>
      )}
      {error && <div style={{ color: Color.red(), fontSize: '1.25rem' }}>{error}</div>}
    </div>
  );

  async function review(action: 'official' | 'reject' | 'merge') {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const result = await reviewMeetupBranch({
        branchId,
        action,
        mergeIntoId: action === 'merge' ? mergeInto : undefined
      });
      setBranch(result.branch);
      setChanging(false);
      if (action === 'official') {
        const choices = await loadMeetupBranchChoices();
        setOfficial(choices?.official || []);
      }
    } catch (err: any) {
      setError(err?.message || 'Could not save that decision.');
    } finally {
      setBusy(false);
    }
  }
}

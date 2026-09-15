import React, { useEffect, useMemo, useState } from 'react';
import { css } from '@emotion/css';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { mobileMaxWidth } from '~/constants/css';
import { buildLineDiffHunks, diffLines } from '~/helpers/lineDiff';
import type { RewardProposalDiff } from './types';
import RewardProposalEarnings from './RewardProposalEarnings';

// What the admin changed, file by file, the way a branch suggestion shows
// it: removed lines in red, added lines in green, a little context around
// each change. Read-only; the decision buttons live on the caller.
export default function RewardProposalDiffModal({
  title,
  load,
  onClose,
  footer
}: {
  title?: string;
  load: () => Promise<RewardProposalDiff>;
  onClose: () => void;
  footer?: React.ReactNode | ((diff: RewardProposalDiff) => React.ReactNode);
}) {
  const [diff, setDiff] = useState<RewardProposalDiff | null>(null);
  const [error, setError] = useState('');
  const [selectedPath, setSelectedPath] = useState('');

  useEffect(() => {
    let active = true;
    load()
      .then((result) => {
        if (!active) return;
        setDiff(result);
        setSelectedPath(result?.files?.[0]?.path || '');
      })
      .catch((err: any) => {
        if (active)
          setError(err?.message || 'Couldn’t load the changes right now.');
      });
    return () => {
      active = false;
    };
    // The loader is stable for the modal's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = useMemo(
    () => diff?.files.find((file) => file.path === selectedPath) || null,
    [diff, selectedPath]
  );

  return (
    <Modal
      modalKey="BuildRewardProposalDiff"
      isOpen
      size="lg"
      onClose={onClose}
      title={title || 'What the admin changed'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          {typeof footer === 'function' ? (diff ? footer(diff) : null) : footer}
        </>
      }
    >
      <div className={bodyClass}>
        {error && <p role="alert">{error}</p>}
        {!diff && !error && <p className={mutedClass}>Loading the changes…</p>}
        {diff ? <RewardProposalEarnings rewards={diff.rewards} /> : null}
        {diff && diff.note ? (
          <section className={noteClass}>
            <Icon icon="comment" />
            <div>
              <strong>The admin’s note</strong>
              <p>{diff.note}</p>
            </div>
          </section>
        ) : null}
        {diff && diff.files.length === 0 ? (
          <p className={mutedClass}>No file changes were offered.</p>
        ) : null}
        {diff && diff.files.length > 0 ? (
          <div className={layoutClass}>
            <ul className={fileListClass} aria-label="Changed files">
              {diff.files.map((file) => (
                <li key={file.path}>
                  <button
                    type="button"
                    aria-current={file.path === selectedPath}
                    onClick={() => setSelectedPath(file.path)}
                  >
                    <span
                      className={statusDotClass}
                      data-status={file.status}
                    />
                    <span className={pathClass}>{file.path}</span>
                    <small>{labelFor(file.status)}</small>
                  </button>
                </li>
              ))}
            </ul>
            {selected ? <FileDiff key={selected.path} file={selected} /> : null}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

function labelFor(status: string) {
  if (status === 'added') return 'new file';
  if (status === 'deleted') return 'removed';
  return 'changed';
}

function FileDiff({ file }: { file: RewardProposalDiff['files'][number] }) {
  const { hunks, truncated, added, removed } = useMemo(() => {
    const result = diffLines(file.before || '', file.after || '');
    return {
      hunks: buildLineDiffHunks(result.entries),
      truncated: result.truncated,
      added: result.entries.filter((entry) => entry.op === 'add').length,
      removed: result.entries.filter((entry) => entry.op === 'remove').length
    };
  }, [file]);
  return (
    <section className={diffClass} aria-label={`Changes in ${file.path}`}>
      <header>
        <strong>{file.path}</strong>
        <span>
          <span className={addedCountClass}>+{added}</span>{' '}
          <span className={removedCountClass}>−{removed}</span>
        </span>
      </header>
      {truncated ? (
        <p className={mutedClass}>
          This file is large, so it is shown as fully replaced.
        </p>
      ) : null}
      <div className={scrollClass}>
        {hunks.map((hunk, index) => (
          <pre key={index} className={hunkClass}>
            <div className={hunkHeaderClass}>
              @@ line {hunk.beforeStart} → {hunk.afterStart}
            </div>
            {hunk.entries.map((entry, entryIndex) => (
              <div key={entryIndex} className={lineClass} data-op={entry.op}>
                <span className={gutterClass}>{entry.before ?? ''}</span>
                <span className={gutterClass}>{entry.after ?? ''}</span>
                <span className={signClass}>
                  {entry.op === 'add' ? '+' : entry.op === 'remove' ? '−' : ' '}
                </span>
                <span className={codeClass}>{entry.text || ' '}</span>
              </div>
            ))}
          </pre>
        ))}
        {hunks.length === 0 ? (
          <p className={mutedClass}>No line changes.</p>
        ) : null}
      </div>
    </section>
  );
}

const bodyClass = css`
  display: grid;
  gap: 1.2rem;
  color: #172033;
  font-size: 1.4rem;
  line-height: 1.5;
  p {
    margin: 0;
  }
  [role='alert'] {
    color: #b42318;
    font-weight: 700;
  }
`;

const mutedClass = css`
  color: #64748b;
  font-size: 1.25rem;
`;

const noteClass = css`
  display: flex;
  gap: 0.9rem;
  align-items: flex-start;
  padding: 1rem 1.2rem;
  border-radius: 12px;
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  > svg {
    color: #2563eb;
    margin-top: 0.3rem;
    flex: none;
  }
  strong {
    display: block;
    color: #1e3a8a;
  }
  p {
    color: #1f2937;
    white-space: pre-wrap;
  }
`;

const layoutClass = css`
  display: grid;
  grid-template-columns: minmax(16rem, 22rem) minmax(0, 1fr);
  gap: 1rem;
  min-height: 0;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
  }
`;

const fileListClass = css`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.4rem;
  align-content: start;
  button {
    width: 100%;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 0.8rem;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #172033;
    font: inherit;
    text-align: left;
    cursor: pointer;
    &[aria-current='true'] {
      border-color: #2563eb;
      background: #eff6ff;
    }
    small {
      color: #64748b;
      font-size: 1.05rem;
      white-space: nowrap;
    }
  }
  @media (max-width: ${mobileMaxWidth}) {
    grid-auto-flow: column;
    grid-auto-columns: minmax(14rem, 1fr);
    overflow-x: auto;
  }
`;

const statusDotClass = css`
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  background: #f59e0b;
  &[data-status='added'] {
    background: #16a34a;
  }
  &[data-status='deleted'] {
    background: #dc2626;
  }
`;

const pathClass = css`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 1.2rem;
`;

const diffClass = css`
  min-width: 0;
  display: grid;
  gap: 0.6rem;
  align-content: start;
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 1.2rem;
    strong {
      overflow-wrap: anywhere;
    }
  }
`;

const addedCountClass = css`
  color: #15803d;
  font-weight: 800;
`;

const removedCountClass = css`
  color: #b91c1c;
  font-weight: 800;
`;

const scrollClass = css`
  max-height: 60vh;
  overflow: auto;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
`;

const hunkClass = css`
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 1.15rem;
  line-height: 1.5;
  white-space: pre;
`;

const hunkHeaderClass = css`
  padding: 0.3rem 0.8rem;
  background: #f1f5f9;
  color: #475569;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
`;

const lineClass = css`
  display: grid;
  grid-template-columns: 4rem 4rem 1.4rem minmax(0, 1fr);
  &[data-op='add'] {
    background: #ecfdf5;
    color: #14532d;
  }
  &[data-op='remove'] {
    background: #fef2f2;
    color: #7f1d1d;
  }
`;

const gutterClass = css`
  text-align: right;
  padding-right: 0.5rem;
  color: #94a3b8;
  user-select: none;
`;

const signClass = css`
  text-align: center;
  user-select: none;
`;

const codeClass = css`
  padding-right: 1rem;
  white-space: pre;
`;

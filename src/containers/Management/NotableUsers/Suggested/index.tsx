import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import SectionPanel from '~/components/SectionPanel';
import { mobileMaxWidth } from '~/constants/css';
import { useAppContext } from '~/contexts';
import { rangeClass } from '../../AiCosts/styles';

// Notable candidates ranked by the site (twinkle-api notableScoring.ts), by
// Mikey's four kinds of valuable person. Facts, not verdicts: character is
// shown as the daily run's notes, never scored. Mikey adds or dismisses.

type Archetype = 'builder' | 'adapter' | 'thinker' | 'community';
const ARCHETYPES: { key: Archetype; label: string; hint: string }[] = [
  { key: 'builder', label: 'Builders', hint: 'will to create and improve' },
  { key: 'adapter', label: 'Adapters', hint: 'pick up new tools endlessly' },
  { key: 'thinker', label: 'Thinkers', hint: 'deep thought, puzzles, logic' },
  { key: 'community', label: 'Community', hint: 'draw people together' }
];

interface CharacterNote {
  id: number;
  polarity: 'positive' | 'negative' | 'neutral';
  trait: string;
  note: string;
  evidenceUrl: string | null;
  at: number;
}

interface Member {
  rank?: number;
  userId: number;
  username: string;
  activeDays: number;
  bestArchetype: Archetype | null;
  scores: Record<Archetype, number>;
  trend: Record<Archetype, number> | null;
  facts: Record<Archetype, string[]>;
  characterNotes: CharacterNote[];
  resurfaced?: { note: string; dismissedAt: number } | null;
  reason?: string;
}

const pillRowClass = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  justify-content: center;
  margin-bottom: 1.2rem;
`;

const cardClass = css`
  border: 1px solid var(--ui-border);
  border-radius: 10px;
  padding: 1.2rem 1.4rem;
  margin-bottom: 1rem;
  background: #fff;
`;

const barTrackClass = css`
  flex: 1;
  height: 0.8rem;
  border-radius: 4px;
  background: #eef1f5;
  overflow: hidden;
`;

export default function Suggested({
  onAdd
}: {
  onAdd: (userId: number) => Promise<void>;
}) {
  const loadNotableSuggestions = useAppContext(
    (v) => v.requestHelpers.loadNotableSuggestions
  );
  const loadNotableReview = useAppContext(
    (v) => v.requestHelpers.loadNotableReview
  );
  const dismissNotableSuggestion = useAppContext(
    (v) => v.requestHelpers.dismissNotableSuggestion
  );
  const [mode, setMode] = useState<'suggested' | 'review'>('suggested');
  const [archetype, setArchetype] = useState<Archetype | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [meta, setMeta] = useState<{ computedAt: number | null; qualified: number; scored: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyUserId, setBusyUserId] = useState(0);
  const [dismissing, setDismissing] = useState<{ userId: number; note: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    (mode === 'review' ? loadNotableReview() : loadNotableSuggestions({ archetype, limit: 30 }))
      .then((data: any) => {
        if (cancelled) return;
        setMembers(mode === 'review' ? data?.notables || [] : data?.suggestions || []);
        setMeta(
          mode === 'review'
            ? null
            : { computedAt: data?.computedAt || null, qualified: data?.qualified || 0, scored: data?.scored || 0 }
        );
      })
      .catch(() => !cancelled && setError('Could not load the suggestions.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, archetype]);

  return (
    <SectionPanel
      title={mode === 'review' ? 'Notables to review' : 'Suggested notables'}
      loaded={!loading}
      isEmpty={!loading && !error && members.length === 0}
      emptyMessage={
        mode === 'review'
          ? 'Every notable is still active and strong.'
          : 'No suggestions yet. The daily run refreshes the scores each morning.'
      }
    >
      <div className={pillRowClass}>
        <div className={rangeClass}>
          <button className={mode === 'suggested' ? 'active' : ''} onClick={() => setMode('suggested')}>
            Suggested
          </button>
          <button className={mode === 'review' ? 'active' : ''} onClick={() => setMode('review')}>
            Review current
          </button>
        </div>
        {mode === 'suggested' && (
          <div className={rangeClass}>
            <button className={!archetype ? 'active' : ''} onClick={() => setArchetype(null)}>
              All
            </button>
            {ARCHETYPES.map((a) => (
              <button
                key={a.key}
                title={a.hint}
                className={archetype === a.key ? 'active' : ''}
                onClick={() => setArchetype(a.key)}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {meta && (
        <p style={{ textAlign: 'center', color: 'var(--ui-text-subtle, #666)', marginTop: 0 }}>
          {meta.qualified} of {meta.scored} active members qualify
          {meta.computedAt ? ` · scores from ${new Date(meta.computedAt * 1000).toLocaleString()}` : ''}. Facts,
          not verdicts: read their posts before adding.
        </p>
      )}
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      {members.map((member) => (
        <div key={member.userId} className={cardClass}>
          <div
            className={css`
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 1rem;
              flex-wrap: wrap;
            `}
          >
            <div style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>
              {member.rank ? `${member.rank}. ` : ''}
              <Link to={`/users/${member.username}`}>{member.username}</Link>
              <span style={{ fontWeight: 'normal', fontSize: '1.3rem', marginLeft: '0.8rem', color: '#777' }}>
                active {member.activeDays} of 60 days
              </span>
            </div>
            {mode === 'suggested' && (
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <Button
                  color="green"
                  variant="soft"
                  tone="raised"
                  disabled={busyUserId === member.userId}
                  onClick={() => handleAdd(member.userId)}
                >
                  Add
                </Button>
                <Button
                  color="darkerGray"
                  variant="soft"
                  tone="raised"
                  disabled={busyUserId === member.userId}
                  onClick={() => setDismissing({ userId: member.userId, note: '' })}
                >
                  Not now
                </Button>
              </div>
            )}
          </div>
          {member.reason && (
            <div style={{ color: '#b45309', marginTop: '0.4rem' }}>Why listed: {member.reason}</div>
          )}
          {member.resurfaced && (
            <div style={{ color: '#2563eb', marginTop: '0.4rem' }}>
              Suggested again: you said “{member.resurfaced.note}”, and their score has risen since.
            </div>
          )}
          <div
            className={css`
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 0.8rem 2rem;
              margin-top: 1rem;
              @media (max-width: ${mobileMaxWidth}) {
                grid-template-columns: 1fr;
              }
            `}
          >
            {ARCHETYPES.map((a) => {
              const score = member.scores?.[a.key] || 0;
              const change = member.trend?.[a.key];
              return (
                <div key={a.key}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <span style={{ width: '9rem', fontWeight: member.bestArchetype === a.key ? 'bold' : 'normal' }}>
                      {a.label}
                    </span>
                    <div className={barTrackClass}>
                      <div
                        style={{
                          width: `${Math.max(0, Math.min(100, score))}%`,
                          height: '100%',
                          background: member.bestArchetype === a.key ? '#2563eb' : '#93c5fd'
                        }}
                      />
                    </div>
                    <span style={{ width: '6rem', textAlign: 'right' }}>
                      {Math.round(score)}
                      {typeof change === 'number' && Math.round(change) !== 0 && (
                        <span style={{ color: change > 0 ? '#16a34a' : '#dc2626', marginLeft: '0.3rem' }}>
                          {change > 0 ? '+' : ''}
                          {Math.round(change)}
                        </span>
                      )}
                    </span>
                  </div>
                  {(member.facts?.[a.key] || []).length > 0 && (
                    <div style={{ fontSize: '1.25rem', color: '#555', marginTop: '0.2rem' }}>
                      {member.facts[a.key].join(' · ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {member.characterNotes?.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontWeight: 'bold', fontSize: '1.3rem' }}>Character notes (from the daily run)</div>
              {member.characterNotes.map((note) => (
                <div key={note.id} style={{ fontSize: '1.3rem', marginTop: '0.3rem' }}>
                  <span
                    style={{
                      color: note.polarity === 'positive' ? '#16a34a' : note.polarity === 'negative' ? '#dc2626' : '#666',
                      fontWeight: 'bold'
                    }}
                  >
                    {note.trait}
                  </span>
                  : {note.note}{' '}
                  {note.evidenceUrl && (
                    <a href={note.evidenceUrl} target="_blank" rel="noreferrer">
                      (post)
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
          {dismissing?.userId === member.userId && (
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <input
                autoFocus
                value={dismissing.note}
                placeholder="Why not now? (kept; they come back only after a clear rise)"
                onChange={(e) => setDismissing({ userId: member.userId, note: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleDismiss();
                  if (e.key === 'Escape') setDismissing(null);
                }}
                style={{ flex: 1, minWidth: '20rem', padding: '0.6rem 0.8rem', fontSize: '1.4rem' }}
              />
              <Button color="red" variant="soft" tone="raised" disabled={!dismissing.note.trim()} onClick={handleDismiss}>
                Dismiss
              </Button>
              <Button color="darkerGray" variant="soft" tone="raised" onClick={() => setDismissing(null)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      ))}
    </SectionPanel>
  );

  async function handleAdd(userId: number) {
    setBusyUserId(userId);
    try {
      await onAdd(userId);
      setMembers((list) => list.filter((m) => m.userId !== userId));
    } catch {
      setError('Could not add them. Try again.');
    } finally {
      setBusyUserId(0);
    }
  }

  async function handleDismiss() {
    if (!dismissing || !dismissing.note.trim()) return;
    const { userId, note } = dismissing;
    setBusyUserId(userId);
    try {
      await dismissNotableSuggestion({ userId, note: note.trim() });
      setMembers((list) => list.filter((m) => m.userId !== userId));
      setDismissing(null);
    } catch {
      setError('Could not dismiss. Try again.');
    } finally {
      setBusyUserId(0);
    }
  }
}

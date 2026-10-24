import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import ArenaButton from './ArenaButton';
import ArenaLoader from './ArenaLoader';
import { ARENA } from './theme';
import { typeLabel } from './typeLabels';

// Exam skills (helpers/arena/drills.ts): what the member's own battles say
// about how they take each exam: weakest question types (each with a
// drill), pace against the real exam, blanks, and whether changing answers
// helps them. Only their own data, never anyone else's.
interface ExamSkills {
  examKey: string;
  examName: string;
  battles: number;
  types: { type: string; answered: number; correct: number }[];
  weakest: string[];
  pace: { mine: number | null; real: number | null };
  blankShare: number;
  changes: { changed: number; helped: number; hurt: number };
  hunterRank: { grade: number; low: number; high: number } | null;
  gradeLabels: string[] | null;
  deckOpen: number;
  nextBattle: { difficulty: string; length: string };
}

export default function Skills({
  onBack,
  onDrill,
  onOpenDeck,
  onOpenArena
}: {
  onBack: () => void;
  onDrill: (examKey: string, types: string[]) => void;
  onOpenDeck: () => void;
  onOpenArena: () => void;
}) {
  const loadArenaSkills = useAppContext(
    (v) => v.requestHelpers.loadArenaSkills
  );
  const [exams, setExams] = useState<ExamSkills[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadArenaSkills()
      .then((data: { exams: ExamSkills[] }) => setExams(data.exams || []))
      .catch(() => setError('Your skills could not be loaded.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={wrapCls}>
      <header className={headCls}>
        <button type="button" className={backCls} onClick={onBack}>
          <Icon icon="arrow-left" /> Train
        </button>
        <div>
          <h2 className={titleCls}>Exam skills</h2>
          <p className={subCls}>
            From your own battles: where you lose points, and drills for it.
          </p>
        </div>
      </header>
      {!exams ? (
        error ? (
          <p className={mutedCls}>{error}</p>
        ) : (
          <ArenaLoader text="Reading your battles…" />
        )
      ) : !exams.length ? (
        <p className={mutedCls}>
          Fight a few battles first. Your skills show up here after that.
        </p>
      ) : (
        exams.map((exam) => (
          <section key={exam.examKey} className={sectionCls}>
            <div className={sectionHeadCls}>
              <h3>{exam.examName}</h3>
              <span className={mutedCls}>
                {exam.battles} battle{exam.battles === 1 ? '' : 's'}
              </span>
            </div>
            <ol className={prepCls}>
              <li>
                <span>
                  <b>Boss prep.</b>{' '}
                  {exam.hunterRank
                    ? `Hunter Rank about ${gradeText(exam.gradeLabels, exam.hunterRank.grade)}. `
                    : 'No Hunter Rank yet. '}
                  {exam.deckOpen
                    ? `First clear the ${exam.deckOpen} missed question${exam.deckOpen === 1 ? '' : 's'} from this exam in your deck.`
                    : 'Your deck has nothing left from this exam.'}
                </span>
                {exam.deckOpen > 0 && (
                  <button
                    type="button"
                    className={drillButtonCls}
                    onClick={onOpenDeck}
                  >
                    Deck
                  </button>
                )}
              </li>
              {exam.weakest.length > 0 && (
                <li>
                  <span>
                    Then drill your weakest:{' '}
                    {exam.weakest.map(typeLabel).join(', ')}.
                  </span>
                  <button
                    type="button"
                    className={drillButtonCls}
                    onClick={() => onDrill(exam.examKey, exam.weakest)}
                  >
                    Drill
                  </button>
                </li>
              )}
              <li>
                <span>
                  Next battle:{' '}
                  <b>
                    {capitalize(exam.nextBattle.difficulty)}{' '}
                    {capitalize(exam.nextBattle.length)}
                  </b>
                  {exam.hunterRank
                    ? ', fitted to your Hunter Rank.'
                    : ', to earn a Hunter Rank.'}
                </span>
                <button
                  type="button"
                  className={drillButtonCls}
                  onClick={onOpenArena}
                >
                  Arena
                </button>
              </li>
            </ol>
            <div className={factsCls}>
              <Fact
                label="Pace"
                value={
                  exam.pace.mine != null && exam.pace.real != null
                    ? `${exam.pace.mine}s a question (real exam: ${exam.pace.real}s)`
                    : 'Not enough timed answers yet'
                }
                note={paceNote(exam.pace)}
              />
              <Fact
                label="Left blank"
                value={`${Math.round(exam.blankShare * 100)}%`}
                note={
                  exam.blankShare >= 0.1
                    ? 'Mark a best guess before time runs out: a blank is always wrong.'
                    : ''
                }
              />
              <Fact
                label="Changed answers"
                value={
                  exam.changes.changed
                    ? `${exam.changes.helped} helped · ${exam.changes.hurt} hurt`
                    : 'None yet'
                }
                note={changeNote(exam.changes)}
              />
            </div>
            <div className={typesCls}>
              {exam.types.map((t) => {
                const share = t.answered ? t.correct / t.answered : 0;
                return (
                  <div key={t.type} className={typeRowCls}>
                    <span className={typeNameCls}>{typeLabel(t.type)}</span>
                    <span className={barCls}>
                      <span
                        className={barFillCls}
                        style={{
                          width: `${Math.round(share * 100)}%`,
                          background:
                            share >= 0.8
                              ? ARENA.train
                              : share >= 0.6
                                ? ARENA.sky
                                : ARENA.coral
                        }}
                      />
                    </span>
                    <span className={typeScoreCls}>
                      {t.correct}/{t.answered}
                    </span>
                    <button
                      type="button"
                      className={drillButtonCls}
                      onClick={() => onDrill(exam.examKey, [t.type])}
                    >
                      Drill
                    </button>
                  </div>
                );
              })}
            </div>
            {exam.weakest.length > 1 && (
              <div className={actionsCls}>
                <ArenaButton
                  tone="ink"
                  size="md"
                  onClick={() => onDrill(exam.examKey, exam.weakest)}
                >
                  Mixed drill: your {exam.weakest.length} weakest
                </ArenaButton>
              </div>
            )}
          </section>
        ))
      )}
    </div>
  );
}

function gradeText(labels: string[] | null, grade: number) {
  return labels?.[grade - 1] || `${grade}등급`;
}

function capitalize(word: string) {
  return word ? word[0].toUpperCase() + word.slice(1) : word;
}

function Fact({
  label,
  value,
  note
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className={factCls}>
      <span className={factLabelCls}>{label}</span>
      <strong>{value}</strong>
      {note && <span className={mutedCls}>{note}</span>}
    </div>
  );
}

function paceNote(pace: { mine: number | null; real: number | null }) {
  if (pace.mine == null || pace.real == null) return '';
  if (pace.mine > pace.real * 1.15) {
    return 'Slower than the real exam allows: skip the hard ones and come back.';
  }
  if (pace.mine < pace.real * 0.6) {
    return 'Much faster than needed: use the spare time to check.';
  }
  return 'About the real pace.';
}

function changeNote(changes: {
  changed: number;
  helped: number;
  hurt: number;
}) {
  if (changes.changed < 3) return '';
  if (changes.hurt > changes.helped) {
    return 'Your first pick is usually right. Change only with a clear reason.';
  }
  if (changes.helped > changes.hurt) {
    return 'Your second looks pay off. Keep checking.';
  }
  return '';
}

const wrapCls = css`
  width: 100%;
  max-width: 88rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  color: ${ARENA.ink};
`;

const headCls = css`
  display: flex;
  align-items: center;
  gap: 1.6rem;
`;

const backCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 1rem;
  border: 2px solid ${ARENA.ink};
  border-radius: 8px;
  background: #fff;
  font-weight: 800;
  cursor: pointer;
`;

const titleCls = css`
  margin: 0;
  font-size: 2.2rem;
  font-weight: 900;
`;

const subCls = css`
  margin: 0.2rem 0 0;
  color: ${ARENA.inkSoft};
  font-weight: 600;
`;

const mutedCls = css`
  color: ${ARENA.inkSoft};
  font-size: 1.3rem;
`;

const sectionCls = css`
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  padding: 1.6rem;
  border: 2px solid ${ARENA.line};
  border-radius: 10px;
  background: ${ARENA.paper};
`;

const sectionHeadCls = css`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  h3 {
    margin: 0;
    font-size: 1.8rem;
    font-weight: 900;
  }
`;

const factsCls = css`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.8rem;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const factCls = css`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 1rem;
  border: 1.5px solid ${ARENA.ink};
  border-radius: 8px;
  background: #fff;
  strong {
    font-size: 1.5rem;
  }
`;

const factLabelCls = css`
  font-size: 1.2rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${ARENA.inkSoft};
`;

const typesCls = css`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const typeRowCls = css`
  display: grid;
  grid-template-columns: minmax(0, 20rem) minmax(0, 1fr) 5rem auto;
  align-items: center;
  gap: 1rem;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: minmax(0, 1fr) 4.5rem auto;
    span:nth-of-type(2) {
      grid-column: 1 / -1;
      grid-row: 2;
    }
  }
`;

const typeNameCls = css`
  font-weight: 700;
  font-size: 1.4rem;
  line-height: 1.25;
`;

const barCls = css`
  height: 1rem;
  border: 1.5px solid ${ARENA.ink};
  border-radius: 999px;
  background: #fff;
  overflow: hidden;
`;

const barFillCls = css`
  display: block;
  height: 100%;
`;

const typeScoreCls = css`
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  text-align: right;
`;

const drillButtonCls = css`
  padding: 0.3rem 1rem;
  border: 2px solid ${ARENA.ink};
  border-radius: 6px;
  background: #fff;
  font-weight: 800;
  cursor: pointer;
  &:hover {
    background: ${ARENA.paper};
  }
`;

const actionsCls = css`
  display: flex;
  justify-content: flex-end;
`;

const prepCls = css`
  margin: 0;
  padding: 1rem 1.2rem 1rem 3rem;
  border: 2px solid ${ARENA.ink};
  border-radius: 8px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  li {
    font-size: 1.4rem;
  }
  li > span {
    margin-right: 0.8rem;
  }
`;

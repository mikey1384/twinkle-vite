import React, { useEffect, useState } from 'react';
import { css, cx } from '@emotion/css';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import ArenaButton from './ArenaButton';
import ArenaLoader from './ArenaLoader';
import { PaperItem } from './BattleRunner';
import { ARENA } from './theme';
import { typeLabel } from './typeLabels';
import type { ArenaItem } from './types';

// A type drill (helpers/arena/drills.ts): five questions of one type, or the
// three weakest mixed, each graded the moment it is answered. While the
// member is under 60% on the type it opens with a worked example.
interface DrillItem {
  itemId: number;
  version: number;
  type: string;
  passage: { kind: string; body: string; audioPath: string | null } | null;
  stem: string;
  body?: string;
  visual?: Record<string, unknown>;
  choices: string[];
  typed?: 'integer' | 'number' | 'text';
  key?: number | string;
  review?: ArenaItem['review'];
}

interface DrillData {
  exam: { key: string; name: string; language: 'en' | 'ko' };
  types: string[];
  example: DrillItem | null;
  items: DrillItem[];
}

export default function Drill({
  examKey,
  types,
  onBack
}: {
  examKey: string;
  types: string[];
  onBack: () => void;
}) {
  const startArenaDrill = useAppContext(
    (v) => v.requestHelpers.startArenaDrill
  );
  const answerArenaDrill = useAppContext(
    (v) => v.requestHelpers.answerArenaDrill
  );
  const [drill, setDrill] = useState<DrillData | null>(null);
  const [error, setError] = useState('');
  // -1 is the worked example
  const [index, setIndex] = useState(0);
  const [marked, setMarked] = useState<number | string | null>(null);
  const [result, setResult] = useState<{
    correct: boolean;
    key: number | string;
    review: ArenaItem['review'];
  } | null>(null);
  const [score, setScore] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    startArenaDrill({ examKey, types })
      .then((data: DrillData) => {
        setDrill(data);
        setIndex(data.example ? -1 : 0);
      })
      .catch((err: any) =>
        setError(
          err?.response?.data?.error || 'This drill could not be started.'
        )
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!drill) {
    return (
      <div className={wrapCls}>
        {error ? (
          <>
            <p className={mutedCls}>{error}</p>
            <ArenaButton tone="ink" size="md" onClick={onBack}>
              Back
            </ArenaButton>
          </>
        ) : (
          <ArenaLoader text="Setting up your drill…" />
        )}
      </div>
    );
  }

  const done = index >= drill.items.length;
  const current = index === -1 ? drill.example : drill.items[index];
  return (
    <div className={wrapCls}>
      <header className={headCls}>
        <button type="button" className={backCls} onClick={onBack}>
          <Icon icon="arrow-left" /> Skills
        </button>
        <div>
          <h2 className={titleCls}>
            Drill: {drill.types.map(typeLabel).join(' · ')}
          </h2>
          <p className={subCls}>
            {drill.exam.name}
            {index >= 0 && !done
              ? ` · question ${index + 1} of ${drill.items.length}`
              : ''}
          </p>
        </div>
      </header>

      {done ? (
        <section className={doneCls}>
          <strong>
            {score} / {drill.items.length} right
          </strong>
          <span className={mutedCls}>
            {score === drill.items.length
              ? 'Clean sweep. This type is getting strong.'
              : 'Every miss you make in a battle still lands in your deck.'}
          </span>
          <div className={actionsCls}>
            <ArenaButton tone="ink" size="md" onClick={onBack}>
              Done
            </ArenaButton>
          </div>
        </section>
      ) : (
        current && (
          <section className={cardCls}>
            {index === -1 && (
              <p className={exampleNoteCls}>
                Worked example: read how this one is solved, then try five on
                your own.
              </p>
            )}
            <div className={paperCls}>
              <PaperItem
                item={asPaperItem(current, index === -1, result)}
                passage={current.passage}
                marked={index === -1 ? null : marked}
                finished={index === -1 || !!result}
                reviewLang={drill.exam.language}
                audioControls
                allPointTags={false}
                onMark={(value) => !result && setMarked(value)}
              />
            </div>
            <div className={actionsCls}>
              {index === -1 ? (
                <ArenaButton tone="ink" size="md" onClick={() => setIndex(0)}>
                  Got it, start
                </ArenaButton>
              ) : result ? (
                <>
                  <span
                    className={cx(
                      verdictCls,
                      result.correct ? verdictRightCls : verdictWrongCls
                    )}
                  >
                    {result.correct ? 'Right!' : 'Not this time.'}
                  </span>
                  <ArenaButton tone="ink" size="md" onClick={handleNext}>
                    {index + 1 < drill.items.length ? 'Next' : 'Finish'}
                  </ArenaButton>
                </>
              ) : (
                <ArenaButton
                  tone="ink"
                  size="md"
                  disabled={busy || marked == null || marked === ''}
                  loading={busy}
                  onClick={handleCheck}
                >
                  Check
                </ArenaButton>
              )}
            </div>
          </section>
        )
      )}
    </div>
  );

  async function handleCheck() {
    if (!current || index < 0) return;
    setBusy(true);
    try {
      const data = await answerArenaDrill({
        itemId: current.itemId,
        version: current.version,
        answer: marked
      });
      setResult(data);
      if (data.correct) setScore((s) => s + 1);
    } catch {
      setError('That did not save. Try again.');
    } finally {
      setBusy(false);
    }
  }

  function handleNext() {
    setResult(null);
    setMarked(null);
    setIndex((i) => i + 1);
    window.scrollTo({ top: 0 });
  }
}

function asPaperItem(
  item: DrillItem,
  example: boolean,
  result: {
    correct: boolean;
    key: number | string;
    review: ArenaItem['review'];
  } | null
): ArenaItem {
  return {
    no: 0,
    type: item.type,
    section: item.type.includes('.l.') ? 'listening' : 'main',
    points: 0,
    passageId: null,
    stem: item.stem,
    body: item.body,
    visual: item.visual,
    choices: item.choices || [],
    typed: item.typed,
    answer: null,
    ...(example
      ? { key: item.key, correct: true, review: item.review }
      : result
        ? { key: result.key, correct: result.correct, review: result.review }
        : {})
  };
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
  font-size: 1.4rem;
`;

const cardCls = css`
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
`;

const exampleNoteCls = css`
  margin: 0;
  padding: 0.8rem 1.2rem;
  border: 2px dashed ${ARENA.ink};
  border-radius: 8px;
  background: ${ARENA.paper};
  font-weight: 700;
`;

const paperCls = css`
  padding: 2rem 2.4rem;
  border: 2px solid ${ARENA.line};
  border-radius: 6px;
  background: #fff;
  font-family: 'Noto Serif KR', 'Nanum Myeongjo', serif;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1.4rem;
  }
`;

const actionsCls = css`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1.2rem;
  flex-wrap: wrap;
`;

const verdictCls = css`
  font-weight: 900;
  font-size: 1.6rem;
`;

const verdictRightCls = css`
  color: ${ARENA.train};
`;

const verdictWrongCls = css`
  color: ${ARENA.coral};
`;

const doneCls = css`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 2rem;
  border: 2px solid ${ARENA.line};
  border-radius: 10px;
  background: ${ARENA.paper};
  strong {
    font-size: 2.4rem;
    font-weight: 900;
  }
`;

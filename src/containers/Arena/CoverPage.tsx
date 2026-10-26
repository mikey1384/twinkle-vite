import React, { useEffect, useMemo, useState } from 'react';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import ArenaButton from './ArenaButton';
import RewardOffer from './RewardOffer';
import ComponentSchedule from './ComponentSchedule';
import { useAppContext } from '~/contexts';
import { ARENA } from './theme';
import type { ArenaBattlePreview, ArenaDifficulty, ArenaExamSummary, ArenaRewardOffer } from './types';

// The booklet's cover, read before the bell as in the real exam room: 교시,
// 영역, the paper's size and time, the 유의사항 and a 필적 확인 문구. The clock
// starts only on 시작, so reading the cover costs no exam time. The header
// says Twinkle's mock paper, never the 평가원's. 필적 확인 lines are from
// public-domain poems (윤동주, 김소월, 한용운); copying it is for the feel,
// never required. 영역 and the 필적 확인 are the 수능's; an English-language
// exam (TOEFL, IELTS, A2 Key, TOSEL, SAT) gets an English cover.
const PHRASES = [
  { line: '죽는 날까지 하늘을 우러러', source: '윤동주, 「서시」' },
  { line: '계절이 지나가는 하늘에는', source: '윤동주, 「별 헤는 밤」' },
  { line: '나 보기가 역겨워 가실 때에는', source: '김소월, 「진달래꽃」' },
  { line: '엄마야 누나야 강변 살자', source: '김소월, 「엄마야 누나야」' },
  {
    line: '님은 갔습니다 아아 사랑하는 나의 님은 갔습니다',
    source: '한용운, 「님의 침묵」'
  }
];

// 수능's 교시 by 영역; other exams print no 교시
const PERIOD: Record<string, number> = {
  'suneung-kor': 1,
  'suneung-math': 2,
  'suneung-eng': 3,
  'suneung-khist': 4
};
const LENGTH: Record<string, string> = {
  short: '짧은 시험',
  medium: '중간 길이',
  full: '전체 시험'
};
const MODE: Record<string, string> = {
  easy: '쉬움',
  normal: '보통',
  hard: '어려움'
};
const LENGTH_EN: Record<string, string> = {
  short: 'Short test',
  medium: 'Medium test',
  full: 'Full test'
};
const MODE_EN: Record<string, string> = {
  easy: 'Easy',
  normal: 'Normal',
  hard: 'Hard'
};

export default function CoverPage({
  exam,
  length,
  difficulty,
  starting,
  onStart,
  onOpenExisting,
  onCancel
}: {
  exam: ArenaExamSummary;
  length: 'short' | 'medium' | 'full';
  difficulty: ArenaDifficulty;
  starting: boolean;
  onStart: (token: string) => Promise<any>;
  onOpenExisting: (battleId: number) => void;
  onCancel: () => void;
}) {
  const prepareArenaBattle = useAppContext((v) => v.requestHelpers.prepareArenaBattle);
  const [preview, setPreview] = useState<(ArenaRewardOffer & { token: string }) | null>(null);
  const [existing, setExisting] = useState<{ battleId: number; status: string } | null>(null);
  const [preparing, setPreparing] = useState(true);
  const [previewError, setPreviewError] = useState('');
  const [notice, setNotice] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setPreview(null); setExisting(null); setPreparing(true); setPreviewError('');
    prepareArenaBattle({ examKey: exam.key, length, difficulty }).then((data: ArenaBattlePreview) => {
      if (cancelled) return;
      if (data.alreadyTaken) setExisting({ battleId: data.battleId, status: data.status });
      else if (data.preview) setPreview(data.preview);
      else setPreviewError('The exam cover could not be prepared. Please try again.');
    }).catch(() => { if (!cancelled) setPreviewError('The exam cover could not be prepared. Please try again.'); })
      .finally(() => { if (!cancelled) setPreparing(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- context request helpers stay out of dependencies
  }, [exam.key, length, difficulty, refresh]);
  const phrase = useMemo(
    () => PHRASES[Math.floor(Math.random() * PHRASES.length)],
    []
  );
  const [copied, setCopied] = useState('');
  const spec = exam.lengths.find((l) => l.length === length);
  const period = PERIOD[exam.key];
  const matches =
    copied.replace(/\s+/g, '') === phrase.line.replace(/\s+/g, '');
  const suneung = /^수능 /.test(exam.name);
  const english = exam.language === 'en' && !suneung;
  const rewardSection = <>
    {preparing && <p role="status">Checking available rewards…</p>}
    {preview && <RewardOffer offer={preview} />}
    {existing && <p>{existing.status === 'finished' ? 'You have already taken this paper. Your result and review are ready.' : 'You already have a sitting of this paper.'}</p>}
    {notice && <p role="status">{notice}</p>}
    {previewError && <p role="alert">{previewError} <button type="button" onClick={() => setRefresh(value => value + 1)}>Try again</button></p>}
  </>;


  if (english) {
    return (
      <div className={backdropCls} role="dialog" aria-label="Exam cover">
        <section className={coverCls}>
          <p className={kickerCls}>Twinkle practice test</p>
          <h2 className={titleCls}>{exam.nameEn || exam.name}</h2>
          <p className={metaCls}>
            {LENGTH_EN[length]} · {MODE_EN[difficulty] || MODE_EN.normal}
            {spec ? ` · ${spec.items} questions${length === 'full' && exam.components?.length ? '' : ` · ${spec.minutes} minutes`}` : ''}
          </p>
          {length === 'full' && <ComponentSchedule examKey={exam.key} components={exam.components} />}
          {length !== 'full' && <p>This is a shortened practice selection.</p>}
          <ul className={rulesCls}>
            <li>
              Answer each question on the screen. Your answers are saved as you work.
            </li>
            <li>
              When time is up, your answer sheet is handed in. A blank answer is
              wrong.
            </li>
            {exam.listening && (
              <li>
                The recordings play as in the real test: once or twice, no
                replays.
              </li>
            )}
            <li>The clock starts when you press Start.</li>
            {exam.key === 'c1-advanced' && (
              <>
                <li>
                  In key word transformations, write 3–6 words including the
                  unchanged key word. Use full forms, not contractions. Each
                  answer has two parts worth one mark each.
                </li>
                <li>
                  This practice test omits Speaking.
                  Practice grades use raw marks; scale estimates appear only
                  after a Normal Full test and are not official results.
                  Writing marks are AI estimates.
                </li>
              </>
            )}
          </ul>
          {exam.key === 'c1-advanced' && (
            <p>
              C1 Advanced and Cambridge English are trade marks of Cambridge
              University Press & Assessment. Twinkle is not affiliated with,
              endorsed or approved by Cambridge University Press & Assessment.
              All questions are original.
            </p>
          )}
          {rewardSection}
          <div className={actionsCls}>
            <button type="button" className={cancelCls} onClick={onCancel}>
              Not now
            </button>
            <ArenaButton
              tone="red"
              size="lg"
              loading={starting || preparing}
              disabled={starting || (!preview && !existing)}
              onClick={handleStart}
            >
              {existing ? existing.status === 'finished' ? 'See my result' : 'Resume exam' : 'Start'}
            </ArenaButton>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={backdropCls} role="dialog" aria-label="Exam cover">
      <section className={coverCls}>
        <p className={kickerCls}>Twinkle 모의고사 문제지</p>
        {period && <p className={periodCls}>제 {period} 교시</p>}
        <h2 className={titleCls}>
          {exam.name}
          {suneung ? ' 영역' : ''}
        </h2>
        <p className={metaCls}>
          {LENGTH[length]} · {MODE[difficulty] || MODE.normal}
          {spec ? ` · ${spec.items}문항 · ${spec.minutes}분` : ''}
        </p>

        {suneung && (
          <div className={phraseBoxCls}>
            <span className={phraseLabelCls}>필적 확인 문구</span>
            <strong>{phrase.line}</strong>
            <span className={sourceCls}>{phrase.source}</span>
            <input
              className={phraseInputCls}
              value={copied}
              onChange={(event) => setCopied(event.target.value)}
              placeholder="필적 확인란 (따라 써 보세요, 선택)"
              aria-label="필적 확인란"
              maxLength={60}
            />
            {matches && <span className={okCls}>확인되었습니다</span>}
          </div>
        )}

        <ul className={rulesCls}>
          <li>
            답은 OMR 답안지에 표기합니다. 문제지에 고른 답도 같이 표기됩니다.
          </li>
          <li>
            시간이 끝나면 답안지가 자동으로 제출됩니다. 빈칸은 오답입니다.
          </li>
          {exam.listening && (
            <li>듣기 문항은 실제 시험처럼 한 번(또는 두 번)만 들려줍니다.</li>
          )}
          <li>시작 버튼을 누르는 순간부터 시간이 흐릅니다.</li>
        </ul>

        {rewardSection}
        <div className={actionsCls}>
          <button type="button" className={cancelCls} onClick={onCancel}>
            Not now
          </button>
          <ArenaButton
            tone="red"
            size="lg"
            loading={starting || preparing}
            disabled={starting || (!preview && !existing)}
            onClick={handleStart}
          >
            {existing ? existing.status === 'finished' ? 'See my result' : 'Resume exam' : '시작'}
          </ArenaButton>
        </div>
      </section>
    </div>
  );

  async function handleStart() {
    if (existing) { onOpenExisting(existing.battleId); return; }
    if (!preview) return;
    try {
      const result = await onStart(preview.token);
      if (result?.previewChanged) {
        setPreview(result.preview);
        setNotice('Your available rewards changed. Check the updated amounts before starting.');
      }
    } catch {
      setNotice('The cover expired or changed. Available rewards have been refreshed.');
      setRefresh(value => value + 1);
    }
  }
}

const backdropCls = css`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.6rem;
  background: rgba(29, 27, 24, 0.55);
  overflow-y: auto;
`;

const coverCls = css`
  width: 100%;
  max-width: 56rem;
  max-height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
  padding: 3.2rem 2.8rem 2.4rem;
  border: 3px solid ${ARENA.ink};
  border-radius: 4px;
  background: #fff;
  color: ${ARENA.ink};
  font-family:
    'Arena Old Hangul', 'Noto Serif KR', 'Nanum Myeongjo', AppleMyungjo, Batang,
    serif;
  box-shadow: 6px 6px 0 ${ARENA.ink};
  @media (max-width: ${mobileMaxWidth}) {
    padding: 2.4rem 1.6rem 1.6rem;
  }
`;

const kickerCls = css`
  margin: 0;
  font-size: 1.4rem;
  letter-spacing: 0.08em;
`;

const periodCls = css`
  margin: 0;
  padding: 0.2rem 1.4rem;
  border: 2px solid ${ARENA.ink};
  border-radius: 999px;
  font-size: 1.5rem;
  font-weight: 700;
`;

const titleCls = css`
  margin: 0.6rem 0 0;
  font-size: 3.4rem;
  font-weight: 900;
  letter-spacing: 0.1em;
`;

const metaCls = css`
  margin: 0;
  font-size: 1.5rem;
  color: ${ARENA.inkSoft};
`;

const phraseBoxCls = css`
  width: 100%;
  box-sizing: border-box;
  margin-top: 1.2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 1.4rem;
  border: 2px solid ${ARENA.ink};
  strong {
    font-size: 1.9rem;
  }
`;

const phraseLabelCls = css`
  font-size: 1.3rem;
  font-weight: 700;
`;

const sourceCls = css`
  font-size: 1.2rem;
  color: ${ARENA.inkSoft};
`;

const phraseInputCls = css`
  width: 100%;
  max-width: 36rem;
  box-sizing: border-box;
  margin-top: 0.6rem;
  padding: 0.6rem 1rem;
  border: 1.5px dashed ${ARENA.ink};
  border-radius: 4px;
  font: inherit;
  font-size: 1.6rem;
  text-align: center;
`;

const okCls = css`
  font-size: 1.3rem;
  font-weight: 700;
  color: ${ARENA.train};
`;

const rulesCls = css`
  width: 100%;
  box-sizing: border-box;
  margin: 1rem 0 0;
  padding-left: 2rem;
  font-size: 1.4rem;
  line-height: 1.6;
`;

const actionsCls = css`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1.6rem;
  margin-top: 1.2rem;
  font-family: inherit;
`;

const cancelCls = css`
  border: none;
  background: none;
  font: inherit;
  font-size: 1.5rem;
  font-weight: 700;
  color: ${ARENA.inkSoft};
  cursor: pointer;
  text-decoration: underline;
`;

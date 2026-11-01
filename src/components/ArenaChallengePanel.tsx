import React, { memo } from 'react';
import { css, cx } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useKeyContext, useNotiContext } from '~/contexts';
import ArenaButton from '~/containers/Arena/ArenaButton';
import ArenaRewards from '~/containers/Arena/Rewards';
import type { ArenaRewardStatus } from '~/containers/Arena/types';
import { arenaMediaURL } from '~/containers/Arena/media';
import { ARENA } from '~/containers/Arena/theme';
import { arenaAssistLabel } from '~/helpers/arenaChallengeCopy';

// A won Arena battle shared as a post (Mikey 10-24): the member showing off a
// win ("im just showing off my achievement"). The post itself is a normal
// one (score-aware achievement heading, likes, comments,
// recommends); this is its body on Home and on /arena-challenges/:id, the
// Arena look only inside the panel, with a Challenge! button for anyone who
// wants to sit the same paper. Never any wrong answers (the own-misses ruling).
// A run Zero or Ciel helped with names them beside its score ("With Zero";
// Mikey 10-31). A daily
// clear shows exactly what it paid, guided or not: the amounts are what make
// others want to try it (Mikey 10-31, standing-rulings.md).
interface ArenaBossChallengePreview {
  kind?: 'battle';
  id: number;
  examKey: string;
  examName: string;
  code: string;
  codeLabel: string | null;
  gradeLabels: string[] | null;
  length: 'short' | 'medium' | 'full';
  difficulty: 'easy' | 'normal' | 'hard';
  sharer: { id: number; username: string; profilePicUrl: string | null };
  raw: number;
  max: number;
  xpEarned?: number;
  coinsEarned?: number;
  scoreBonusXpEarned?: number;
  scoreBonusCoinsEarned?: number;
  rewardPending?: boolean;
  rewardStatus?: ArenaRewardStatus;
  markingPending?: boolean;
  hunterRank: { grade: number; low: number; high: number } | null;
  // Zero or Ciel helped with this run, named as "with Zero" and the like
  assisted?: boolean;
  assistLabel?: string | null;
  createdAt: number;
  takers: number;
  bestTaker: number | null;
}

interface ArenaTodayChallengePreview {
  kind: 'today';
  id: number;
  dayIndex: number;
  dayKey: string;
  createdAt: number;
  sharer: { id: number; username: string; profilePicUrl: string | null };
  xpEarned: number;
  coinsEarned: number;
  // the question's title and opening line, never its choices or answer
  questionTitle?: string | null;
  questionExcerpt?: string | null;
  // others who tried this exact question from Home: counts, never names
  tried?: number;
  cleared?: number;
}

export type ArenaChallengePreview = ArenaBossChallengePreview | ArenaTodayChallengePreview;

// 수우미양가 (Mikey 10-24: a teacher's stamp for the old-school feel), the
// classic school lines on the paper's score: 수 90%+, 우 80%+, 미 70%+,
// 양 60%+, 가 below
const MARKS = [
  { min: 0.9, mark: '수', file: 'su' },
  { min: 0.8, mark: '우', file: 'u' },
  { min: 0.7, mark: '미', file: 'mi' },
  { min: 0.6, mark: '양', file: 'yang' },
  { min: 0, mark: '가', file: 'ga' }
];
export function gradeMark(raw: number, max: number) {
  const ratio = max > 0 ? raw / max : 0;
  return MARKS.find((m) => ratio >= m.min)!;
}

const LENGTH: Record<string, string> = {
  short: 'Short',
  medium: 'Medium',
  full: 'Full exam'
};
const MODE: Record<string, string> = {
  easy: 'Easy',
  normal: 'Normal',
  hard: 'Hard'
};
const dailyDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric'
});

function ArenaChallengePanel({
  challenge
}: {
  challenge: ArenaChallengePreview;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const todayCompleted = useNotiContext(
    (v) => v.state.todayStats?.dailyTaskStatus?.aiStory?.arena?.todayQuestion?.done
  );
  if (challenge?.kind === 'today') {
    return <DailyClearPanel challenge={challenge} userId={userId} todayCompleted={todayCompleted} />;
  }
  if (!challenge?.examKey) return null;
  const mark = gradeMark(challenge.raw, challenge.max);
  const helpedBy = arenaAssistLabel(challenge);
  const grade = (g: number) => challenge.gradeLabels?.[g - 1] || `${g}등급`;
  // the sharer can't take their own paper again (the API refuses it)
  const isMine = !!userId && userId === challenge.sharer?.id;
  return (
    <div className={resultCls}>
      <img
        className={stampCls}
        src={arenaMediaURL(`img/stamps/${mark.file}.png`)}
        alt={mark.mark}
      />
      <img
        className={eraserCls}
        src={arenaMediaURL(`img/bosses/${challenge.examKey}.jpg`)}
        alt={challenge.examName}
      />
      <div className={resultTextCls}>
        <span className={codeCls}>
          BOSS {challenge.code}
          {challenge.codeLabel ? ` · ${challenge.codeLabel}` : ''}
        </span>
        <strong className={titleCls}>{challenge.examName}</strong>
        <span className={modeCls}>
          {LENGTH[challenge.length]} · {MODE[challenge.difficulty]}
        </span>
        <span className={scoreCls}>
          <small>Score</small> {challenge.raw} <span>/ {challenge.max}</span>
        </span>
        {helpedBy && (
          <span className={assistedCls} title={`Taken ${helpedBy}`}>
            {helpedBy.charAt(0).toUpperCase() + helpedBy.slice(1)}
          </span>
        )}
        {challenge.hunterRank && (
          <span className={rankCls}>
            Hunter Rank about {grade(challenge.hunterRank.grade)}
          </span>
        )}
      </div>
      <div className={awardCls}>
        <ArenaRewards
          xp={challenge.xpEarned}
          coins={challenge.coinsEarned}
          scoreBonusXp={challenge.scoreBonusXpEarned}
          scoreBonusCoins={challenge.scoreBonusCoinsEarned}
          rewardPending={challenge.rewardPending}
          rewardStatus={challenge.rewardStatus}
          markingPending={challenge.markingPending}
          ariaLabel="Exam rewards"
          emptyNote="Daily exam reward limit reached"
          label="Awarded"
          highlight
        />
      </div>
      <div className={footCls}>
        <span className={metaCls}>
          {challenge.takers
            ? `${challenge.takers} tried the same paper${
                challenge.bestTaker != null
                  ? ` · best ${challenge.bestTaker}`
                  : ''
              }`
            : 'Same paper, same clock'}
        </span>
        {!isMine && <ChallengeButton id={challenge.id} />}
      </div>
    </div>
  );
}

// A paid daily clear (Mikey 11-01): the question itself is the picture (its
// title and opening line, never choices or the answer), one big CLEARED
// stamp says the rest, and the exact XP and Coins stay (10-31 ruling). The
// card names the question's own date. Anyone else can try this exact
// question ("Try this question"); a viewer who hasn't done their own daily
// also gets a link to it, which is a different question (each is personal).
function DailyClearPanel({
  challenge,
  userId,
  todayCompleted
}: {
  challenge: ArenaTodayChallengePreview;
  userId: number;
  todayCompleted?: boolean;
}) {
  const isMine = !!userId && userId === challenge.sharer?.id;
  const canTry = !!userId && !isMine;
  // one's own daily, when it is still open today
  const ownDailyOpen = !!userId && todayCompleted === false;
  const tried = Number(challenge.tried) || 0;
  const counts = tried > 0
    ? `${tried} tried · ${Number(challenge.cleared) || 0} cleared`
    : canTry ? 'Be the first to try it' : '';
  // one's own post for today: straight to its explanation (Mikey 11-01).
  // The site day is UTC, so today's key is the UTC date.
  const canReview = isMine && challenge.dayKey === new Date().toISOString().slice(0, 10);
  const hasButtons = canTry || canReview || ownDailyOpen;
  const hasFoot = hasButtons || !!counts;
  return (
    <div className={cx(resultCls, dailyCls)}>
      <div className={dailyTopCls}>
        {/* floated beside the date; the question starts below it, never under it */}
        <span className={clearedStampCls} aria-label="Cleared">CLEARED</span>
        <div className={dailyHeadCls}>
          {/* the Q card: small beside the label on phones, beside the question on desktop */}
          <span className={cx(qCardCls, qCardSmallCls)} aria-hidden="true">Q</span>
          <span className={headLabelsCls}>
            <span className={codeCls}>ARENA · DAILY</span>
            <span className={modeCls}>{formatDailyDate(challenge.dayKey)}</span>
          </span>
        </div>
        <div className={questionRowCls}>
          <span className={cx(qCardCls, qCardLargeCls)} aria-hidden="true">Q</span>
          <div className={questionCls}>
            <strong className={cx(titleCls, dailyTitleCls)}>
              {challenge.questionTitle || 'Daily challenge'}
            </strong>
            {challenge.questionExcerpt && (
              // with nothing to press, more of the question fills the card
              <p className={cx(excerptCls, !hasButtons && excerptTallCls)}>{challenge.questionExcerpt}</p>
            )}
          </div>
        </div>
      </div>
      <div className={awardCls}>
        <ArenaRewards
          xp={challenge.xpEarned}
          coins={challenge.coinsEarned}
          ariaLabel="Daily challenge rewards"
          emptyNote="Daily exam reward limit reached"
          label="Awarded"
          highlight
        />
        {challenge.coinsEarned === 0 && <span className={modeCls}>0 Coins</span>}
      </div>
      {hasFoot && (
        <div className={dailyFootCls}>
          {hasButtons && (
            <div className={dailyButtonsCls}>
              {/* two buttons: their question, and one's own daily while it is open */}
              {canTry && ownDailyOpen && <ChallengeButton daily secondary id={challenge.id} />}
              {canTry ? <ChallengeButton shared id={challenge.id} />
                : canReview ? <ChallengeButton review id={challenge.id} />
                : <ChallengeButton daily id={challenge.id} />}
            </div>
          )}
          {counts && <span className={metaCls}>{counts}</span>}
        </div>
      )}
    </div>
  );
}

export default memo(ArenaChallengePanel);

// Keep router-context updates in the control, not the entire memoized receipt.
function ChallengeButton({
  daily = false,
  shared = false,
  review = false,
  secondary = false,
  id
}: {
  daily?: boolean;
  shared?: boolean;
  // one's own clear today: Today's Challenge opened on its explanation
  review?: boolean;
  // beside "Try this question": one's own daily, as the quieter button
  secondary?: boolean;
  id: number;
}) {
  const navigate = useNavigate();
  return (
    <ArenaButton tone={secondary ? 'paper' : 'red'} size="md" onClick={(event) => {
      event.stopPropagation();
      navigate(
        shared ? `/arena?mode=today&shared=${id}`
          : review ? '/arena?mode=today&review=1'
          : daily ? '/arena?mode=today'
          : `/arena?mode=arena&challenge=${id}`
      );
    }}>
      {shared ? 'Try this question'
        : review ? 'Review the explanation'
        : secondary ? 'Today’s challenge'
        : daily ? 'Try today’s challenge'
        : 'Challenge!'}
    </ArenaButton>
  );
}

function formatDailyDate(dayKey: string) {
  const date = new Date(`${dayKey}T00:00:00Z`);
  return Number.isFinite(date.getTime()) ? dailyDateFormatter.format(date) : 'Invalid Date';
}

// the Arena look, inside the post's default frame
const resultCls = css`
  position: relative;
  box-sizing: border-box;
  /* room for the hard shadow inside the feed card's clipped body */
  width: calc(100% - 3px);
  /* fills the feed card's fixed preview slot; on the content page the
     slot has no set height, so this is a no-op there */
  min-height: calc(100% - 4px);
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-content: center;
  align-items: center;
  gap: 1rem 1.6rem;
  padding: 1.2rem 1.4rem;
  background: ${ARENA.paper};
  color: ${ARENA.ink};
  border: 2px solid ${ARENA.line};
  border-radius: 10px;
  box-shadow: 3px 3px 0 ${ARENA.line};
  @media (max-width: ${mobileMaxWidth}) {
    gap: 0.9rem 1rem;
    padding: 1rem;
  }
`;

// stamped inside the panel's corner, a little crooked like a real one (inside,
// so the feed card's clipped body never cuts it)
const stampCls = css`
  position: absolute;
  top: 0.4rem;
  right: 0.8rem;
  width: 5.6rem;
  height: 5.6rem;
  transform: rotate(-12deg);
  pointer-events: none;
  @media (max-width: ${mobileMaxWidth}) {
    width: 4.6rem;
    height: 4.6rem;
    right: 0.4rem;
  }
`;

const eraserCls = css`
  height: 11rem;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  border: 2px solid ${ARENA.line};
  border-radius: 4px;
  box-shadow: 3px 4px 0 ${ARENA.line};
  transform: rotate(-4deg);
  flex: none;
  @media (max-width: ${mobileMaxWidth}) {
    height: 10rem;
  }
`;

// a daily clear is one column sized to its content: no empty band, no icon
const dailyCls = css`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  /* the feed slot is sized for a two-line title; shorter cards share the slack */
  justify-content: space-between;
  gap: 1.1rem;
  padding: 1.4rem 1.6rem 1.5rem;
  @media (max-width: ${mobileMaxWidth}) {
    gap: 1rem;
    padding: 1.2rem 1.2rem 1.3rem;
  }
`;

const dailyTopCls = css`
  display: flow-root;
  min-width: 0;
`;

const dailyHeadCls = css`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

// one line on desktop; on phones the date sits under the label, beside the
// Q card, so the card is the same height at every phone width
const headLabelsCls = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 0.8rem;
  min-width: 0;
  @media (max-width: ${mobileMaxWidth}) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.3rem;
  }
`;

const questionRowCls = css`
  display: flex;
  align-items: center;
  gap: 1.6rem;
  clear: both;
`;

// Arena's green eraser card with a Q, the daily challenge's mark
const qCardCls = css`
  display: grid;
  place-items: center;
  flex: none;
  aspect-ratio: 3 / 4;
  background: ${ARENA.train};
  color: #fff;
  font-weight: 900;
  line-height: 1;
  border: 2px solid ${ARENA.line};
  border-radius: 4px;
  transform: rotate(-4deg);
`;

const qCardSmallCls = css`
  display: none;
  @media (max-width: ${mobileMaxWidth}) {
    display: grid;
    height: 3.4rem;
    font-size: 2rem;
    box-shadow: 2px 2px 0 ${ARENA.line};
  }
`;

const qCardLargeCls = css`
  height: 8.4rem;
  margin-left: 0.4rem;
  font-size: 3.8rem;
  box-shadow: 3px 4px 0 ${ARENA.line};
  @media (max-width: ${mobileMaxWidth}) {
    display: none;
  }
`;

const questionCls = css`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  flex: 1;
  padding: 0.2rem 0 0.2rem 1.1rem;
  border-left: 4px solid ${ARENA.train};
  min-width: 0;
`;

const excerptTallCls = css`
  -webkit-line-clamp: 5;
`;

// two lines at most
const dailyTitleCls = css`
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const excerptCls = css`
  margin: 0;
  font-size: 1.4rem;
  line-height: 1.55;
  color: ${ARENA.inkSoft};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
`;

// desktop: the counts on the left, the buttons on the right; phones: the
// buttons side by side across the card, the counts under them
const dailyFootCls = css`
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  @media (max-width: ${mobileMaxWidth}) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.6rem;
  }
`;

const dailyButtonsCls = css`
  display: flex;
  gap: 1rem;
  @media (max-width: ${mobileMaxWidth}) {
    gap: 0.8rem;
    > button {
      flex: 1 1 0;
      min-width: 0;
      padding-left: 0.6rem;
      padding-right: 0.6rem;
      letter-spacing: 0;
      white-space: nowrap;
    }
  }
`;

// a rubber stamp pressed hard into the corner: double ring, ink-heavy, tilted
const clearedStampCls = css`
  float: right;
  /* room for the tilt and the outer ring */
  margin: 0.3rem 0.4rem 1.2rem 1.4rem;
  padding: 0.35rem 1.1rem;
  border: 3px solid ${ARENA.train};
  border-radius: 6px;
  outline: 2px solid ${ARENA.train};
  outline-offset: 3px;
  color: ${ARENA.train};
  font-size: 2.6rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  line-height: 1.1;
  transform: rotate(-7deg);
  opacity: 0.92;
  pointer-events: none;
  @media (max-width: ${mobileMaxWidth}) {
    margin-bottom: 0.9rem;
    padding: 0.3rem 0.8rem;
    font-size: 2.1rem;
  }
`;

const resultTextCls = css`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
  padding-right: 3.6rem;
`;

const codeCls = css`
  align-self: flex-start;
  padding: 0.1rem 0.6rem;
  border-radius: 4px;
  background: ${ARENA.ink};
  color: #fff;
  font-size: 1.1rem;
  font-weight: 900;
  letter-spacing: 0.06em;
`;

const titleCls = css`
  font-size: 1.6rem;
  font-weight: 900;
`;

const modeCls = css`
  font-size: 1.2rem;
  color: ${ARENA.inkSoft};
`;

const scoreCls = css`
  font-size: 2.2rem;
  font-weight: 900;
  color: ${ARENA.train};
  small { font-size: 1.1rem; font-weight: 700; color: ${ARENA.inkSoft}; }
  > span { font-size: 1.5rem; }
`;

const assistedCls = css`
  align-self: flex-start;
  padding: 0.1rem 0.6rem;
  border: 2px solid ${ARENA.line};
  border-radius: 4px;
  background: #fff;
  color: ${ARENA.ink};
  font-size: 1.2rem;
  font-weight: 900;
`;

const rankCls = css`
  font-size: 1.3rem;
  font-weight: 700;
  color: ${ARENA.inkSoft};
`;

const footCls = css`
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`;

const awardCls = css`
  grid-column: 1 / -1;
  min-width: 0;
`;

const metaCls = css`
  font-size: 1.3rem;
  color: ${Color.gray()};
`;

import React, { useState } from 'react';
import { css, cx } from '@emotion/css';
import { ARENA } from './theme';
import ArenaButton from './ArenaButton';
import type { ArenaItem } from './types';

// An essay or spoken answer after the battle: the AI mark on the exam's
// public scale, always labelled an estimate (a spoken answer's mark is
// indicative: it is read from a transcript), each criterion's score and
// comment, and the feedback; or, until the mark is in, why it is waiting.
export default function MarkReview({
  item,
  ko,
  onRequestMarking
}: {
  item: ArenaItem;
  ko: boolean;
  onRequestMarking?: () => Promise<void>;
}) {
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const marking = item.marking;
  const spoken = item.marked === 'spoken';
  const mark = marking?.mark;
  const estimateLabel = spoken
    ? ko
      ? 'AI 추정 점수 · 녹음 전사본 기준 참고용'
      : 'AI estimate · indicative, read from a transcript'
    : ko
      ? 'AI 추정 점수'
      : 'AI estimate';

  if (!marking || marking.status !== 'marked' || !mark) {
    const waitingEnergy = marking?.status === 'awaiting';
    const failed = marking?.status === 'failed';
    return (
      <div className={cx(boxCls, waitCls)}>
        <span className={badgeCls}>{estimateLabel}</span>
        {waitingEnergy || failed ? (
          <>
            <p>
              {waitingEnergy
                ? ko
                  ? onRequestMarking
                    ? 'AI 에너지가 없어 아직 채점하지 못했습니다. 답안은 저장되어 있습니다.'
                    : '아직 채점하지 않았습니다. 답안은 저장되어 있습니다.'
                  : onRequestMarking
                    ? 'Not marked yet: your AI Energy ran out. Your answer is saved.'
                    : 'Not marked yet. The answer is saved.'
                : ko
                  ? '채점을 마치지 못했습니다. 답안은 저장되어 있습니다.'
                  : "Marking didn't finish. Your answer is saved."}
            </p>
            {onRequestMarking && <ArenaButton
              tone="red"
              size="md"
              loading={asking}
              onClick={handleAsk}
            >
              {ko ? '지금 채점하기' : 'Mark it now'}
            </ArenaButton>}
            {askError && <p className={errorCls}>{askError}</p>}
          </>
        ) : (
          <p>
            {ko
              ? '채점 중… 잠시 후 점수가 나옵니다.'
              : 'Marking… the score appears here in a moment.'}
          </p>
        )}
      </div>
    );
  }

  const feedback = ko && mark.feedbackKo ? mark.feedbackKo : mark.feedback;
  return (
    <div className={boxCls}>
      <div className={headCls}>
        <span className={badgeCls}>{estimateLabel}</span>
        <strong>{mark.scaleScore}</strong>
        <span className={pointsCls}>
          {mark.points} / {mark.maxPoints}
          {ko ? '점' : ' points'}
        </span>
      </div>
      <table className={tableCls}>
        <tbody>
          {mark.criteria.map((c) => (
            <tr key={c.id}>
              <th>{ko ? c.nameKo : c.name}</th>
              <td className={scoreCls}>
                {c.score}/{c.max}
              </td>
              <td>{ko && c.commentKo ? c.commentKo : c.comment}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {feedback && <p className={feedbackCls}>{feedback}</p>}
      {spoken && marking.transcript != null && (
        <div>
          <button
            type="button"
            className={linkCls}
            onClick={() => setShowTranscript((v) => !v)}
          >
            {showTranscript
              ? ko
                ? '전사본 숨기기'
                : 'Hide what the marker read'
              : ko
                ? '채점에 쓰인 전사본 보기'
                : 'Show what the marker read (transcript)'}
          </button>
          {showTranscript && (
            <p className={transcriptCls}>{marking.transcript || '(empty)'}</p>
          )}
        </div>
      )}
    </div>
  );

  async function handleAsk() {
    setAsking(true);
    setAskError('');
    try {
      await onRequestMarking?.();
    } catch (error: any) {
      setAskError(
        error?.code === 'ai_energy_depleted'
          ? ko
            ? 'AI 에너지가 아직 없습니다. 충전하거나 내일 다시 시도하세요.'
            : 'AI Energy is still empty. Recharge it or try again tomorrow.'
          : error?.message || 'Please try again.'
      );
    } finally {
      setAsking(false);
    }
  }
}

const boxCls = css`
  margin-top: 0.8rem;
  padding: 0.9rem 1.1rem;
  border-radius: 6px;
  background: #f3f1fb;
  font-family: system-ui, sans-serif;
  font-size: 1.3rem;
  line-height: 1.5;
  p {
    margin: 0.5rem 0 0;
  }
`;

const waitCls = css`
  background: #f6f3ea;
`;

const headCls = css`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.8rem;
  strong {
    font-size: 1.8rem;
  }
`;

// the estimate label sits on every mark (Mikey: deliver or don't claim)
const badgeCls = css`
  display: inline-block;
  padding: 0.1rem 0.7rem;
  border: 1.5px solid ${ARENA.violet};
  border-radius: 999px;
  color: #4b4185;
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: 0.02em;
`;

const pointsCls = css`
  font-weight: 700;
  color: ${ARENA.inkSoft};
`;

const tableCls = css`
  width: 100%;
  margin-top: 0.6rem;
  border-collapse: collapse;
  th,
  td {
    padding: 0.4rem 0.5rem;
    border-top: 1px solid #dcd8ec;
    vertical-align: top;
    text-align: left;
  }
  th {
    width: 11rem;
    font-weight: 700;
  }
`;

const scoreCls = css`
  width: 4.5rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

const feedbackCls = css`
  padding-top: 0.4rem;
  border-top: 1px solid #dcd8ec;
`;

const linkCls = css`
  margin-top: 0.5rem;
  padding: 0;
  border: none;
  background: none;
  color: #4b4185;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  text-decoration: underline;
`;

const transcriptCls = css`
  white-space: pre-wrap;
  font-style: italic;
`;

const errorCls = css`
  color: #b3261e;
  font-weight: 700;
`;

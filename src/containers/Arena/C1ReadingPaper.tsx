import React, { useState } from 'react';
import { css } from '@emotion/css';
import {
  C1_READING_TASKS,
  gapLabel,
  givenWord,
  paragraphBank,
  taskQuestion
} from './examTasks';
import {
  GapPassage,
  ParagraphPlacement,
  TaskAnswer,
  TaskColumns,
  TaskText
} from './ExamTaskControls';
import { ANSWER_FLUSH_EVENT } from './useAnswerFlush';
import type { ArenaBattle, ArenaItem } from './types';

export default function C1ReadingPaper({
  items,
  passages,
  answers,
  finished,
  disabled = finished,
  onMark,
  renderReview
}: {
  items: ArenaItem[];
  passages: ArenaBattle['passages'];
  answers: Record<number, number | string | null>;
  finished: boolean;
  onMark: (no: number, value: number | string | null) => void;
  disabled?: boolean;
  renderReview: (item: ArenaItem) => React.ReactNode;
}) {
  const available = C1_READING_TASKS.map((task, index) => ({
    ...task,
    part: index + 1,
    items: items.filter((item) => item.type === task.type)
  })).filter((task) => task.items.length);
  const [part, setPart] = useState(available[0]?.part || 1);
  const [question, setQuestion] = useState<number | null>(null);
  const active = available.find((task) => task.part === part) || available[0];
  if (!active) return null;
  const current =
    active.items.find((item) => item.no === question) || active.items[0];
  const passage = passages[String(current.passageId)]?.body || '';
  const answer = (item: ArenaItem) => (
    <TaskAnswer
      item={item}
      value={answers[item.no] ?? null}
      disabled={disabled}
      onMark={(value) => onMark(item.no, value)}
    />
  );
  const questionNav = (
    <nav className={questionNavCls} aria-label="Questions in this part">
      {active.items.map((item) => (
        <button
          key={item.no}
          type="button"
          aria-current={item.no === current.no ? 'step' : undefined}
          onClick={() => navigate(active.part, item.no)}
        >
          {item.no}
          {answers[item.no] != null ? ' ✓' : ''}
        </button>
      ))}
    </nav>
  );
  let task: React.ReactNode;
  if (active.part <= 3) {
    const body =
      active.part === 3
        ? passage.replace(/(\[[A-Z0-9]+\])\s*\([A-Z]+\)/g, '$1')
        : passage;
    const gaps = Object.fromEntries(
      active.items.map((item) => [gapLabel(item), answer(item)])
    );
    const text = <GapPassage text={body} gaps={gaps} />;
    task =
      active.part === 3 ? (
        <TaskColumns
          left={text}
          right={
            <>
              <h3>Given words</h3>
              {active.items.map((item) => (
                <p key={item.no}>
                  <b>{item.no}</b> · {givenWord(item)}
                </p>
              ))}
            </>
          }
        />
      ) : (
        text
      );
  } else if (active.part === 4) {
    const [before, ...after] = (current.body || '').split(/_{2,}/);
    task = (
      <div className={transformationCls}>
        <TaskText text={passage} />
        <p>
          <strong>{givenWord(current)}</strong>
        </p>
        <p>
          {before}
          {answer(current)}
          {after.join('_____')}
        </p>
      </div>
    );
  } else if (active.part === 7) {
    const bank = paragraphBank(passage);
    task = (
      <ParagraphPlacement
        text={bank.passage}
        paragraphs={bank.paragraphs}
        items={active.items}
        gapLabels={Object.fromEntries(
          active.items.map((item) => [
            item.no,
            gapLabel(item) || String(item.no)
          ])
        )}
        answers={answers}
        disabled={disabled}
        onMark={onMark}
      />
    );
  } else {
    task = (
      <TaskColumns
        left={<TaskText text={passage} />}
        right={
          <>
            {active.items.map((item) => (
              <div className={questionCls} key={item.no}>
                <p>
                  <b>{item.no}.</b> {taskQuestion(item)}
                </p>
                {active.part === 5 ? (
                  <div id={`exam-question-${item.no}`}>
                    {item.choices.map((choice, index) => (
                      <label className={choiceCls} key={index}>
                        <input
                          type="radio"
                          name={`exam-question-${item.no}`}
                          disabled={disabled}
                          checked={answers[item.no] === index}
                          onChange={() => onMark(item.no, index)}
                        />{' '}
                        <b>{String.fromCharCode(65 + index)}</b> {choice}
                      </label>
                    ))}
                  </div>
                ) : (
                  answer(item)
                )}
              </div>
            ))}
          </>
        }
      />
    );
  }
  return (
    <section className={shellCls} aria-label="Reading and Use of English">
      <nav className={partsCls} aria-label="Reading parts">
        {available.map((value) => (
          <button
            type="button"
            key={value.part}
            aria-current={value.part === active.part ? 'page' : undefined}
            onClick={() => navigate(value.part, value.items[0].no)}
          >
            Part {value.part}
            <small>
              {value.items.filter((item) => answers[item.no] != null).length}/
              {value.items.length}
            </small>
          </button>
        ))}
      </nav>
      <div className={rubricCls}>
        <h2>
          Part {active.part} · Questions {active.items[0].no}–
          {active.items[active.items.length - 1].no}
        </h2>
        <p>{active.instruction}</p>
      </div>
      {questionNav}
      {task}
      {finished && (
        <section className={reviewCls} aria-label="Answer explanations">
          {(active.part === 4 ? [current] : active.items).map((item) => (
            <div key={item.no}>
              <h3>Question {item.no}</h3>
              {renderReview(item)}
            </div>
          ))}
        </section>
      )}
    </section>
  );

  function navigate(nextPart: number, no: number) {
    window.dispatchEvent(new Event(ANSWER_FLUSH_EVENT));
    setPart(nextPart);
    setQuestion(no);
    window.requestAnimationFrame(() =>
      document
        .getElementById(`exam-question-${no}`)
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    );
  }
}

const shellCls = css`
  font-family: Arial, Helvetica, sans-serif;
  font-size: 1.6rem;
  color: #172c40;
  background: white;
  line-height: 1.6;
  padding: 1.6rem;
  min-width: 0;
`;
const partsCls = css`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  border-bottom: 1px solid #bcc9d5;
  padding-bottom: 1rem;
  button {
    font: inherit;
    background: white;
    color: #172c40;
    border: 1px solid #bcc9d5;
    border-radius: 3px;
    padding: 0.5rem 1rem;
    cursor: pointer;
    small {
      display: block;
      font-size: 1.1rem;
    }
  }
  button[aria-current] {
    background: #e9f4fc;
    border-color: #147cb4;
  }
`;
const rubricCls = css`
  padding: 1rem 0;
  h2 {
    font-size: 1.8rem;
    margin: 0;
  }
  p {
    margin: 0.5rem 0;
  }
`;
const questionNavCls = css`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1.6rem;
  button {
    font: inherit;
    font-size: 1.3rem;
    padding: 0.4rem 0.7rem;
    background: #fff;
    color: #172c40;
    border: 1px solid #a7b5c4;
    cursor: pointer;
  }
  button[aria-current] {
    border: 2px solid #147cb4;
  }
`;
const transformationCls = css`
  max-width: 80rem;
  padding: 2rem 0;
  input {
    width: 28rem;
  }
  @media (max-width: 700px) {
    input {
      width: 19rem;
    }
  }
`;
const questionCls = css`
  margin-bottom: 2rem;
  p {
    margin: 0 0 0.7rem;
  }
`;
const choiceCls = css`
  display: block;
  padding: 0.6rem;
  border-bottom: 1px solid #e1e7ed;
  cursor: pointer;
  input {
    margin-right: 0.5rem;
  }
`;
const reviewCls = css`
  border-top: 1px solid #bcc9d5;
  margin-top: 2rem;
  h3 {
    font-size: 1.5rem;
  }
`;

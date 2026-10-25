import React from 'react';
import type { ArenaPartialCredit } from './types';

export default function PartialCreditReview({
  credit,
  ko
}: {
  credit: ArenaPartialCredit;
  ko: boolean;
}) {
  const reasons = {
    blank: ko ? '답을 쓰지 않았습니다.' : 'No answer was given.',
    'word-count': ko ? '3–6단어로 써야 합니다.' : 'Write between 3 and 6 words.',
    keyword: ko ? '제시된 단어를 바꾸지 않고 포함해야 합니다.' : 'Include the key word unchanged.',
    'full-forms': ko ? '축약형 대신 완전한 형태를 써야 합니다.' : 'Use full forms, not contractions.'
  };
  return (
    <div>
      <p><b>{credit.earned} / {credit.max} {ko ? '점' : 'marks'}</b></p>
      {credit.reason && <p>{reasons[credit.reason]}</p>}
      <ol>
        {credit.parts.map((part, index) => (
          <li key={index}>
            <b>{part.correct ? '1 / 1' : '0 / 1'}</b>{' · '}
            {part.accepted[0]}
            {part.accepted.length > 1 && (
              <details>
                <summary>{ko ? '다른 인정 답안' : 'Other accepted forms'} ({part.accepted.length - 1})</summary>
                <ul>{part.accepted.slice(1).map((form) => <li key={form}>{form}</li>)}</ul>
              </details>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

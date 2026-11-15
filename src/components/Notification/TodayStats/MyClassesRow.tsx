import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext, useKeyContext } from '~/contexts';

interface ClassSummary {
  classes: number;
  students: number;
  joinedToday: number;
  asking: number;
}

// One quiet row in Today's Progress for approved teachers (Mikey 11-15: "if
// this is the only surface area teachers might not notice this. Today's
// Progress section might be a good place"): their classes and today's joins,
// or "Make a class" when they have none. Nothing renders for anyone else,
// and the numbers are the server's.
export default function MyClassesRow({
  accentColor,
  buttonColor
}: {
  accentColor: string;
  buttonColor: string;
}) {
  const navigate = useNavigate();
  const canMakeClasses = useKeyContext((v) => v.myState.canMakeClasses);
  const loadClassSummary = useAppContext(
    (v) => v.requestHelpers.loadClassSummary
  );
  const recordClassroomEvent = useAppContext(
    (v) => v.requestHelpers.recordClassroomEvent
  );
  const [summary, setSummary] = useState<ClassSummary | null>(null);

  useEffect(() => {
    if (!canMakeClasses) return;
    let cancelled = false;
    loadClassSummary().then((data: ClassSummary | null) => {
      if (!cancelled) setSummary(data);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canMakeClasses]);

  if (!canMakeClasses || !summary) return null;
  const hasClass = summary.classes > 0;

  return (
    <div className={rowCls}>
      <Icon icon="qrcode" style={{ color: accentColor, fontSize: '1.6rem' }} />
      <div className="classes-text">
        <b style={{ color: accentColor }}>My classes</b>
        <span>
          {hasClass
            ? `${summary.classes} class${summary.classes === 1 ? '' : 'es'} · ${
                summary.joinedToday
              } joined today${
                summary.asking ? ` · ${summary.asking} asking` : ''
              }`
            : summary.asking
              ? `${summary.asking} asking for an account`
              : 'Students join without email'}
        </span>
      </div>
      <Button
        color={buttonColor}
        variant="soft"
        tone="raised"
        size="sm"
        uppercase={false}
        onClick={handleOpen}
      >
        {hasClass ? 'Open' : 'Make a class'}
      </Button>
    </div>
  );

  function handleOpen() {
    recordClassroomEvent({
      kind: 'progress_row',
      detail: hasClass ? 'open' : 'make'
    });
    navigate('/my-classes');
  }
}

// the same panel shape as Live now, one row tall
const rowCls = css`
  margin: 1rem auto 0;
  max-width: 40rem;
  padding: 0.7rem 1rem;
  border: 1px solid var(--ui-border);
  border-radius: 1.25rem;
  background: rgba(255, 255, 255, 0.98);
  display: flex;
  align-items: center;
  gap: 0.9rem;
  .classes-text {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    line-height: 1.3;
    text-align: left;
  }
  .classes-text b {
    font-size: 1.3rem;
  }
  .classes-text span {
    font-size: 1.2rem;
    color: #666;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

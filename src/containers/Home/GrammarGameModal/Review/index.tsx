import React, { useEffect, useMemo, useRef, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { useAppContext } from '~/contexts';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import MissionChoiceList from '~/containers/MissionPage/Main/MissionModule/Grammar/Questions/ChoiceList';
import LetterGrade from '../Marble/LetterGrade';

interface ReviewItem {
  id: number;
  questionId: number;
  level: number;
  grade?: string;
  selectedChoiceIndex?: number | null;
  answerIndex: number;
  timeStamp: number;
  question: string;
  choices: string[];
  questionRating?: number;
}

export default function Review() {
  const loadGrammarReview = useAppContext(
    (v) => v.requestHelpers.loadGrammarReview
  );
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastId, setLastId] = useState<number | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    (async () => {
      setLoading(true);
      try {
        const { items: rows = [], lastId: next } = await loadGrammarReview({
          limit: 10
        });
        setItems(rows);
        setLastId(next || null);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadGrammarReview]);

  const hasMore = useMemo(() => !!lastId, [lastId]);

  const [answerState, setAnswerState] = useState<{
    [id: number]: {
      selectedIndex: number | null;
      status: '' | 'pass' | 'fail';
    };
  }>({});

  async function handleLoadMore() {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const { items: rows = [], lastId: next } = await loadGrammarReview({
        lastId,
        limit: 10
      });
      setItems((prev) => [...prev, ...rows]);
      setLastId(next || null);
    } finally {
      setLoadingMore(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <ErrorBoundary componentPath="Earn/GrammarGameModal/Review">
      <div className={containerCls}>
        {items.map((it) => {
          const current = answerState[it.id] || {
            selectedIndex: null,
            status: '' as ''
          };
          const listItems = it.choices.map((label, idx) => ({
            label,
            checked: current.selectedIndex === idx
          }));
          return (
            <div key={it.id} className={itemCls}>
              <div className={qHeaderCls}>
                <LetterGrade letter={it.grade || ''} size={28} />
                <div className={metaCls}>
                  <span>QID {it.questionId}</span>
                  {typeof it.questionRating === 'number' && (
                    <>
                      <span> | </span>
                      <span>Rating {it.questionRating}</span>
                    </>
                  )}
                </div>
              </div>
              <div className={questionCls}>{it.question}</div>
              <MissionChoiceList
                answerIndex={it.answerIndex}
                conditionPassStatus={current.status}
                listItems={listItems}
                onSelect={(selectedIndex: number) => {
                  const status =
                    selectedIndex === it.answerIndex ? 'pass' : 'fail';
                  setAnswerState((prev) => ({
                    ...prev,
                    [it.id]: { selectedIndex, status }
                  }));
                }}
                style={{ marginTop: '1rem' }}
              />
            </div>
          );
        })}
        {hasMore && (
          <LoadMoreButton
            filled
            loading={loadingMore}
            onClick={handleLoadMore}
          />
        )}
        {!items.length && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: Color.gray(),
              height: '15rem'
            }}
          >
            No solved questions to review yet.
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

const containerCls = css`
  width: 100%;
  max-width: 820px;
  padding: 1rem 1.5rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1rem;
  }
`;

const itemCls = css`
  background: ${Color.whiteGray()};
  border: 1px solid ${Color.borderGray()};
  border-radius: 10px;
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
`;

const questionCls = css`
  font-size: 1.6rem;
  font-weight: 600;
  margin-top: 0.5rem;
`;

// Deprecated legacy list styles removed (we leverage MissionChoiceList)

const qHeaderCls = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const metaCls = css`
  font-size: 1.2rem;
  color: ${Color.darkerGray()};
`;

// Grade badge is centralized as <LetterGrade />

// No correctness badge in review; focus on interactive reveal only

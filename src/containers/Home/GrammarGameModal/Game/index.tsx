import React from 'react';
import Loading from '~/components/Loading';
import Main from './Main';

export default function Game({
  currentIndex,
  isOnStreak,
  questionIds,
  questionObjRef,
  onGameFinish,
  onSetCurrentIndex,
  onSetQuestionObj
}: {
  currentIndex: number;
  isOnStreak: boolean;
  questionIds: any[];
  questionObjRef: React.MutableRefObject<any>;
  onGameFinish: any;
  onSetCurrentIndex: any;
  onSetQuestionObj: any;
}) {
  return (
    <div style={{ width: '100%', paddingTop: '3.5rem' }}>
      {questionIds.length > 0 ? (
        <Main
          currentIndex={currentIndex}
          questionIds={questionIds}
          questionObjRef={questionObjRef}
          isOnStreak={isOnStreak}
          onGameFinish={onGameFinish}
          onSetCurrentIndex={onSetCurrentIndex}
          onSetQuestionObj={onSetQuestionObj}
        />
      ) : (
        <Loading />
      )}
    </div>
  );
}

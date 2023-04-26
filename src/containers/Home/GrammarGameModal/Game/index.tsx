import React from 'react';
import Loading from '~/components/Loading';
import Main from './Main';

export default function Game({
  isOnStreak,
  questionIds,
  questionObj,
  onGameFinish,
  onSetQuestionObj
}: {
  isOnStreak: boolean;
  questionIds: any[];
  questionObj: any;
  onGameFinish: any;
  onSetQuestionObj: any;
}) {
  return (
    <div style={{ width: '100%', paddingTop: '3.5rem' }}>
      {questionIds.length > 0 ? (
        <Main
          questionIds={questionIds}
          questionObj={questionObj}
          isOnStreak={isOnStreak}
          onGameFinish={onGameFinish}
          onSetQuestionObj={onSetQuestionObj}
        />
      ) : (
        <Loading />
      )}
    </div>
  );
}

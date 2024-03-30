import React from 'react';
import Loading from '~/components/Loading';
import Main from './Main';

export default function Game({
  currentIndex,
  isOnStreak,
  questionIds,
  questionObjRef,
  onGameFinish,
  onSetTriggerEffect,
  onSetCurrentIndex,
  onSetQuestionObj,
  triggerEffect
}: {
  currentIndex: number;
  isOnStreak: boolean;
  questionIds: any[];
  questionObjRef: React.MutableRefObject<any>;
  onGameFinish: any;
  onSetTriggerEffect: any;
  onSetCurrentIndex: any;
  onSetQuestionObj: any;
  triggerEffect: boolean;
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
          triggerEffect={triggerEffect}
          onSetTriggerEffect={onSetTriggerEffect}
          onSetCurrentIndex={onSetCurrentIndex}
          onSetQuestionObj={onSetQuestionObj}
        />
      ) : (
        <Loading />
      )}
    </div>
  );
}

import React from 'react';
import Loading from '~/components/Loading';
import Main from './Main';

export default function MarbleQuestions({
  currentIndex,
  isOnStreak,
  questionIds,
  questionObjRef,
  onGameFinish,
  onSetTriggerEffect,
  onSetCurrentIndex,
  onSetQuestionObj,
  triggerEffect,
  style
}: {
  currentIndex: number;
  isOnStreak: boolean;
  questionIds: any[];
  questionObjRef: React.RefObject<any>;
  onGameFinish: any;
  onSetTriggerEffect: any;
  onSetCurrentIndex: any;
  onSetQuestionObj: any;
  triggerEffect: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ width: '100%', ...style }}>
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

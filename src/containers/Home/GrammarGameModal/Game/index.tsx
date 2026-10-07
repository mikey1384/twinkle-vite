import React from 'react';
import { css } from '@emotion/css';
import Loading from '~/components/Loading';
import Main from './Main';
import type { GrammarAnswerCheck } from '../answerCheck';

export default function Game({
  currentIndex,
  isOnStreak,
  questionIds,
  questionObjRef,
  onCheckAnswer,
  onSessionLost,
  onGameFinish,
  onSetTriggerEffect,
  onSetCurrentIndex,
  onSetQuestionObj,
  triggerEffect
}: {
  currentIndex: number;
  isOnStreak: boolean;
  questionIds: any[];
  questionObjRef: React.RefObject<any>;
  onCheckAnswer: GrammarAnswerCheck;
  onSessionLost: () => void;
  onGameFinish: any;
  onSetTriggerEffect: any;
  onSetCurrentIndex: any;
  onSetQuestionObj: any;
  triggerEffect: boolean;
}) {
  return (
    <div
      className={css`
        width: 100%;
        padding-top: 3.5rem;
        /* short screens: less headroom so the choices and track fit */
        @media (max-height: 760px) {
          padding-top: 1.5rem;
        }
      `}
    >
      {questionIds.length > 0 ? (
        <Main
          currentIndex={currentIndex}
          questionIds={questionIds}
          questionObjRef={questionObjRef}
          isOnStreak={isOnStreak}
          onCheckAnswer={onCheckAnswer}
          onSessionLost={onSessionLost}
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

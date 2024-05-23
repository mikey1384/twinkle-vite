import React from 'react';
import { css } from '@emotion/css';
import ListenSection from './ListenSection';
import { innerBorderRadius } from '~/constants/css';

export default function Listening({
  difficulty,
  isGrading,
  onGrade,
  onReset,
  onLoadQuestions,
  onSetAttemptId,
  onSetStoryId,
  onSetUserChoiceObj,
  questions,
  questionsLoaded,
  questionsLoadError,
  solveObj,
  storyId,
  topic,
  topicKey,
  type,
  userChoiceObj
}: {
  difficulty: number;
  isGrading: boolean;
  onGrade: () => void;
  onReset: () => void;
  onLoadQuestions: (storyId: number) => void;
  onSetAttemptId: (attemptId: number) => void;
  onSetStoryId: (storyId: number) => void;
  onSetUserChoiceObj: (userChoiceObj: any) => void;
  questions: any[];
  questionsLoaded: boolean;
  questionsLoadError: boolean;
  solveObj: any;
  storyId: number;
  topic: string;
  topicKey: string;
  type: string;
  userChoiceObj: any;
}) {
  return (
    <div
      className={css`
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #333;
        border-top-left-radius: ${innerBorderRadius};
        border-top-right-radius: ${innerBorderRadius};
      `}
    >
      <ListenSection
        difficulty={difficulty}
        isGrading={isGrading}
        onLoadQuestions={onLoadQuestions}
        onGrade={onGrade}
        onReset={onReset}
        onSetStoryId={onSetStoryId}
        onSetAttemptId={onSetAttemptId}
        onSetUserChoiceObj={onSetUserChoiceObj}
        questions={questions}
        questionsLoaded={questionsLoaded}
        questionsLoadError={questionsLoadError}
        solveObj={solveObj}
        storyId={storyId}
        topic={topic}
        topicKey={topicKey}
        type={type}
        userChoiceObj={userChoiceObj}
      />
    </div>
  );
}

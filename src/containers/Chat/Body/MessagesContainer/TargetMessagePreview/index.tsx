import React from 'react';
import TargetMessage from './TargetMessage';
import WordleResult from './WordleResult';
import { getReplyTargetEntry } from '~/containers/Chat/Message/MessageBody/replyTargetSummary';

export default function TargetMessagePreview({
  onClose,
  replyTarget
}: {
  onClose: () => void;
  replyTarget: {
    [key: string]: any;
    userId: number;
    username: string;
    timeStamp: number;
    wordleResult: {
      result: string;
      solution: string;
      solutionId: number;
      solutionType: string;
      solutionUserId: number;
      solutionUsername: string;
    };
  };
}) {
  return (
    <div
      style={{
        height: '12rem',
        width: '100%',
        position: 'relative',
        padding: '1rem 6rem 2rem 0.5rem',
        marginBottom: '2px'
      }}
    >
      {getReplyTargetEntry(replyTarget) === 'wordle' ? (
        <WordleResult
          userId={replyTarget.userId}
          username={replyTarget.username}
          timeStamp={replyTarget.timeStamp}
          wordleResult={replyTarget.wordleResult}
          onClose={onClose}
        />
      ) : (
        <TargetMessage onClose={onClose} replyTarget={replyTarget} />
      )}
    </div>
  );
}

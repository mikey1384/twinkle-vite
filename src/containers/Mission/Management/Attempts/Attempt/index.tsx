import React from 'react';
import FileViewer from '~/components/FileViewer';
import UsernameText from '~/components/Texts/UsernameText';
import ApproveInterface from './ApproveInterface';
import RichText from '~/components/Texts/RichText';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { timeSince } from '~/helpers/timeStampHelpers';
import { useKeyContext } from '~/contexts';
import { stringIsEmpty } from '~/helpers/stringHelpers';

export default function Attempt({
  activeTab,
  attempt,
  managementObj,
  onSetManagementObj,
  onSetAttemptObj,
  style
}: {
  activeTab: string;
  attempt: {
    id: number;
    uploader: { id: number; username: string };
    timeStamp: number;
    answers: any[];
    content: string;
    filePath: string;
    thumbUrl: string;
    status: string;
    reviewer: { id: number; username: string };
    reviewTimeStamp: number;
    feedback: string;
  };
  managementObj: { [key: string]: any };
  onSetManagementObj: (arg0: any) => void;
  onSetAttemptObj: (arg0: any) => void;
  style?: React.CSSProperties;
}) {
  const {
    link: { color: linkColor }
  } = useKeyContext((v) => v.theme);
  return (
    <div
      style={{ width: '100%', paddingBottom: '1.5rem', ...style }}
      className={css`
        width: 60%;
        background: #fff;
        padding: 1rem;
        border: 1px solid ${Color.borderGray()};
        border-radius: ${borderRadius};
        @media (max-width: ${mobileMaxWidth}) {
          width: 100%;
          border-radius: 0;
          border-left: 0;
          border-right: 0;
        }
      `}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <UsernameText
          style={{ fontSize: '2rem' }}
          color={Color[linkColor]()}
          user={attempt.uploader}
        />
        <div style={{ fontSize: '1.5rem', color: Color.darkGray() }}>
          {timeSince(attempt.timeStamp)}
        </div>
      </div>
      {attempt.answers && (
        <div style={{ marginTop: '2rem', marginBottom: '3rem' }}>
          {attempt.answers.map((answer, index) => (
            <div
              style={{
                fontSize: '1.7rem',
                marginTop: index === 0 ? 0 : '2rem'
              }}
              key={answer.questionId}
            >
              <p style={{ fontWeight: 'bold' }}>Q: {answer.question}</p>
              <RichText>{'A: ' + answer?.answer || ''}</RichText>
            </div>
          ))}
        </div>
      )}
      {attempt.content && (
        <div
          style={{
            fontSize: '1.5rem',
            marginTop: '2rem',
            paddingBottom: '1.5rem'
          }}
        >
          <RichText>{attempt.content}</RichText>
        </div>
      )}
      {attempt.filePath && (
        <FileViewer
          style={{ marginTop: '2rem' }}
          thumbUrl={attempt.thumbUrl}
          src={attempt.filePath}
        />
      )}
      {attempt.status === 'pending' && (
        <ApproveInterface
          managementObj={managementObj}
          activeTab={activeTab}
          attempt={attempt}
          onSetManagementObj={onSetManagementObj}
          onSetAttemptObj={onSetAttemptObj}
        />
      )}
      {(attempt.status === 'pass' || attempt.status === 'fail') && (
        <div
          style={{
            marginTop: '2rem',
            fontSize: '1.5rem',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {attempt.reviewer && (
            <div>
              <UsernameText
                style={{ fontSize: '1.5rem' }}
                color={Color[linkColor]()}
                user={attempt.reviewer}
              />{' '}
              <span>
                {attempt.status === 'pass' ? 'approved' : 'rejected'} this
                attempt
              </span>{' '}
              <span>{timeSince(attempt.reviewTimeStamp)}</span>
            </div>
          )}
          {!stringIsEmpty(attempt.feedback) && (
            <div
              style={{
                marginTop: '1rem',
                padding: '1rem',
                border: `1px solid ${Color.borderGray()}`,
                borderRadius
              }}
            >
              <RichText>{attempt.feedback}</RichText>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

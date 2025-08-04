import React from 'react';
import FileViewer from '~/components/FileViewer';
import UsernameText from '~/components/Texts/UsernameText';
import ApproveInterface from './ApproveInterface';
import RichText from '~/components/Texts/RichText';
import { Color, borderRadius } from '~/constants/css';
import { panel } from '../../../../Styles';
import { timeSince } from '~/helpers/timeStampHelpers';
import { useKeyContext } from '~/contexts';
import { stringIsEmpty } from '~/helpers/stringHelpers';

export default function Attempt({
  activeTab,
  attempt,
  onSetMissionState,
  mission,
  style
}: {
  activeTab: string;
  attempt: any;
  onSetMissionState: (arg0: any) => void;
  mission: any;
  style?: React.CSSProperties;
}) {
  const linkColor = useKeyContext((v) => v.theme.link.color);
  return (
    <div
      style={{ width: '100%', paddingBottom: '1.5rem', ...style }}
      className={panel}
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
          {attempt.answers.map((answer: any, index: number) => (
            <div
              style={{
                fontSize: '1.7rem',
                marginTop: index === 0 ? 0 : '2rem'
              }}
              key={answer.questionId}
            >
              <p style={{ fontWeight: 'bold' }}>Q: {answer.question}</p>
              <div
                style={{
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word'
                }}
              >
                <RichText>{'A: ' + answer?.answer || ''}</RichText>
              </div>
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
          activeTab={activeTab}
          onSetMissionState={onSetMissionState}
          mission={mission}
          attempt={attempt}
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

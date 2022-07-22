import React from 'react';
import PropTypes from 'prop-types';
import FileViewer from '~/components/FileViewer';
import UsernameText from '~/components/Texts/UsernameText';
import ApproveInterface from './ApproveInterface';
import LongText from '~/components/Texts/LongText';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { timeSince } from '~/helpers/timeStampHelpers';
import { useKeyContext } from '~/contexts';
import { stringIsEmpty, processedStringWithURL } from '~/helpers/stringHelpers';

Attempt.propTypes = {
  activeTab: PropTypes.string.isRequired,
  attempt: PropTypes.object.isRequired,
  managementObj: PropTypes.object.isRequired,
  onSetManagementObj: PropTypes.func.isRequired,
  onSetAttemptObj: PropTypes.func.isRequired,
  style: PropTypes.object
};

export default function Attempt({
  activeTab,
  attempt,
  managementObj,
  onSetManagementObj,
  onSetAttemptObj,
  style
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
              <p
                style={{
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word'
                }}
                dangerouslySetInnerHTML={{
                  __html: `A: ${processedStringWithURL(answer?.answer || '')}`
                }}
              />
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
          <LongText>{attempt.content}</LongText>
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
              <LongText>{attempt.feedback}</LongText>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

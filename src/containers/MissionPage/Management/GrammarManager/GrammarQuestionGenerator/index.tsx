import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Input from '~/components/Texts/Input';
import Button from '~/components/Button';
import { css } from '@emotion/css';
import { capitalize, stringIsEmpty } from '~/helpers/stringHelpers';
import {
  Color,
  borderRadius,
  mobileMaxWidth,
  tabletMaxWidth
} from '~/constants/css';
import { useAppContext } from '~/contexts';
import SubmittedQuestions from './SubmittedQuestions';

GrammarQuestionGenerator.propTypes = {
  mission: PropTypes.object.isRequired,
  onSetMissionState: PropTypes.func.isRequired,
  style: PropTypes.object
};

export default function GrammarQuestionGenerator({
  mission,
  onSetMissionState,
  style
}: {
  mission: any;
  onSetMissionState: (arg0: any) => void;
  style?: React.CSSProperties;
}) {
  const uploadGrammarQuestion = useAppContext(
    (v) => v.requestHelpers.uploadGrammarQuestion
  );
  const [questionAlreadyExists, setQuestionAlreadyExists] = useState(false);
  const [leftSideText, setLeftSideText] = useState('');
  const [rightSideText, setRightSideText] = useState('');
  const [correctChoice, setCorrectChoice] = useState('');
  const [wrongChoice1, setWrongChoice1] = useState('');
  const [wrongChoice2, setWrongChoice2] = useState('');
  const [wrongChoice3, setWrongChoice3] = useState('');

  const finalLeftSideText = useMemo(() => {
    return capitalize(leftSideText.trim());
  }, [leftSideText]);

  const finalRightSideText = useMemo(() => {
    if (stringIsEmpty(rightSideText)) {
      return '.';
    }
    if (
      !rightSideText ||
      ['.', '?', '!'].includes(rightSideText) ||
      rightSideText[0] === ','
    ) {
      return rightSideText;
    }
    const trimmedRightSideText = rightSideText.trim();
    if (
      /^[a-zA-Z0-9]+$/i.test(
        trimmedRightSideText[trimmedRightSideText.length - 1]
      )
    ) {
      return `${trimmedRightSideText}.`;
    }
    return trimmedRightSideText;
  }, [rightSideText]);

  const submitDisabled = useMemo(() => {
    if (stringIsEmpty(leftSideText) && stringIsEmpty(rightSideText)) {
      return true;
    }
    if (
      stringIsEmpty(correctChoice) ||
      stringIsEmpty(wrongChoice1) ||
      stringIsEmpty(wrongChoice2) ||
      stringIsEmpty(wrongChoice3)
    ) {
      return true;
    }
    return false;
  }, [
    correctChoice,
    leftSideText,
    rightSideText,
    wrongChoice1,
    wrongChoice2,
    wrongChoice3
  ]);

  useEffect(() => {
    setQuestionAlreadyExists(false);
  }, [leftSideText, rightSideText]);

  return (
    <div style={style}>
      <div
        className={css`
          > h2 {
            font-size: 2.3rem;
          }
          h3 {
            font-size: 1.7rem;
          }
          width: 100%;
          display: flex;
          flex-direction: column;
          background: #fff;
          padding: 1rem 1rem 1.5rem 1rem;
          border: 1px solid ${Color.borderGray()};
          border-radius: ${borderRadius};
          @media (max-width: ${tabletMaxWidth}) {
            > h2 {
              font-size: 2rem;
            }
          }
          @media (max-width: ${mobileMaxWidth}) {
            border-radius: 0;
            border-left: 0;
            border-right: 0;
          }
        `}
      >
        <h2>Grammar Question Generator</h2>
        {(!stringIsEmpty(leftSideText) || !stringIsEmpty(rightSideText)) && (
          <div
            style={{
              width: '100%',
              textAlign: 'center',
              marginTop: '5rem',
              fontSize: '2rem'
            }}
          >
            {finalLeftSideText[finalLeftSideText.length - 1] === `"`
              ? finalLeftSideText
              : `${finalLeftSideText} `}
            _____
            {['.', '?', '!'].includes(finalRightSideText) ||
            ['.', `"`, ','].includes(finalRightSideText[0])
              ? finalRightSideText
              : ` ${finalRightSideText}`}
          </div>
        )}
        <div
          className={css`
            margin-top: 2rem;
            display: flex;
            justify-content: center;
            align-items: flex-end;
            font-size: 1.5rem;
          `}
        >
          <Input
            onChange={setLeftSideText}
            placeholder="Enter text that goes to the left side of the blank"
            value={leftSideText}
          />
          <span style={{ margin: '0 1rem' }}>_____</span>
          <Input
            onChange={setRightSideText}
            placeholder="Enter text that goes to the right side of the blank"
            value={rightSideText}
          />
        </div>
        <div
          style={{
            marginTop: '3rem',
            display: 'flex',
            width: '100%',
            justifyContent: 'center'
          }}
        >
          <div
            className={css`
              width: 50%;
              @media (max-width: ${tabletMaxWidth}) {
                width: 100%;
              }
            `}
            style={{
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <h3>Enter the correct choice</h3>
            <Input
              style={{ marginTop: '1rem' }}
              onChange={setCorrectChoice}
              placeholder="Enter the correct choice"
              value={correctChoice}
            />
            <h3 style={{ marginTop: '3rem' }}>Enter 3 wrong choices</h3>
            <Input
              style={{ marginTop: '1rem' }}
              onChange={setWrongChoice1}
              placeholder="Enter a wrong choice"
              value={wrongChoice1}
            />
            <Input
              style={{ marginTop: '1rem' }}
              onChange={setWrongChoice2}
              placeholder="Enter a wrong choice"
              value={wrongChoice2}
            />
            <Input
              style={{ marginTop: '1rem' }}
              onChange={setWrongChoice3}
              placeholder="Enter a wrong choice"
              value={wrongChoice3}
            />
          </div>
        </div>
        <div
          style={{
            marginTop: '3rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Button
            disabled={submitDisabled}
            style={{ fontSize: '2rem' }}
            color="logoBlue"
            filled
            onClick={handleSubmitQuestion}
          >
            Submit
          </Button>
        </div>
        {questionAlreadyExists && (
          <div
            style={{
              color: 'red',
              width: '100%',
              textAlign: 'center',
              marginTop: '1rem',
              fontSize: '1.2rem'
            }}
          >
            That question already exists
          </div>
        )}
      </div>
      <SubmittedQuestions
        style={{ marginTop: '2rem' }}
        mission={mission}
        onSetMissionState={onSetMissionState}
      />
    </div>
  );

  async function handleSubmitQuestion() {
    const { alreadyExists, question } = await uploadGrammarQuestion({
      leftSideText: finalLeftSideText,
      rightSideText: finalRightSideText,
      correctChoice,
      wrongChoice1,
      wrongChoice2,
      wrongChoice3
    });
    if (alreadyExists) {
      return setQuestionAlreadyExists(true);
    }
    onSetMissionState({
      missionId: mission.id,
      newState: {
        pendingQuestionIds: [question.id].concat(
          mission.pendingQuestionIds || []
        ),
        questionObj: {
          ...mission.questionObj,
          [question.id]: question
        }
      }
    });
    setLeftSideText('');
    setRightSideText('');
    setCorrectChoice('');
    setWrongChoice1('');
    setWrongChoice2('');
    setWrongChoice3('');
  }
}

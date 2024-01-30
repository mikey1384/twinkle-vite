import React from 'react';
import RichText from '~/components/Texts/RichText';
import GradientButton from '~/components/Buttons/GradientButton';
import Button from '~/components/Button';
import { mobileMaxWidth, tabletMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function Story({
  story,
  isGraded,
  explanation,
  onFinishRead,
  questionsButtonEnabled
}: {
  story: string;
  isGraded: boolean;
  explanation: string;
  onFinishRead: () => void;
  questionsButtonEnabled: boolean;
}) {
  return (
    <div
      className={css`
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
      `}
    >
      <div
        className={css`
          user-select: ${isGraded ? 'text' : 'none'};
          width: 50%;
          font-family: 'Poppins', sans-serif;
          @media (max-width: ${tabletMaxWidth}) {
            width: 70%;
          }
          @media (max-width: ${mobileMaxWidth}) {
            width: 100%;
          }
        `}
      >
        <RichText isAIMessage style={{ lineHeight: 2 }} maxLines={1000}>
          {story}
        </RichText>
      </div>
      {explanation && (
        <div
          className={css`
            margin-top: 10rem;
            width: 50%;
            @media (max-width: ${tabletMaxWidth}) {
              width: 70%;
            }
            @media (max-width: ${mobileMaxWidth}) {
              width: 100%;
            }
          `}
        >
          <p
            className={css`
              font-size: 2rem;
              font-weight: bold;
              margin-bottom: 3rem;
              @media (max-width: ${tabletMaxWidth}) {
                font-size: 1.8rem;
              }
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.7rem;
              }
            `}
          >
            Vocabulary
          </p>
          <RichText
            isAIMessage
            className={css`
              font-size: 1.7rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.5rem;
              }
            `}
            style={{ lineHeight: 1.5 }}
            maxLines={1000}
          >
            {explanation}
          </RichText>
        </div>
      )}
      {story && (
        <div
          style={{
            marginTop: '10rem',
            width: '100%',
            justifyContent: 'center',
            display: 'flex'
          }}
        >
          {isGraded ? (
            <Button filled color="orange" onClick={onFinishRead}>
              Review Questions
            </Button>
          ) : (
            <GradientButton
              loading={!questionsButtonEnabled}
              onClick={onFinishRead}
            >
              {questionsButtonEnabled ? 'Solve Questions' : 'Generating...'}
            </GradientButton>
          )}
        </div>
      )}
    </div>
  );
}

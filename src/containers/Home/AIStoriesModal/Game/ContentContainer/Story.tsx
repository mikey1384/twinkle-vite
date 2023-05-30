import React from 'react';
import RichText from '~/components/Texts/RichText';
import GradientButton from '~/components/Buttons/GradientButton';
import Button from '~/components/Button';

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
      className="unselectable"
      style={{ width: '100%', fontFamily: '"Arial", sans-serif' }}
    >
      <RichText maxLines={100}>{story}</RichText>
      {explanation && (
        <div style={{ marginTop: '7rem', marginBottom: '1rem' }}>
          ===============================
        </div>
      )}
      <RichText maxLines={100}>{explanation}</RichText>
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

import React, { useEffect } from 'react';
import RichText from '~/components/Texts/RichText';
import GradientButton from '~/components/Buttons/GradientButton';
import Button from '~/components/Button';

export default function Story({
  story,
  isGraded,
  explanation,
  onLoadQuestions,
  onFinishRead,
  questionsLoaded
}: {
  story: string;
  isGraded: boolean;
  explanation: string;
  onLoadQuestions: () => void;
  onFinishRead: () => void;
  questionsLoaded: boolean;
}) {
  useEffect(() => {
    if (!questionsLoaded) {
      onLoadQuestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionsLoaded]);

  return (
    <div
      className="unselectable"
      style={{ width: '100%', fontFamily: '"Arial", sans-serif' }}
    >
      <RichText maxLines={100}>{story}</RichText>
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
            <GradientButton onClick={onFinishRead}>
              Solve Questions
            </GradientButton>
          )}
        </div>
      )}
      {explanation && (
        <div style={{ marginTop: '7rem', marginBottom: '1rem' }}>
          ===============================
        </div>
      )}
      <RichText maxLines={100}>{explanation}</RichText>
    </div>
  );
}

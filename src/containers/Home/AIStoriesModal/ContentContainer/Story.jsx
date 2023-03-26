import { useEffect } from 'react';
import PropTypes from 'prop-types';
import LongText from '~/components/Texts/LongText';
import GradientButton from '~/components/Buttons/GradientButton';

Story.propTypes = {
  explanation: PropTypes.string,
  onFinishRead: PropTypes.func.isRequired,
  onLoadQuestions: PropTypes.func.isRequired,
  story: PropTypes.string.isRequired
};

export default function Story({
  story,
  explanation,
  onLoadQuestions,
  onFinishRead
}) {
  useEffect(() => {
    onLoadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ width: '100%' }}>
      <LongText maxLines={100}>{story}</LongText>
      {!!story && (
        <div
          style={{
            marginTop: '10rem',
            width: '100%',
            justifyContent: 'center',
            display: 'flex'
          }}
        >
          <GradientButton onClick={onFinishRead}>
            Finished Reading
          </GradientButton>
        </div>
      )}
      {explanation ? (
        <div style={{ marginTop: '7rem', marginBottom: '1rem' }}>
          ===============================
        </div>
      ) : (
        ''
      )}
      <LongText maxLines={100}>{explanation}</LongText>
    </div>
  );
}

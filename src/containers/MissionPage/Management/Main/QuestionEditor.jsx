import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useAppContext } from '~/contexts';
import { Color } from '~/constants/css';
import ErrorBoundary from '~/components/ErrorBoundary';

QuestionEditor.propTypes = {
  missionId: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
};

export default function QuestionEditor({ missionId }) {
  const [questions, setQuestions] = useState([]);
  const loadGoogleMissionQuestions = useAppContext(
    (v) => v.requestHelpers.loadGoogleMissionQuestions
  );
  useEffect(() => {
    init();
    async function init() {
      const { questionObj, questionIds } = await loadGoogleMissionQuestions({
        missionId
      });
      setQuestions(questionIds.map((id) => questionObj[id]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionId]);

  return (
    <ErrorBoundary componentPath="MissionPage/Main/QuestionEditor">
      <div>
        {questions.map((question, index) => (
          <div
            style={{
              background: '#fff',
              marginTop: index === 0 ? '0' : '1rem',
              padding: '2rem',
              fontSize: '1.7rem',
              textAlign: 'center',
              border: `1px solid ${Color.borderGray()}`
            }}
            key={question.id}
          >
            {question.content}
          </div>
        ))}
      </div>
    </ErrorBoundary>
  );
}

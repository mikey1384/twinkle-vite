import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useAppContext } from '~/contexts';
import { Color } from '~/constants/css';
import Loading from '~/components/Loading';
import ErrorBoundary from '~/components/ErrorBoundary';

QuestionEditor.propTypes = {
  missionId: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
};

export default function QuestionEditor({ missionId }) {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const loadGoogleMissionQuestions = useAppContext(
    (v) => v.requestHelpers.loadGoogleMissionQuestions
  );
  useEffect(() => {
    init();
    async function init() {
      setLoading(true);
      const { questionObj, questionIds } = await loadGoogleMissionQuestions({
        missionId
      });
      setQuestions(questionIds.map((id) => questionObj[id]));
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionId]);

  return (
    <ErrorBoundary componentPath="MissionPage/Main/QuestionEditor">
      <div>
        {loading ? (
          <Loading />
        ) : (
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
        )}
      </div>
    </ErrorBoundary>
  );
}

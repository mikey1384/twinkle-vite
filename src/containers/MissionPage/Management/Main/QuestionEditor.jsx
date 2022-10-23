import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useAppContext } from '~/contexts';
import { Color } from '~/constants/css';
import Loading from '~/components/Loading';
import ErrorBoundary from '~/components/ErrorBoundary';
import Textarea from '~/components/Texts/Textarea';
import Button from '~/components/Button';
import Icon from '~/components/Icon';

QuestionEditor.propTypes = {
  missionId: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
};

export default function QuestionEditor({ missionId }) {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [inputText, setInputText] = useState('');
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
        <div
          style={{
            marginTop: '3rem',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Textarea
            style={{
              fontSize: '1.7rem'
            }}
            minRows={3}
            value={inputText}
            placeholder="Enter new questions here"
            onChange={(event) => setInputText(event.target.value)}
          />
          <Button
            style={{ marginTop: '1rem', alignSelf: 'flex-end' }}
            color="blue"
            filled
            onClick={() => console.log('clicked')}
          >
            <Icon icon="plus" />
            <span style={{ marginLeft: '0.7rem' }}>Add</span>
          </Button>
        </div>
        {loading ? (
          <Loading />
        ) : (
          <div style={{ marginTop: '3rem' }}>
            <p style={{ fontWeight: 'bold', fontSize: '2rem' }}>
              Registered questions
            </p>
            <div style={{ marginTop: '1.7rem' }}>
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
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

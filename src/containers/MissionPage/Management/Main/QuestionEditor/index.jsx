import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useAppContext } from '~/contexts';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import Loading from '~/components/Loading';
import ErrorBoundary from '~/components/ErrorBoundary';
import Textarea from '~/components/Texts/Textarea';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import Questions from './Questions';

QuestionEditor.propTypes = {
  missionId: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
};

export default function QuestionEditor({ missionId }) {
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [questionIds, setQuestionIds] = useState([]);
  const [questionObj, setQuestionObj] = useState({});
  const [inputText, setInputText] = useState('');
  const loadGoogleMissionQuestions = useAppContext(
    (v) => v.requestHelpers.loadGoogleMissionQuestions
  );
  const uploadGoogleQuestion = useAppContext(
    (v) => v.requestHelpers.uploadGoogleQuestion
  );
  const inputDisabled = useMemo(() => {
    return stringIsEmpty(inputText);
  }, [inputText]);

  useEffect(() => {
    init();
    async function init() {
      setLoading(true);
      const { questionObj, questionIds } = await loadGoogleMissionQuestions({
        missionId
      });
      setQuestionObj(questionObj);
      setQuestionIds(questionIds);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionId]);

  const questions = useMemo(() => {
    return questionIds.map((questionId) => questionObj[questionId] || []);
  }, [questionIds, questionObj]);

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
            loading={isAdding}
            disabled={inputDisabled}
            color="blue"
            filled
            onClick={handleNewQuestionSubmit}
          >
            <Icon icon="plus" />
            <span style={{ marginLeft: '0.7rem' }}>Add</span>
          </Button>
        </div>
        {loading ? (
          <Loading />
        ) : (
          <Questions
            onSetQuestionObj={setQuestionObj}
            approvedQuestions={questions.filter(
              (question) => question.isApproved
            )}
            pendingQuestions={questions.filter(
              (question) => !question.isApproved
            )}
          />
        )}
      </div>
    </ErrorBoundary>
  );

  async function handleNewQuestionSubmit() {
    setInputText('');
    setIsAdding(true);
    const { alreadyExists, question } = await uploadGoogleQuestion({
      missionId,
      questionText: inputText
    });
    if (alreadyExists) {
      setIsAdding(false);
      return alert('Question already exists');
    }
    setQuestionIds((prev) => [question.id, ...prev]);
    setQuestionObj((prev) => ({ ...prev, [question.id]: question }));
    setIsAdding(false);
  }
}

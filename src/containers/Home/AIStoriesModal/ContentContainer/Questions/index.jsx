import PropTypes from 'prop-types';
import { useState } from 'react';
import Question from './Question';

Questions.propTypes = {
  questions: PropTypes.array.isRequired
};

export default function Questions({ questions }) {
  const [userChoiceObj, setUserChoiceObj] = useState({});
  return (
    <div>
      {questions.map((question, index) => (
        <Question
          key={question.id}
          style={{ marginTop: index === 0 ? 0 : '3rem' }}
          question={question.question}
          choices={question.choices}
          selectedChoiceIndex={userChoiceObj[question.id]}
          answerIndex={question.answerIndex}
          onSelectChoice={(index) =>
            setUserChoiceObj((obj) => ({
              ...obj,
              [question.id]: index
            }))
          }
        />
      ))}
    </div>
  );
}

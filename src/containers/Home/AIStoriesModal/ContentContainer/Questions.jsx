import PropTypes from 'prop-types';

Questions.propTypes = {
  questions: PropTypes.array.isRequired
};

export default function Questions({ questions }) {
  return (
    <div>
      {questions.map((question) => (
        <div key={question.id}>
          <div>{question.question}</div>
          {question.choices.map((choice) => (
            <div key={choice}>{choice}</div>
          ))}
          <div>{question.answerIndex}</div>
        </div>
      ))}
    </div>
  );
}

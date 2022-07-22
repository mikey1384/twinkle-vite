import React from 'react';
import PropTypes from 'prop-types';
import Input from '~/components/Texts/Input';

Question.propTypes = {
  answer: PropTypes.string,
  hasError: PropTypes.bool,
  innerRef: PropTypes.func,
  onInputChange: PropTypes.func.isRequired,
  question: PropTypes.object.isRequired,
  style: PropTypes.object
};
export default function Question({
  innerRef,
  answer,
  hasError,
  onInputChange,
  question,
  style
}) {
  return (
    <div style={style}>
      <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
        {question.content}
      </p>
      <Input
        inputRef={innerRef}
        value={answer}
        onChange={(text) => onInputChange(text)}
        style={{
          marginTop: '0.5rem',
          ...(hasError ? { border: '2px solid red' } : {})
        }}
        placeholder="Type your answer here..."
      />
    </div>
  );
}

import React from 'react';
import Input from '~/components/Texts/Input';

export default function Question({
  innerRef,
  answer,
  hasError,
  onInputChange,
  question,
  style
}: {
  answer: string;
  hasError: boolean;
  innerRef: any;
  onInputChange: (arg0: string) => void;
  question: any;
  style: React.CSSProperties;
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

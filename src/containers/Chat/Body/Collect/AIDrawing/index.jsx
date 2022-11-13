import { useRef } from 'react';
import Input from './Input';
import FilterBar from '~/components/FilterBar';
import { useNavigate } from 'react-router-dom';
import { Color } from '~/constants/css';
import { VOCAB_CHAT_TYPE } from '~/constants/defaultValues';
import { useAppContext } from '~/contexts';

export default function AIDrawing() {
  const generateAIDrawing = useAppContext(
    (v) => v.requestHelpers.generateAIDrawing
  );
  const navigate = useNavigate();

  const inputRef = useRef(null);

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        flexDirection: 'column'
      }}
    >
      <FilterBar
        style={{
          height: '4.5rem',
          fontSize: '1.6rem',
          marginBottom: 0
        }}
      >
        <nav onClick={() => navigate(`/chat/${VOCAB_CHAT_TYPE}`)}>
          Vocabulary
        </nav>
        <nav className="active">AI Drawing</nav>
      </FilterBar>
      <div
        style={{
          zIndex: 5,
          width: '100%',
          height: 'CALC(100% - 6.5rem)'
        }}
      >
        Images go here
      </div>
      <div
        style={{
          height: '6.5rem',
          background: Color.inputGray(),
          padding: '1rem',
          borderTop: `1px solid ${Color.borderGray()}`
        }}
      >
        <Input onSubmit={handleSubmit} innerRef={inputRef} />
      </div>
    </div>
  );

  async function handleSubmit(text) {
    const data = await generateAIDrawing(text);
    console.log(data);
  }
}

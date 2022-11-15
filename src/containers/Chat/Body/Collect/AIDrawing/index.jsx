import { useRef } from 'react';
import PropTypes from 'prop-types';
import Input from './Input';
import FilterBar from '~/components/FilterBar';
import ActivitiesContainer from './ActivitiesContainer';
import Loading from '~/components/Loading';
import { useNavigate } from 'react-router-dom';
import { Color } from '~/constants/css';
import { VOCAB_CHAT_TYPE } from '~/constants/defaultValues';
import { useAppContext } from '~/contexts';

AIDrawing.propTypes = {
  loadingAIImageChat: PropTypes.bool
};

export default function AIDrawing({ loadingAIImageChat }) {
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
        <nav className="active">AI Art Cards</nav>
      </FilterBar>
      {loadingAIImageChat ? (
        <div style={{ height: 'CALC(100% - 6.5rem)' }}>
          <Loading style={{ height: '50%' }} text="Loading AI Art Cards" />
        </div>
      ) : (
        <ActivitiesContainer />
      )}

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

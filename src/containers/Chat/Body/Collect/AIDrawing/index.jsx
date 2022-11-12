import { useMemo, useRef, useState } from 'react';
import Input from './Input';
import FilterBar from '~/components/FilterBar';
import { useNavigate } from 'react-router-dom';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useChatContext, useInputContext, useNotiContext } from '~/contexts';
import { VOCAB_CHAT_TYPE } from '~/constants/defaultValues';
import { css } from '@emotion/css';

export default function AIDrawing() {
  const navigate = useNavigate();
  const vocabErrorMessage = useChatContext((v) => v.state.vocabErrorMessage);
  const wordsObj = useChatContext((v) => v.state.wordsObj);
  const wordRegisterStatus = useChatContext((v) => v.state.wordRegisterStatus);
  const state = useInputContext((v) => v.state);
  const socketConnected = useNotiContext((v) => v.state.socketConnected);
  const inputText = state[VOCAB_CHAT_TYPE]?.text?.trim?.() || '';
  const wordObj = useMemo(
    () => wordsObj[inputText] || {},
    [inputText, wordsObj]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRef = useRef(null);

  const widgetHeight = useMemo(() => {
    return !socketConnected
      ? wordRegisterStatus
        ? '16rem'
        : '10rem'
      : wordObj.content
      ? '20rem'
      : `10rem`;
  }, [socketConnected, wordRegisterStatus, wordObj.content]);

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
          height: widgetHeight,
          boxShadow: !wordRegisterStatus && `0 -5px 6px -3px ${Color.gray()}`,
          borderTop: !!wordRegisterStatus && `1px solid ${Color.borderGray()}`
        }}
      >
        something goes here
      </div>
      {(vocabErrorMessage || isSubmitting) && (
        <div
          className={css`
            font-size: 2rem;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.5rem;
            }
          `}
          style={{
            display: 'flex',
            background: vocabErrorMessage ? Color.rose() : Color.darkerGray(),
            width: '100%',
            padding: '1rem',
            justifyContent: 'center',
            alignItems: 'center',
            height: '7rem'
          }}
        >
          {vocabErrorMessage}
        </div>
      )}
      <div
        style={{
          height: '6.5rem',
          background: Color.inputGray(),
          padding: '1rem',
          borderTop: `1px solid ${Color.borderGray()}`
        }}
      >
        <Input
          onInput={() => {
            if (isSubmitting) {
              setIsSubmitting(false);
            }
          }}
          onSubmit={() => console.log('submitting')}
          innerRef={inputRef}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}

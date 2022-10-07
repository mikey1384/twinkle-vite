import { useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import InputModal from './InputModal';

export default function InputPanel() {
  const [inputValue, setInputValue] = useState('');
  const [inputModalShown, setInputModalShown] = useState(false);
  return (
    <ErrorBoundary componentPath="Home/Stories/InputPanel">
      <div>
        <input
          style={{ width: '100%', marginTop: '1rem', marginBottom: '1rem' }}
          placeholder="Post Something"
          value={inputValue}
          onChange={() => setInputValue('')}
          onClick={() => setInputModalShown(true)}
          className={css`
            line-height: 2rem;
            padding: 1rem;
            border: 1px solid ${Color.darkerBorderGray()};
            font-size: 1.7rem;
            &:focus {
              outline: none;
              ::placeholder {
                color: ${Color.lighterGray()};
              }
            }
            ::placeholder {
              color: ${Color.gray()};
            }
          `}
        />
        {inputModalShown && (
          <InputModal onHide={() => setInputModalShown(false)} />
        )}
      </div>
    </ErrorBoundary>
  );
}

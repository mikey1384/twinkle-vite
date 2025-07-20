import React, { useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { useHomeContext } from '~/contexts';
import InputModal from './InputModal';
import CielButton from './CielButton';
import ZeroButton from './ZeroButton';

export default function InputPanel({
  onInputModalButtonClick
}: {
  onInputModalButtonClick: (v?: string) => void;
}) {
  const inputModalShown = useHomeContext((v) => v.state.inputModalShown);
  const onSetInputModalShown = useHomeContext(
    (v) => v.actions.onSetInputModalShown
  );
  const [inputValue, setInputValue] = useState('');
  return (
    <ErrorBoundary componentPath="Home/Stories/TopMenu/InputPanel">
      <div
        style={{
          width: '100%',
          marginTop: '1rem',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <div style={{ flexGrow: 1 }}>
          <input
            style={{ width: '100%' }}
            placeholder="Post Something"
            value={inputValue}
            onChange={() => setInputValue('')}
            onFocus={(event) => {
              event.currentTarget.blur();
              onInputModalButtonClick();
            }}
            onClick={(event) => {
              event.currentTarget.blur();
              onInputModalButtonClick();
            }}
            className={css`
              line-height: 2rem;
              padding: 1rem;
              border: 1px solid ${Color.darkerBorderGray()};
              font-size: 1.7rem;
              &:hover {
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
        </div>
        <div style={{ marginLeft: '1rem', display: 'flex' }}>
          <CielButton />
          <ZeroButton />
        </div>
        <InputModal 
          isOpen={inputModalShown}
          onHide={() => onSetInputModalShown({ shown: false })} 
        />
      </div>
    </ErrorBoundary>
  );
}

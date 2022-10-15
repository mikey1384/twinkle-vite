import { useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import InputModal from './InputModal';
import { useHomeContext } from '~/contexts';

InputPanel.propTypes = {
  onInputModalButtonClick: PropTypes.func.isRequired
};

export default function InputPanel({ onInputModalButtonClick }) {
  const inputModalShown = useHomeContext((v) => v.state.inputModalShown);
  const onSetInputModalShown = useHomeContext(
    (v) => v.actions.onSetInputModalShown
  );
  const [inputValue, setInputValue] = useState('');
  return (
    <ErrorBoundary componentPath="Home/Stories/InputPanel">
      <div>
        <input
          style={{ width: '100%', marginTop: '1rem' }}
          placeholder="Post Something"
          value={inputValue}
          onChange={() => setInputValue('')}
          onFocus={(event) => {
            event.currentTarget.blur();
            onInputModalButtonClick();
          }}
          onClick={() => {
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
        {inputModalShown && (
          <InputModal onHide={() => onSetInputModalShown(false)} />
        )}
      </div>
    </ErrorBoundary>
  );
}

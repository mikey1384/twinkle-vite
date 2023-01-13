import PropTypes from 'prop-types';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import Button from '~/components/Button';
import ButtonContainer from './ButtonContainer';

CardSearchPanel.propTypes = {
  onSetSelectedFilter: PropTypes.func.isRequired
};

export default function CardSearchPanel({ onSetSelectedFilter }) {
  return (
    <div
      className={css`
        font-size: 1.7rem;
        width: 100%;
        padding: 1rem;
        background: #fff;
        border: 1px solid ${Color.borderGray()};
        .label {
          font-family: 'Roboto', sans-serif;
          font-weight: bold;
          font-size: 1.5rem;
          color: ${Color.darkerGray()};
        }
      `}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          width: '100%'
        }}
      >
        <ButtonContainer label="Owner:">
          <Button skeuomorphic onClick={() => onSetSelectedFilter('owner')}>
            Anyone
          </Button>
        </ButtonContainer>
        <ButtonContainer label="Color:">
          <Button skeuomorphic onClick={() => onSetSelectedFilter('color')}>
            Any
          </Button>
        </ButtonContainer>
        <ButtonContainer label="Quality:">
          <Button skeuomorphic onClick={() => onSetSelectedFilter('quality')}>
            Any
          </Button>
        </ButtonContainer>
        <ButtonContainer label="Price:">
          <Button skeuomorphic onClick={() => onSetSelectedFilter('price')}>
            Any
          </Button>
        </ButtonContainer>
        <ButtonContainer label="Card ID:">
          <Button skeuomorphic onClick={() => onSetSelectedFilter('cardId')}>
            Any
          </Button>
        </ButtonContainer>
        <ButtonContainer label="Word:">
          <Button skeuomorphic onClick={() => onSetSelectedFilter('word')}>
            Any
          </Button>
        </ButtonContainer>
      </div>
    </div>
  );
}

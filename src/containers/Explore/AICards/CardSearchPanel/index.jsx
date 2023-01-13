import PropTypes from 'prop-types';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import Button from '~/components/Button';
import ButtonContainer from './ButtonContainer';

CardSearchPanel.propTypes = {
  onSetFilterModalShown: PropTypes.func.isRequired
};

export default function CardSearchPanel({ onSetFilterModalShown }) {
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
          <Button skeuomorphic onClick={() => onSetFilterModalShown(true)}>
            Anyone
          </Button>
        </ButtonContainer>
        <ButtonContainer label="Color:">
          <Button skeuomorphic onClick={() => onSetFilterModalShown(true)}>
            Any
          </Button>
        </ButtonContainer>
        <ButtonContainer label="Quality:">
          <Button skeuomorphic onClick={() => onSetFilterModalShown(true)}>
            Any
          </Button>
        </ButtonContainer>
        <ButtonContainer label="Price:">
          <Button skeuomorphic onClick={() => onSetFilterModalShown(true)}>
            Any
          </Button>
        </ButtonContainer>
        <ButtonContainer label="Card ID:">
          <Button skeuomorphic onClick={() => onSetFilterModalShown(true)}>
            Any
          </Button>
        </ButtonContainer>
        <ButtonContainer label="Word:">
          <Button skeuomorphic onClick={() => onSetFilterModalShown(true)}>
            Any
          </Button>
        </ButtonContainer>
      </div>
    </div>
  );
}

import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import Button from '~/components/Button';
import ButtonContainer from './ButtonContainer';

export default function CardSearchPanel() {
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
          <Button skeuomorphic onClick={() => console.log('clicked')}>
            Anyone
          </Button>
        </ButtonContainer>
        <ButtonContainer label="Color:">
          <Button skeuomorphic onClick={() => console.log('clicked')}>
            Any
          </Button>
        </ButtonContainer>
        <ButtonContainer label="Quality:">
          <Button skeuomorphic onClick={() => console.log('clicked')}>
            Any
          </Button>
        </ButtonContainer>
        <ButtonContainer label="Price:">
          <Button skeuomorphic onClick={() => console.log('clicked')}>
            Any
          </Button>
        </ButtonContainer>
        <ButtonContainer label="Card ID:">
          <Button skeuomorphic onClick={() => console.log('clicked')}>
            Any
          </Button>
        </ButtonContainer>
        <ButtonContainer label="Word:">
          <Button skeuomorphic onClick={() => console.log('clicked')}>
            Any
          </Button>
        </ButtonContainer>
      </div>
    </div>
  );
}

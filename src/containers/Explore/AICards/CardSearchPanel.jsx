import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import Button from '~/components/Button';

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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <div className="label">Owner:</div>
          <div style={{ marginTop: '0.5rem' }}>
            <Button skeuomorphic onClick={() => console.log('clicked')}>
              Anyone
            </Button>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <div className="label">Color:</div>
          <div style={{ marginTop: '0.5rem' }}>
            <Button skeuomorphic onClick={() => console.log('clicked')}>
              Any
            </Button>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <div className="label">Quality:</div>
          <div style={{ marginTop: '0.5rem' }}>
            <Button skeuomorphic onClick={() => console.log('clicked')}>
              Any
            </Button>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <div className="label">Price:</div>
          <div style={{ marginTop: '0.5rem' }}>
            <Button skeuomorphic onClick={() => console.log('clicked')}>
              Any
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

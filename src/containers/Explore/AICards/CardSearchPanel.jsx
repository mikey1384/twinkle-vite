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
      `}
    >
      <div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <div>Owner:</div>
          <div style={{ marginTop: '0.5rem' }}>
            <Button skeuomorphic onClick={() => console.log('clicked')}>
              Anyone
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

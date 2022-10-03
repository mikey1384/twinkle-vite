import Marble from './Marble';
import { css } from '@emotion/css';

export default function ProgressBar() {
  return (
    <div
      className={css`
        .ball {
          display: inline-block;
          width: 100%;
          height: 100%;
          border-radius: 100%;
          position: relative;
          background: radial-gradient(
            #81e8f6,
            #76deef 10%,
            #055194 80%,
            #062745 100%
          );
        }
        .ball:after {
          content: '';
          position: absolute;
          top: 5%;
          left: 10%;
          width: 80%;
          height: 80%;
          border-radius: 100%;
          -webkit-filter: blur(1px);
          filter: blur(1px);
          z-index: 2;
          -webkit-transform: rotateZ(-30deg);
          transform: rotateZ(-30deg);
        }
        .bubble {
          background: radial-gradient(
            rgba(240, 245, 255, 0.9),
            rgba(240, 245, 255, 0.9) 40%,
            rgba(225, 238, 255, 0.8) 60%,
            rgba(43, 130, 255, 0.4)
          );
        }
        .bubble:after {
          display: block;
          background: radial-gradient(
            circle at 50% 80%,
            rgba(255, 255, 255, 0),
            rgba(255, 255, 255, 0) 74%,
            white 80%,
            white 84%,
            rgba(255, 255, 255, 0) 100%
          );
        }
        .marble {
          width: 50px;
          height: 50px;
          display: inline-block;
        }
      `}
      style={{
        marginBottom: '1rem',
        display: 'flex',
        justifyContent: 'center'
      }}
    >
      <Marble />
      <Marble style={{ marginLeft: '0.5rem' }} />
      <Marble style={{ marginLeft: '0.5rem' }} />
      <Marble style={{ marginLeft: '0.5rem' }} />
      <Marble style={{ marginLeft: '0.5rem' }} />
      <Marble style={{ marginLeft: '0.5rem' }} />
      <Marble style={{ marginLeft: '0.5rem' }} />
      <Marble style={{ marginLeft: '0.5rem' }} />
      <Marble style={{ marginLeft: '0.5rem' }} />
      <Marble style={{ marginLeft: '0.5rem' }} />
    </div>
  );
}

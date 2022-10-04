import PropTypes from 'prop-types';
import Bubble from './Bubble';
import { css } from '@emotion/css';

ProgressBar.propTypes = {
  questions: PropTypes.arrayOf(PropTypes.object).isRequired,
  style: PropTypes.object
};

export default function ProgressBar({ questions, style }) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        justifyContent: 'center',
        ...style
      }}
    >
      {questions.map((_, index) => {
        return (
          <Bubble
            key={index}
            style={{
              marginLeft: index === 0 ? 0 : '-1rem',
              zIndex: 10 - index
            }}
          />
        );
      })}
    </div>
  );
}

const className = css`
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

  .gloss {
    background: radial-gradient(
      rgba(240, 245, 255, 0.9),
      rgba(240, 245, 255, 0.9) 40%,
      rgba(225, 238, 255, 0.8) 60%,
      rgba(43, 130, 255, 0.4)
    );
  }

  .gloss:after {
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

  .gloss {
    width: 50px;
    height: 50px;
    display: inline-block;
    @media (max-width: 850px) {
      .gloss {
        width: 30px;
        height: 30px;
      }
    }
  }
`;

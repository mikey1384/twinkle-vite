import PropTypes from 'prop-types';
import Bubble from './Bubble';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

ProgressBar.propTypes = {
  isOnStreak: PropTypes.bool,
  questions: PropTypes.arrayOf(PropTypes.object).isRequired,
  style: PropTypes.object
};

export default function ProgressBar({ isOnStreak, questions, style }) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        justifyContent: 'center',
        ...style
      }}
    >
      {questions.map((question, index) => {
        return (
          <Bubble
            key={index}
            isOnStreak={isOnStreak}
            question={question}
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

  .gradedS {
    background: radial-gradient(
      ${Color.gold(0.9)},
      ${Color.gold(0.9)} 40%,
      ${Color.gold(0.8)} 60%,
      rgba(143, 130, 255, 0.4)
    );
  }

  .streak {
    background: linear-gradient(
      -45deg,
      ${Color.gold()},
      ${Color.magenta()},
      ${Color.orange()},
      ${Color.logoBlue()}
    );
    background-size: 200% 200%;
    animation: Gradient 0.5s ease infinite;
  }

  .gradedA {
    background: radial-gradient(
      ${Color.magenta(0.9)},
      ${Color.magenta(0.9)} 40%,
      ${Color.magenta(0.8)} 60%,
      rgba(143, 130, 255, 0.4)
    );
  }

  .gradedB {
    background: radial-gradient(
      ${Color.orange(0.9)},
      ${Color.orange(0.9)} 40%,
      ${Color.orange(0.8)} 60%,
      rgba(143, 130, 255, 0.4)
    );
  }

  .gradedC {
    background: radial-gradient(
      ${Color.pastelPink(0.9)},
      ${Color.pastelPink(0.9)} 40%,
      ${Color.pastelPink(0.8)} 60%,
      rgba(143, 130, 255, 0.4)
    );
  }

  .gradedD {
    background: radial-gradient(
      ${Color.logoBlue(0.9)},
      ${Color.logoBlue(0.9)} 40%,
      ${Color.logoBlue(0.8)} 60%,
      rgba(143, 130, 255, 0.4)
    );
  }

  .gradedF {
    background: radial-gradient(
      ${Color.gray(0.9)},
      ${Color.gray(0.9)} 40%,
      ${Color.gray(0.8)} 60%,
      rgba(143, 130, 255, 0.4)
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
    @media (max-width: ${mobileMaxWidth}) {
      margin-top: 2rem;
      width: 30px;
      height: 30px;
    }
  }
`;

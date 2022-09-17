import PropTypes from 'prop-types';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

GradientButton.propTypes = {
  disabled: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  onClick: PropTypes.func,
  children: PropTypes.node
};

export default function GradientButton({ disabled, onClick, children = null }) {
  return (
    <div
      className={css`
        display: block;
        cursor: pointer;
        padding: 1.5rem;
        overflow: visible;
        pointer-events: auto;
        border-radius: 5px;
        color: white;
        font-family: 'Ubuntu', sans-serif, Arial, Helvetica;
        text-transform: uppercase;
        font-weight: bold;
        font-size: 2.5rem;
        letter-spacing: 2px;
        box-shadow: rgb(0 0 0 / 15%) 0 1px 2px;
        @-webkit-keyframes Gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        animation: Gradient 5s ease infinite;
        background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
        background-size: 400% 400%;
        @media (max-width: ${mobileMaxWidth}) {
          font-size: 2rem;
        }
      `}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </div>
  );
}

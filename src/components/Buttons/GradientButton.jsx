import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { mobileMaxWidth, borderRadius } from '~/constants/css';

GradientButton.propTypes = {
  disabled: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  isFlat: PropTypes.bool,
  onClick: PropTypes.func,
  children: PropTypes.node,
  loading: PropTypes.bool,
  fontSize: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  mobileFontSize: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  style: PropTypes.object
};

export default function GradientButton({
  isFlat,
  disabled,
  onClick,
  children = null,
  fontSize = '2.5rem',
  mobileFontSize = '2rem',
  loading,
  style
}) {
  return (
    <button
      style={style}
      className={css`
        ${disabled || loading ? `opacity: 0.5;` : ''}
        color: #fff;
        display: flex;
        justify-content: center;
        border: none;
        cursor: ${disabled || loading ? 'default' : 'pointer'};
        padding: 1.5rem;
        overflow: visible;
        pointer-events: auto;
        ${isFlat ? '' : `border-radius: ${borderRadius};`}
        color: white;
        font-family: 'Ubuntu', sans-serif, Arial, Helvetica;
        text-transform: uppercase;
        font-weight: bold;
        font-size: ${fontSize};
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
          font-size: ${mobileFontSize};
        }
      `}
      onClick={onClick}
      disabled={!!loading || !!disabled}
    >
      {children}
      {loading && (
        <Icon style={{ marginLeft: '0.7rem' }} icon="spinner" pulse />
      )}
    </button>
  );
}

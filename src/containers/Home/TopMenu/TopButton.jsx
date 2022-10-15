import PropTypes from 'prop-types';
import { borderRadius, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

TopButton.propTypes = {
  colorLeft: PropTypes.string,
  colorMiddle: PropTypes.string,
  colorRight: PropTypes.string,
  children: PropTypes.node,
  disabled: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  style: PropTypes.object
};

export default function TopButton({
  colorLeft = '#f6d365',
  colorMiddle = '#fda085',
  colorRight = '#f6d365',
  children,
  disabled,
  onClick,
  style
}) {
  const buttonStyle = css`
    font-family: 'Ubuntu', sans-serif, Arial, Helvetica;
    cursor: pointer;
    display: flex;
    background-image: linear-gradient(
      to right,
      ${colorLeft} 0%,
      ${colorMiddle} 51%,
      ${colorRight} 100%
    );
    &:hover {
      background-position: right center;
    }
    transition: 0.5s;
    background-size: 200% auto;
    color: #fff;
    justify-content: center;
    align-items: center;
    text-align: center;
    font-weight: bold;
    font-size: 1.5rem;
    border-radius: ${borderRadius};
    border: none;
    padding: 1rem;
    @media (max-width: ${mobileMaxWidth}) {
      font-size: 1.3rem;
    }
  `;
  return (
    <button
      disabled={disabled}
      style={style}
      onClick={onClick}
      className={buttonStyle}
    >
      {children}
    </button>
  );
}

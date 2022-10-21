import PropTypes from 'prop-types';
import { borderRadius, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';

TopButton.propTypes = {
  colorLeft: PropTypes.string,
  colorMiddle: PropTypes.string,
  colorRight: PropTypes.string,
  children: PropTypes.node,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  style: PropTypes.object
};

export default function TopButton({
  colorLeft = '#f6d365',
  colorMiddle = '#fda085',
  colorRight = '#f6d365',
  children,
  loading,
  disabled,
  onClick,
  style
}) {
  const buttonStyle = css`
    font-family: 'Ubuntu', sans-serif, Arial, Helvetica;
    cursor: ${disabled || loading ? 'default' : 'pointer'};
    display: flex;
    opacity: ${disabled || loading ? 0.5 : 1};
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
      disabled={disabled || loading}
      style={style}
      onClick={onClick}
      className={buttonStyle}
    >
      {loading && (
        <Icon style={{ marginRight: '0.7rem' }} icon="spinner" pulse />
      )}
      {children}
    </button>
  );
}

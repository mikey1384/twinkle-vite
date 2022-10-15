import PropTypes from 'prop-types';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

TopButton.propTypes = {
  children: PropTypes.node,
  disabled: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  style: PropTypes.object
};

export default function TopButton({ children, disabled, onClick, style }) {
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

const buttonStyle = css`
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  font-weight: bold;
  background: #fff;
  font-size: 1.5rem;
  border-radius: ${borderRadius};
  border: 1px solid ${Color.borderGray()};
  padding: 1rem;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.3rem;
  }
`;

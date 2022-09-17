import PropTypes from 'prop-types';
import { css } from '@emotion/css';

GradientButton.propTypes = {
  disabled: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  onClick: PropTypes.func,
  children: PropTypes.node,
  style: PropTypes.object
};

export default function GradientButton({
  disabled,
  onClick,
  children = null,
  style = {}
}) {
  return (
    <div
      style={style}
      className={css`
        cursor: pointer;
        padding: 2rem;
        font-weight: bold;
        overflow: visible;
        pointer-events: auto;
        transform-origin: 50% 50% 0px;
        border-radius: 5px;
        color: white;
        font-size: 14.5px;
        text-transform: uppercase;
        letter-spacing: 2px;
        box-shadow: rgb(0 0 0 / 15%) 0 1px 2px;
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      `}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </div>
  );
}

import { useRef } from 'react';
import PropTypes from 'prop-types';

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
  const ButtonRef = useRef(null);
  return (
    <button
      style={{ cursor: 'pointer', padding: '1rem', ...style }}
      ref={ButtonRef}
      onClick={(event) => {
        if (ButtonRef.current !== null) ButtonRef.current.blur();
        if (onClick) onClick(event);
      }}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

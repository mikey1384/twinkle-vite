import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

Link.propTypes = {
  innerRef: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
  className: PropTypes.string,
  children: PropTypes.node,
  onClick: PropTypes.func,
  onClickAsync: PropTypes.func,
  style: PropTypes.object,
  target: PropTypes.string,
  to: PropTypes.string
};

export default function Link({
  innerRef,
  className,
  to,
  onClick = () => {},
  children,
  style,
  target,
  ...props
}) {
  const navigate = useNavigate();
  return to ? (
    <a
      {...props}
      ref={innerRef}
      className={className}
      style={{
        whiteSpace: 'pre-wrap',
        overflowWrap: 'break-word',
        wordBreak: 'break-word',
        ...style
      }}
      href={to}
      onClick={handleLinkClick}
    >
      {children}
    </a>
  ) : (
    <div
      className={className}
      style={{
        whiteSpace: 'pre-wrap',
        overflowWrap: 'break-word',
        wordBreak: 'break-word',
        ...style
      }}
    >
      {children}
    </div>
  );

  function handleLinkClick(event) {
    event.preventDefault();
    if (target) return window.open(to, target);
    navigate(to);
    onClick();
  }
}

import PropTypes from 'prop-types';

ActionBlock.propTypes = {
  action: PropTypes.string.isRequired,
  target: PropTypes.string.isRequired,
  style: PropTypes.object
};

export default function ActionBlock({ action, target, style }) {
  return (
    <div style={style}>
      {action} {target}
    </div>
  );
}

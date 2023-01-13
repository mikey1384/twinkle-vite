import PropTypes from 'prop-types';

ButtonContainer.propTypes = {
  children: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired
};

export default function ButtonContainer({ label, children }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <div className="label">{label}</div>
      <div style={{ marginTop: '0.5rem' }}>{children}</div>
    </div>
  );
}

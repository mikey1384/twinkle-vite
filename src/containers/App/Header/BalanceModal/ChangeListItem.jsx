import PropTypes from 'prop-types';

ChangeListItem.propTypes = {
  change: PropTypes.object.isRequired
};

export default function ChangeListItem({ change }) {
  return (
    <div>
      <div>
        {change.action} {change.target} {change.type} {change.amount}
      </div>
    </div>
  );
}

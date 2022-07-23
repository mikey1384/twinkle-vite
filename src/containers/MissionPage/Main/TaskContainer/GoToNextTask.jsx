import PropTypes from 'prop-types';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useNavigate } from 'react-router-dom';

GoToNextTask.propTypes = {
  style: PropTypes.object,
  nextTaskType: PropTypes.string
};

export default function GoToNextTask({ style, nextTaskType }) {
  const navigate = useNavigate();
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        ...style
      }}
    >
      <Button
        filled
        skeuomorphic
        color="green"
        onClick={() => navigate(nextTaskType ? `../${nextTaskType}` : '..')}
      >
        {!nextTaskType && <Icon icon="arrow-left" />}
        <span
          style={{
            [nextTaskType ? 'marginRight' : 'marginLeft']: '0.7rem',
            fontSize: '2rem'
          }}
        >
          {nextTaskType ? 'Next Task' : 'Task Menu'}
        </span>
        {nextTaskType && <Icon icon="arrow-right" />}
      </Button>
    </div>
  );
}

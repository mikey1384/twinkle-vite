import PropTypes from 'prop-types';
import GradientButton from '~/components/Buttons/GradientButton';
import Icon from '~/components/Icon';

UserView.propTypes = {
  onStartClick: PropTypes.func.isRequired,
  tutorialPrompt: PropTypes.string,
  tutorialButtonLabel: PropTypes.string
};

export default function UserView({
  onStartClick,
  tutorialPrompt,
  tutorialButtonLabel
}) {
  return (
    <div>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>
        {tutorialPrompt || 'Need Help? Read the Tutorial'}
      </h2>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <GradientButton style={{ marginLeft: '1rem' }} onClick={onStartClick}>
          <Icon icon="star" />
          <span style={{ marginLeft: '1rem' }}>
            {tutorialButtonLabel || 'Show Tutorial'}
          </span>
        </GradientButton>
      </div>
    </div>
  );
}

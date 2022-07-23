import PropTypes from 'prop-types';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import localize from '~/constants/localize';

const iForgotMyPasswordLabel = localize('iForgotMyPassword');
const noIDontHaveAnAccountLabel = localize('noIDontHaveAnAccount');
const welcomeLabel = localize('welcomeToTwinkle');
const yesIHaveAnAccountLabel = localize('yesIHaveAnAccount');

Main.propTypes = {
  onShowForgotPasswordForm: PropTypes.func.isRequired,
  onShowLoginForm: PropTypes.func.isRequired,
  onShowSignUpForm: PropTypes.func.isRequired
};

export default function Main({
  onShowForgotPasswordForm,
  onShowLoginForm,
  onShowSignUpForm
}) {
  return (
    <ErrorBoundary componentPath="Signin/Main">
      <header>{welcomeLabel}</header>
      <main>
        <Button
          color="logoBlue"
          style={{ display: 'block', fontSize: '2.7rem', padding: '1rem' }}
          onClick={onShowLoginForm}
        >
          {yesIHaveAnAccountLabel}
        </Button>
        <Button
          color="pink"
          style={{ marginTop: '1rem', fontSize: '2.5rem', padding: '1rem' }}
          onClick={onShowSignUpForm}
        >
          {noIDontHaveAnAccountLabel}
        </Button>
        <Button
          color="purple"
          style={{
            marginTop: '1.5rem',
            fontSize: '2rem',
            padding: '1rem',
            marginBottom: '1rem'
          }}
          onClick={onShowForgotPasswordForm}
        >
          {iForgotMyPasswordLabel}
        </Button>
      </main>
    </ErrorBoundary>
  );
}

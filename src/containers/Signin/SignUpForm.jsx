import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import Banner from '~/components/Banner';
import { css } from '@emotion/css';
import {
  isValidPassword,
  isValidUsername,
  stringIsEmpty
} from '~/helpers/stringHelpers';
import { useAppContext } from '~/contexts';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import localize from '~/constants/localize';

const createMyAccountLabel = localize('createMyAccount');
const emailIsNeededInCaseLabel = localize('emailIsNeededInCase');
const emailYoursOrYourParentsLabel = localize('emailYoursOrYourParents');
const iAlreadyHaveAnAccountLabel = localize('iAlreadyHaveAnAccount');
const firstNameLabel = localize('firstName');
const letsSetUpYourAccountLabel = localize('letsSetUpYourAccount');
const passwordLabel = localize('password');
const passwordsNeedToBeAtLeastLabel = localize('passwordsNeedToBeAtLeast');
const usernameLabel = localize('username');
const enterTheUsernameYouWishToUseLabel = localize(
  'enterTheUsernameYouWishToUse'
);
const lastNameLabel = localize('lastName');
const passphraseLabel = localize('passphrase');
const setUpPasswordLabel = localize('setUpPassword');
const whatIsYourFirstNameLabel = localize('whatIsYourFirstName');
const whatIsYourLastNameLabel = localize('whatIsYourLastName');
const passphraseErrorMsgLabel = localize('passphraseErrorMsg');

SignUpForm.propTypes = {
  username: PropTypes.string,
  onSetUsername: PropTypes.func.isRequired,
  onShowLoginForm: PropTypes.func.isRequired
};

export default function SignUpForm({
  username,
  onSetUsername,
  onShowLoginForm
}) {
  const onSignup = useAppContext((v) => v.user.actions.onSignup);
  const signup = useAppContext((v) => v.requestHelpers.signup);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const [password, setPassword] = useState('');
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [keyphrase, setKeyphrase] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const submitDisabled = useMemo(
    () =>
      stringIsEmpty(username) ||
      stringIsEmpty(password) ||
      stringIsEmpty(firstname) ||
      stringIsEmpty(lastname) ||
      stringIsEmpty(keyphrase) ||
      errorMessage,
    [errorMessage, firstname, keyphrase, lastname, password, username]
  );
  const usernameErrorMsgLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return `"${username}" - 유효하지 않은 아이디입니다.${
        username.length < 3 ? ' 아이디는 3글자 이상이어야 합니다.' : ''
      }`;
    }
    return `${username} is not a valid username.${
      username.length < 3 ? ' Make sure it is at least 3 characters long.' : ''
    }`;
  }, [username]);
  const notValidFirstNameLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return `${firstname}는 유효한 이름이 아닙니다. 영문자로 입력해 주세요`;
    }
    return `${firstname} is not a valid first name. Your first name should consist of english letters only`;
  }, [firstname]);
  const notValidLastNameLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return `${lastname}는 유효한 성이 아닙니다. 영문자로 입력해 주세요`;
    }
    return `${lastname} is not a valid last name. Your last name should consist of english letters only`;
  }, [lastname]);
  const notValidEmailLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return `${email}는 유효한 이메일 주소가 아닙니다`;
    }
    return `${email} is not a valid email address`;
  }, [email]);

  const isOtherErrorMessage = useMemo(() => {
    const validTypes = [
      'username',
      'firstname',
      'password',
      'lastname',
      'email',
      'keyphrase'
    ];
    return errorMessage && !validTypes.includes(errorMessage);
  }, [errorMessage]);

  return (
    <ErrorBoundary componentPath="Signin/SignupForm">
      <header>{letsSetUpYourAccountLabel}</header>
      {isOtherErrorMessage && <Banner>{errorMessage}</Banner>}
      <main>
        <div
          className={css`
            width: 100%;
            padding: 1rem 1.5rem 1.5rem 1.5rem;
            section {
              margin-top: 1rem;
            }
            section:first-of-type {
              margin-top: 0;
            }
            input {
              margin-top: 0.5rem;
            }
            label {
              font-weight: bold;
            }
          `}
        >
          <section>
            <label>{usernameLabel}</label>
            <Input
              value={username}
              hasError={errorMessage === 'username'}
              placeholder={enterTheUsernameYouWishToUseLabel}
              onChange={(text) => {
                setErrorMessage('');
                onSetUsername(text.trim());
              }}
              onKeyPress={(event) => {
                if (event.key === 'Enter' && !submitDisabled) {
                  onSubmit();
                }
              }}
            />
            {errorMessage === 'username' && (
              <p style={{ color: 'red' }}>{usernameErrorMsgLabel}</p>
            )}
          </section>
          <section>
            <label>{passwordLabel}</label>
            <Input
              value={password}
              hasError={errorMessage === 'password'}
              placeholder={setUpPasswordLabel}
              onChange={(text) => {
                setErrorMessage('');
                setPassword(text.trim());
              }}
              onKeyPress={(event) => {
                if (event.key === 'Enter' && !submitDisabled) {
                  onSubmit();
                }
              }}
              type="password"
            />
            {errorMessage === 'password' && (
              <p style={{ color: 'red' }}>{passwordsNeedToBeAtLeastLabel}</p>
            )}
          </section>
          <section>
            <label>{firstNameLabel}</label>
            <Input
              maxLength={30}
              hasError={errorMessage === 'firstname'}
              value={firstname}
              placeholder={whatIsYourFirstNameLabel}
              onChange={(text) => {
                setErrorMessage('');
                setFirstname(text.trim());
              }}
              onKeyPress={(event) => {
                if (event.key === 'Enter' && !submitDisabled) {
                  onSubmit();
                }
              }}
            />
            {errorMessage === 'firstname' && (
              <p style={{ color: 'red' }}>{notValidFirstNameLabel}</p>
            )}
          </section>
          <section>
            <label>{lastNameLabel}</label>
            <Input
              maxLength={30}
              hasError={errorMessage === 'lastname'}
              value={lastname}
              placeholder={whatIsYourLastNameLabel}
              onChange={(text) => {
                setErrorMessage('');
                setLastname(text.trim());
              }}
              onKeyPress={(event) => {
                if (event.key === 'Enter' && !submitDisabled) {
                  onSubmit();
                }
              }}
            />
            {errorMessage === 'lastname' && (
              <p style={{ color: 'red' }}>{notValidLastNameLabel}</p>
            )}
          </section>
          <section>
            <label>{passphraseLabel}</label>
            <Input
              value={keyphrase}
              hasError={errorMessage === 'keyphrase'}
              placeholder={passphraseLabel}
              onChange={(text) => {
                setErrorMessage('');
                setKeyphrase(text);
              }}
              onKeyPress={(event) => {
                if (event.key === 'Enter' && !submitDisabled) {
                  onSubmit();
                }
              }}
            />
            {errorMessage === 'keyphrase' && (
              <p style={{ color: 'red' }}>{passphraseErrorMsgLabel}</p>
            )}
          </section>
          <section style={{ marginTop: '2rem' }}>
            <label>{emailYoursOrYourParentsLabel}</label>
            <Input
              value={email}
              hasError={errorMessage === 'email'}
              placeholder={emailIsNeededInCaseLabel}
              onChange={(text) => {
                setErrorMessage('');
                setEmail(text);
              }}
              onKeyPress={(event) => {
                if (event.key === 'Enter' && !submitDisabled) {
                  onSubmit();
                }
              }}
              type="email"
            />
            {errorMessage === 'email' && (
              <p style={{ color: 'red' }}>{notValidEmailLabel}</p>
            )}
          </section>
        </div>
      </main>
      <footer>
        <Button
          transparent
          color="orange"
          style={{
            fontSize: '1.5rem',
            marginRight: '1rem'
          }}
          onClick={onShowLoginForm}
        >
          {iAlreadyHaveAnAccountLabel}
        </Button>
        <Button
          color="blue"
          disabled={!!submitDisabled}
          onClick={onSubmit}
          style={{ fontSize: '2.5rem' }}
        >
          {createMyAccountLabel}
        </Button>
      </footer>
    </ErrorBoundary>
  );

  async function onSubmit() {
    if (!isValidUsername(username)) {
      return setErrorMessage('username');
    }
    if (!isValidPassword(password)) {
      return setErrorMessage('password');
    }
    if (!isValidRealname(firstname)) {
      return setErrorMessage('firstname');
    }
    if (!isValidRealname(lastname)) {
      return setErrorMessage('lastname');
    }
    if (email && !isValidEmailAddress(email)) {
      return setErrorMessage('email');
    }

    try {
      const data = await signup({
        username,
        password,
        firstname,
        keyphrase,
        lastname,
        email
      });
      onSignup(data);
      onSetUserState({ userId: data.id, newState: data });
    } catch (error) {
      setErrorMessage(error?.data);
    }
  }
}

function isValidEmailAddress(email) {
  const regex =
    '^(([^<>()\\[\\]\\\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$';
  const pattern = new RegExp(regex);
  return pattern.test(email);
}

function isValidRealname(realName) {
  const pattern = new RegExp(/^[a-zA-Z]+$/);
  return pattern.test(realName);
}

import React, { useEffect, useState } from 'react';
import Input from '~/components/Texts/Input';
import EmailSection from './EmailSection';
import Verifier from './Verifier';
import localize from '~/constants/localize';
import { useKeyContext } from '~/contexts';
import { stringIsEmpty, isValidEmailAddress } from '~/helpers/stringHelpers';
import { Color, borderRadius } from '~/constants/css';
import { css } from '@emotion/css';

const firstNameLabel = localize('firstName');
const lastNameLabel = localize('lastName');
const whatIsYourFirstNameLabel = localize('whatIsYourFirstName');
const whatIsYourLastNameLabel = localize('whatIsYourLastName');

export default function UsernamePassword({
  classLabel,
  branchName,
  firstname,
  lastname,
  email,
  verifiedEmail,
  onSetBranchName,
  onSetClassLabel,
  onSetFirstname,
  onSetLastname,
  onSetEmail,
  onSetVerifiedEmail,
  onSetHasEmailError,
  onSetHasNameError,
  userType
}: {
  classLabel: string;
  branchName: string;
  firstname: string;
  lastname: string;
  email: string;
  verifiedEmail: string;
  onSetBranchName: (value: string) => void;
  onSetClassLabel: (value: string) => void;
  onSetFirstname: (value: string) => void;
  onSetLastname: (value: string) => void;
  onSetEmail: (value: string) => void;
  onSetVerifiedEmail: (value: string) => void;
  onSetHasEmailError: (value: boolean) => void;
  onSetHasNameError: (value: boolean) => void;
  userType: string;
}) {
  const linkColor = useKeyContext((v) => v.theme.link.color);
  const [firstnameErrorMsg, setFirstnameErrorMsg] = useState('');
  const [lastnameErrorMsg, setLastnameErrorMsg] = useState('');
  const [isLastnameHighlighted, setIsLastnameHighlighted] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (firstname && stringIsEmpty(lastname)) {
        setIsLastnameHighlighted(true);
      } else {
        setIsLastnameHighlighted(false);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [firstname, lastname]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (firstname || lastname) {
        const hasFirstNameError = !!(firstname && !isValidRealname(firstname));
        const hasLastNameError = !!(lastname && !isValidRealname(lastname));

        onSetHasNameError(hasFirstNameError || hasLastNameError);

        setFirstnameErrorMsg(hasFirstNameError ? 'Invalid first name' : '');
        setLastnameErrorMsg(hasLastNameError ? 'Invalid last name' : '');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [firstname, lastname, onSetHasNameError]);

  useEffect(() => {
    if (stringIsEmpty(email) || isValidEmailAddress(email)) {
      onSetHasEmailError(false);
    }
  }, [firstname, lastname, email, onSetHasEmailError]);

  function isValidRealname(realName: string) {
    const pattern = new RegExp(/^[a-zA-Z]+((\s|-|')[a-zA-Z]+)?$/);
    return pattern.test(realName);
  }

  return (
    <div>
      {userType === 'mentor' ? (
        <section
          style={{
            padding: '1rem',
            background: 'linear-gradient(45deg, #f8f9fa 0%, #e9eaec 100%)',
            borderRadius,
            boxShadow:
              '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
            fontFamily: '"Helvetica Neue", sans-serif',
            lineHeight: 1.6
          }}
        >
          <p
            style={{
              marginBottom: '0.7rem',
              fontSize: '1.8rem',
              fontWeight: 'bold'
            }}
          >
            Hi, my name is
          </p>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', color: Color.darkerGray() }}>
                First name
              </label>
              <Input
                maxLength={30}
                hasError={!!firstnameErrorMsg}
                value={firstname}
                placeholder="First name"
                onChange={(text) => {
                  setFirstnameErrorMsg('');
                  onSetFirstname(text);
                }}
              />
              {firstnameErrorMsg && (
                <p style={{ color: 'red' }}>{firstnameErrorMsg}</p>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', color: Color.darkerGray() }}>
                Last name
              </label>
              <Input
                maxLength={30}
                hasError={!!lastnameErrorMsg}
                value={lastname}
                placeholder="Last name"
                onChange={(text) => {
                  setLastnameErrorMsg('');
                  onSetLastname(text.trim());
                }}
              />
              {lastnameErrorMsg && (
                <p style={{ color: 'red' }}>{lastnameErrorMsg}</p>
              )}
            </div>
          </div>
          <p
            style={{
              marginBottom: '0.7rem',
              fontSize: '1.8rem',
              fontWeight: 'bold'
            }}
          >
            {`and I'm a teacher at`}
          </p>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', color: Color.darkerGray() }}>
                Class name
              </label>
              <Input
                maxLength={50}
                placeholder="Class name"
                onChange={onSetClassLabel}
                value={classLabel}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', color: Color.darkerGray() }}>
                Branch name
              </label>
              <Input
                maxLength={50}
                placeholder="Branch name"
                onChange={onSetBranchName}
                value={branchName}
              />
            </div>
          </div>
          <p style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
            I would like to request a teacher account.
          </p>
        </section>
      ) : (
        <div>
          <section>
            <label>{firstNameLabel}</label>
            <Input
              maxLength={30}
              hasError={!!firstnameErrorMsg}
              value={firstname}
              placeholder={whatIsYourFirstNameLabel}
              onChange={(text) => {
                setFirstnameErrorMsg('');
                onSetFirstname(text);
              }}
            />
            {firstnameErrorMsg && (
              <p style={{ color: 'red' }}>{firstnameErrorMsg}</p>
            )}
          </section>
          <section style={{ marginTop: '1rem' }}>
            <label>{lastNameLabel}</label>
            <Input
              maxLength={30}
              isHighlighted={isLastnameHighlighted}
              hasError={!!lastnameErrorMsg}
              value={lastname}
              placeholder={whatIsYourLastNameLabel}
              onChange={(text) => {
                setLastnameErrorMsg('');
                onSetLastname(text.trim());
              }}
            />
            {lastnameErrorMsg && (
              <p style={{ color: 'red' }}>{lastnameErrorMsg}</p>
            )}
          </section>
        </div>
      )}
      {verifiedEmail ? (
        <div
          style={{
            textAlign: 'center',
            fontFamily: '"Helvetica Neue", sans-serif',
            lineHeight: '1.6',
            marginTop: '3rem',
            marginBottom: '3rem'
          }}
        >
          <p
            style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: Color.green()
            }}
          >
            Email verified
          </p>
          <p
            style={{
              color: Color.green(),
              fontSize: '1.7rem'
            }}
          >
            {`You're all set to create your account!`}
          </p>
          <div style={{ marginTop: '1.3rem' }}>
            <span
              onClick={() => {
                onSetEmail('');
                onSetVerifiedEmail('');
                setEmailSent(false);
              }}
              style={{
                width: 'fit-content',
                cursor: 'pointer',
                color: Color[linkColor]()
              }}
              className={css`
                font-size: 1.3rem;
                &:hover {
                  text-decoration: underline;
                }
              `}
            >{`Use another email address`}</span>
          </div>
        </div>
      ) : emailSent ? (
        <Verifier
          email={email}
          onSetEmailSent={setEmailSent}
          onSetVerifiedEmail={onSetVerifiedEmail}
        />
      ) : (
        <EmailSection
          email={email}
          onSetEmail={onSetEmail}
          onSetEmailSent={setEmailSent}
          onSetHasEmailError={onSetHasEmailError}
          userType={userType}
        />
      )}
    </div>
  );
}

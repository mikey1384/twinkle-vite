import React, { useEffect, useState } from 'react';
import Input from '~/components/Texts/Input';
import localize from '~/constants/localize';
import { stringIsEmpty } from '~/helpers/stringHelpers';

const emailIsNeededInCaseLabel = localize('emailIsNeededInCase');
const emailYoursOrYourParentsLabel = localize('emailYoursOrYourParents');
const firstNameLabel = localize('firstName');
const lastNameLabel = localize('lastName');
const whatIsYourFirstNameLabel = localize('whatIsYourFirstName');
const whatIsYourLastNameLabel = localize('whatIsYourLastName');

export default function UsernamePassword({
  firstname,
  lastname,
  email,
  onSetFirstname,
  onSetLastname,
  onSetEmail,
  onSetHasEmailError,
  onSetHasNameError,
  userType
}: {
  firstname: string;
  lastname: string;
  email: string;
  onSetFirstname: (value: string) => void;
  onSetLastname: (value: string) => void;
  onSetEmail: (value: string) => void;
  onSetHasEmailError: (value: boolean) => void;
  onSetHasNameError: (value: boolean) => void;
  userType: string;
}) {
  const [firstnameErrorMsg, setFirstnameErrorMsg] = useState('');
  const [lastnameErrorMsg, setLastnameErrorMsg] = useState('');
  const [emailErrorMsg, setEmailErrorMsg] = useState('');
  const [isLastnameHighlighted, setIsLastnameHighlighted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (firstname && stringIsEmpty(lastname)) {
        setIsLastnameHighlighted(true);
      } else {
        setIsLastnameHighlighted(false);
      }
    }, 500);
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

  function isValidRealname(realName: string) {
    const pattern = new RegExp(/^[a-zA-Z]+((\s|-|')[a-zA-Z]+)?$/);
    return pattern.test(realName);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (email) {
        if (!isValidEmailAddress(email)) {
          setEmailErrorMsg('Invalid email address');
          onSetHasEmailError(true);
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [email, onSetHasEmailError]);

  useEffect(() => {
    if (stringIsEmpty(email) || isValidEmailAddress(email)) {
      onSetHasEmailError(false);
    }
  }, [firstname, lastname, email, onSetHasEmailError]);

  function isValidEmailAddress(email: string) {
    const regex =
      '^(([^<>()\\[\\]\\\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$';
    const pattern = new RegExp(regex);
    return pattern.test(email);
  }

  return (
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
        <p style={{ color: 'red' }}>{lastnameErrorMsg}</p>
      </section>
      <section style={{ marginTop: '2rem' }}>
        <label>
          {userType === 'student' ? emailYoursOrYourParentsLabel : 'Email'}
        </label>
        <Input
          value={email}
          hasError={!!emailErrorMsg}
          placeholder={
            userType === 'student'
              ? emailIsNeededInCaseLabel
              : 'Your Twinkle email address'
          }
          onChange={(text) => {
            setEmailErrorMsg('');
            onSetEmail(text);
          }}
          type="email"
        />
        <p style={{ color: 'red' }}>{emailErrorMsg}</p>
      </section>
    </div>
  );
}

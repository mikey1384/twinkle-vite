import React, { useEffect, useState } from 'react';
import Input from '~/components/Texts/Input';
import localize from '~/constants/localize';

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
  onSetEmail
}: {
  firstname: string;
  lastname: string;
  email: string;
  onSetFirstname: (value: string) => void;
  onSetLastname: (value: string) => void;
  onSetEmail: (value: string) => void;
}) {
  const [firstnameErrorMsg, setFirstnameErrorMsg] = useState('');
  const [lastnameErrorMsg, setLastnameErrorMsg] = useState('');
  const [emailErrorMsg, setEmailErrorMsg] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (firstname && !isValidRealname(firstname)) {
        setFirstnameErrorMsg('Invalid first name');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [firstname]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (lastname && !isValidRealname(lastname)) {
        setLastnameErrorMsg('Invalid last name');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [lastname]);

  function isValidRealname(realName: string) {
    const pattern = new RegExp(/^[a-zA-Z]+$/);
    return pattern.test(realName);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (email && !isValidEmailAddress(email)) {
        setEmailErrorMsg('Invalid email address');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [email]);

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
            onSetFirstname(text.trim());
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
        <label>{emailYoursOrYourParentsLabel}</label>
        <Input
          value={email}
          hasError={!!emailErrorMsg}
          placeholder={emailIsNeededInCaseLabel}
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

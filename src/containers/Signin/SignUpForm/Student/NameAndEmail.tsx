import React, { useMemo, useState } from 'react';
import Input from '~/components/Texts/Input';
import localize from '~/constants/localize';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';

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
  const [errorMessage, setErrorMessage] = useState('');
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

  return (
    <div>
      <section>
        <label>{firstNameLabel}</label>
        <Input
          maxLength={30}
          hasError={errorMessage === 'firstname'}
          value={firstname}
          placeholder={whatIsYourFirstNameLabel}
          onChange={(text) => {
            setErrorMessage('');
            onSetFirstname(text.trim());
          }}
        />
        {errorMessage === 'firstname' && (
          <p style={{ color: 'red' }}>{notValidFirstNameLabel}</p>
        )}
      </section>
      <section style={{ marginTop: '1rem' }}>
        <label>{lastNameLabel}</label>
        <Input
          maxLength={30}
          hasError={errorMessage === 'lastname'}
          value={lastname}
          placeholder={whatIsYourLastNameLabel}
          onChange={(text) => {
            setErrorMessage('');
            onSetLastname(text.trim());
          }}
        />
        {errorMessage === 'lastname' && (
          <p style={{ color: 'red' }}>{notValidLastNameLabel}</p>
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
            onSetEmail(text);
          }}
          type="email"
        />
        {errorMessage === 'email' && (
          <p style={{ color: 'red' }}>{notValidEmailLabel}</p>
        )}
      </section>
    </div>
  );
}

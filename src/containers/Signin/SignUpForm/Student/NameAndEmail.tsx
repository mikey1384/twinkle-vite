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

/*
function isValidEmailAddress(email: string) {
  const regex =
    '^(([^<>()\\[\\]\\\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$';
  const pattern = new RegExp(regex);
  return pattern.test(email);
}

function isValidRealname(realName: string) {
  const pattern = new RegExp(/^[a-zA-Z]+$/);
  return pattern.test(realName);
}
*/

export default function UsernamePassword({
  onSubmit
}: {
  onSubmit: () => void;
}) {
  const [errorMessage, setErrorMessage] = useState('');
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
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
            setFirstname(text.trim());
          }}
          onKeyPress={(event: any) => {
            if (event.key === 'Enter') {
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
          onKeyPress={(event: any) => {
            if (event.key === 'Enter') {
              onSubmit();
            }
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
            setEmail(text);
          }}
          onKeyPress={(event: any) => {
            if (event.key === 'Enter') {
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
  );
}

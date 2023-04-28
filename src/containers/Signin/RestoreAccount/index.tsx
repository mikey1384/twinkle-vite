import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import EmailSection from './EmailSection';
import UsernameSection from './UsernameSection';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';

RestoreAccount.propTypes = {
  username: PropTypes.string,
  onShowLoginForm: PropTypes.func.isRequired,
  onHide: PropTypes.func.isRequired
};

export default function RestoreAccount({
  username,
  onShowLoginForm,
  onHide
}: {
  username: string;
  onShowLoginForm: () => void;
  onHide: () => void;
}) {
  const searchedProfiles = useAppContext((v) => v.user.state.searchedProfiles);
  const [section, setSection] = useState('username');
  const [searchText, setSearchText] = useState(username);

  const matchingAccount = useMemo(() => {
    if (
      searchedProfiles.filter(
        (profile: any) =>
          profile.username?.toLowerCase?.() === searchText?.toLowerCase?.()
      ).length > 0
    ) {
      return searchedProfiles[0];
    }
    return null;
  }, [searchText, searchedProfiles]);

  const disabled = useMemo(() => {
    if (section === 'username') return !matchingAccount;
    return false;
  }, [matchingAccount, section]);

  const headerTitle = useMemo(() => {
    if (section === 'username') return 'No problem! We are here to help';
    if (section === 'email') {
      if (matchingAccount?.email || matchingAccount?.verifiedEmail) {
        return `Email confirmation`;
      } else {
        return `No email address found. Ask your Twinkle teacher for help.`;
      }
    }
    return 'TBD';
  }, [matchingAccount, section]);

  return (
    <ErrorBoundary componentPath="Signin/RestoreAccount/index">
      <header>{headerTitle}</header>
      <main>
        {section === 'username' && (
          <UsernameSection
            matchingAccount={matchingAccount}
            onNextClick={handleNextClick}
            onSetSearchText={setSearchText}
            searchText={searchText}
          />
        )}
        {section === 'email' && <EmailSection account={matchingAccount} />}
      </main>
      <footer>
        {section === 'username' && (
          <Button
            transparent
            color="orange"
            style={{
              fontSize: '1.5rem',
              marginRight: '1rem'
            }}
            onClick={onShowLoginForm}
          >
            I remember my password
          </Button>
        )}
        <Button
          color="blue"
          disabled={disabled}
          onClick={handleNextClick}
          style={{ fontSize: '2rem' }}
        >
          {section === 'username' ? (
            <div>
              Next <Icon icon="arrow-right" style={{ marginLeft: '0.7rem' }} />
            </div>
          ) : (
            'Close'
          )}
        </Button>
      </footer>
    </ErrorBoundary>
  );

  function handleNextClick() {
    if (section === 'username') {
      return setSection('email');
    }
    onHide();
  }
}

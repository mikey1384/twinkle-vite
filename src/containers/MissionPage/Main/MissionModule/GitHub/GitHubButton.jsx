import React from 'react';
import PropTypes from 'prop-types';
import { GITHUB_APP_ID } from '~/constants/defaultValues';
import Button from '~/components/Button';
import Icon from '~/components/Icon';

GitHubButton.propTypes = {
  style: PropTypes.object
};

export default function GitHubButton({ style }) {
  return (
    <Button
      style={{
        fontSize: '2rem',
        textTransform: 'none',
        fontWeight: 'normal',
        color: 'black',
        ...style
      }}
      skeuomorphic
      onClick={handleGitHubButtonClick}
    >
      <Icon style={{ marginRight: '0.7rem' }} icon={['fab', 'github']} />
      <span>Tap this Button</span>
    </Button>
  );

  function handleGitHubButtonClick() {
    window.location = `https://github.com/login/oauth/authorize?scope=user&client_id=${GITHUB_APP_ID}`;
  }
}

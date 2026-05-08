import React from 'react';
import { GITHUB_APP_ID } from '~/constants/defaultValues';
import Button from '~/components/Button';
import Icon from '~/components/Icon';

export default function GitHubButton({
  style
}: {
  style?: React.CSSProperties;
}) {
  return (
    <Button
      style={{
        fontSize: '2rem',
        textTransform: 'none',
        fontWeight: 'normal',
        color: 'black',
        ...style
      }}
      variant="soft"
      tone="raised"
      onClick={handleGitHubButtonClick}
    >
      <Icon style={{ marginRight: '0.7rem' }} icon={['fab', 'github']} />
      <span>Tap this Button</span>
    </Button>
  );

  function handleGitHubButtonClick() {
    window.location.href = `https://github.com/login/oauth/authorize?scope=user&client_id=${GITHUB_APP_ID}`;
  }
}

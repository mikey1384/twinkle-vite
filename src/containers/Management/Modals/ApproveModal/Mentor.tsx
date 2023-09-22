import React from 'react';

export default function Mentor({ content }: { content: string }) {
  const parsedContent = JSON.parse(content);

  const {
    realName = '',
    branchName = '---',
    className = '---'
  } = parsedContent;

  return (
    <div>
      {`Hi, my name is ${realName} and I'm a teacher at ${className}, ${branchName}. I would like to request a teacher account.`}
    </div>
  );
}

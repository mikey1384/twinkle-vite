import React from 'react';

export default function TeacherForm({
  onSetUsername
}: {
  onSetUsername: (username: string) => void;
}) {
  console.log(onSetUsername);
  return (
    <div>
      <div>Teacher Form</div>
    </div>
  );
}

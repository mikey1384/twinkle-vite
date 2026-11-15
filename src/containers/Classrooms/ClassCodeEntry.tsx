import React, { useState } from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import Button from '~/components/Button';
import ModalFooter from '~/components/Modal/Footer';
import Input from '~/components/Texts/Input';
import { useAppContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import { looksLikeBoardCode } from './shared';

// "I have a class code" in sign-up: for classroom computers without a camera.
// Typing the code a teacher wrote on the board opens that class's join page
// (/join/<code>), which is the whole short sign-up.
export default function ClassCodeEntry({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const onCloseSigninModal = useAppContext(
    (v) => v.user.actions.onCloseSigninModal
  );
  const [code, setCode] = useState('');
  const valid = looksLikeBoardCode(code);

  return (
    <div className={columnClass}>
      <h2 className={headingClass}>Type the class code from your teacher</h2>
      <Input
        autoFocus
        value={code}
        maxLength={12}
        placeholder="TW-"
        autoCapitalize="characters"
        className={inputClass}
        onChange={(text: string) => setCode(text.toUpperCase())}
        onKeyDown={(event: React.KeyboardEvent) => {
          if (event.key === 'Enter') handleGo();
        }}
      />
      <p className={quietClass}>
        It looks like TW-4K7QXY. With a phone or tablet you can point the camera
        at your teacher’s QR code instead.
      </p>
      <ModalFooter>
        <Button
          variant="ghost"
          color="darkerGray"
          style={{ marginRight: 'auto' }}
          onClick={onBack}
        >
          Back
        </Button>
        <Button color="logoBlue" disabled={!valid} onClick={handleGo}>
          Join class
        </Button>
      </ModalFooter>
    </div>
  );

  function handleGo() {
    if (!valid) return;
    const typed = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    onCloseSigninModal();
    navigate(`/join/${typed}`);
  }
}

const columnClass = css`
  width: 100%;
  max-width: 44rem;
  margin: 0 auto;
  padding: 1rem 0 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
`;
const headingClass = css`
  margin: 0;
  font-size: 2.1rem;
  font-weight: 700;
  text-align: center;
  color: ${Color.black()};
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.9rem;
  }
`;
const quietClass = css`
  margin: 0;
  font-size: 1.4rem;
  line-height: 1.5;
  text-align: center;
  color: ${Color.darkGray()};
`;
const inputClass = css`
  text-align: center;
  font-family: 'Roboto Mono', ui-monospace, Menlo, monospace;
  letter-spacing: 0.1em;
`;

import { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import StepSlide from '../components/StepSlide';
import Code from '~/components/Texts/Code';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import localize from '~/constants/localize';

const copiedLabel = localize('copied');

UpdateYourRepl.propTypes = {
  code: PropTypes.string,
  index: PropTypes.number
};

export default function UpdateYourRepl({ code, index }) {
  const codeRef = useRef(null);
  const [copiedShown, setCopiedShown] = useState(false);
  return (
    <StepSlide
      title={
        <>
          Remember the Repl you set up earlier?
          <br />
          The code we gave you for that Repl is{' '}
          <span style={{ color: Color.orange() }}>no longer needed.</span>
          <br />
          <span style={{ color: Color.logoBlue() }}>
            Replace that code with the code below ({`it's`} the one you wrote
            for your website)
          </span>
          <br />
          <span>
            by following the intructions in the{' '}
            <b style={{ color: Color.brownOrange() }}>tutorial</b> (very
            important!)
          </span>
        </>
      }
      index={index}
    >
      <div style={{ position: 'relative', marginTop: '2rem' }}>
        <Code
          codeRef={codeRef}
          language="jsx"
          className={css`
            border-radius: ${borderRadius};
            padding: 1.5rem;
            font-size: 1.2rem;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.1rem;
            }
          `}
        >
          {code}
        </Code>
        <div
          className={css`
            top: 1rem;
            right: 1rem;
            opacity: 0.8;
            position: absolute;
            &:hover {
              opacity: 1;
            }
            @media (max-width: ${mobileMaxWidth}) {
              margin-left: 0;
            }
          `}
        >
          <Button
            skeuomorphic
            onClick={() => {
              setCopiedShown(true);
              handleCopyToClipboard();
              setTimeout(() => setCopiedShown(false), 700);
            }}
          >
            <Icon icon="copy" />
            <span style={{ marginLeft: '0.7rem' }}>Copy</span>
          </Button>
          <div
            style={{
              zIndex: 300,
              display: copiedShown ? 'block' : 'none',
              marginTop: '0.2rem',
              right: 0,
              position: 'absolute',
              background: '#fff',
              fontSize: '1.2rem',
              padding: '1rem',
              wordBreak: 'keep-all',
              border: `1px solid ${Color.borderGray()}`
            }}
          >
            {copiedLabel}
          </div>
        </div>
        <div
          style={{
            textAlign: 'center',
            marginTop: '5rem',
            marginBottom: '3rem'
          }}
        >
          <h1>
            Did you carefully follow the instructions in the{' '}
            <b style={{ color: Color.brownOrange() }}>tutorial</b>
            <br />
            after pressing the{' '}
            <b
              style={{ color: Color.logoBlue() }}
            >{`Replacing the Repl Code`}</b>{' '}
            button?
          </h1>
        </div>
      </div>
    </StepSlide>
  );

  function handleCopyToClipboard() {
    const range = document.createRange();
    range.selectNode(codeRef.current);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    document.execCommand('copy');
  }
}

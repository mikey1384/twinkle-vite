import React, { useEffect } from 'react';
import { css } from '@emotion/css';
import { QRCodeSVG } from 'qrcode.react';
import { Link, useSearchParams } from 'react-router-dom';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useAppContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import {
  MY_CLASSES_PATH,
  leadClass,
  pageClass,
  pageTitleClass,
  panelClass
} from './shared';

const HELP_SOURCES = ['card', 'hint', 'menu', 'classes', 'ask'];

const STEPS: { title: string; text: string }[] = [
  {
    title: 'Make a class',
    text: 'Open My classes from your account menu, type the class name and tap Make class. Only approved teachers can.'
  },
  {
    title: 'Show the code',
    text: 'Put the class card on the classroom screen, or tap Print for the wall. One code works for the whole class: 40 students, 7 days.'
  },
  {
    title: 'Students join',
    text: 'They point a phone or tablet camera at the QR code. On a computer they open Sign up, tap “Have a class code?” and type the board code. Then a username, a password and their first name. No email.'
  },
  {
    title: 'Watch the roster',
    text: 'Everyone who joins shows up under the class. Someone you don’t know? Tap Not my student. Turn off or New code stops a code that got out.'
  },
  {
    title: 'A student asks you',
    text: 'On the sign-up screen a student can tap “Ask my teacher” and find you. Ciel tells you, and the request shows at the top of My classes. “Send them my class code” gives that one student a pass for one account. Only say yes to someone you know.'
  },
  {
    title: 'Forgot a password?',
    text: 'Tap Reset password beside the student. You get a one-time code that works for 15 minutes. The student types it after “I forgot my password” and chooses their own new password. You never see it, and they are told you helped.'
  }
];

// The short teacher help page (/teachers/classes): six steps with the class
// card pictured. The offer card, both hints, My classes and Zero/Ciel's
// answer link here.
export default function ClassHelpPage() {
  const [searchParams] = useSearchParams();
  const recordClassroomEvent = useAppContext(
    (v) => v.requestHelpers.recordClassroomEvent
  );

  useEffect(() => {
    const from = searchParams.get('from') || '';
    recordClassroomEvent({
      kind: 'help_page',
      detail: HELP_SOURCES.includes(from) ? from : 'direct'
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ErrorBoundary componentPath="Classrooms/HelpPage">
      <main className={pageClass}>
        <section className={panelClass}>
          <h1 className={pageTitleClass}>Class codes: how they work</h1>
          <p className={leadClass} style={{ marginTop: '0.8rem' }}>
            Get your students into Twinkle in seconds, without email. You don’t
            have to use this. The usual sign-up still works.
          </p>
          <div className={sampleClass} aria-hidden="true">
            <div className={sampleQrClass}>
              <QRCodeSVG
                value="https://www.twin-kle.com/teachers/classes"
                size={112}
              />
            </div>
            <div>
              <div className={sampleLabelClass}>Board code</div>
              <div className={sampleCodeClass}>TW-4K7QXY</div>
              <div className={sampleLabelClass}>Lions 3 · 12 joined</div>
            </div>
          </div>
          <ol className={stepsClass}>
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <span className={stepNumberClass}>{index + 1}</span>
                <div>
                  <b>{step.title}</b>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className={leadClass}>
            Students can add an email later in Settings if they want one.
          </p>
          <Link to={MY_CLASSES_PATH} className={ctaClass}>
            Open My classes ›
          </Link>
        </section>
      </main>
    </ErrorBoundary>
  );
}

const sampleClass = css`
  display: flex;
  align-items: center;
  gap: 1.6rem;
  margin: 1.6rem 0;
  padding: 1.4rem;
  border: 1px solid var(--ui-border);
  border-radius: 1rem;
  background: ${Color.highlightGray()};
`;
const sampleQrClass = css`
  padding: 0.8rem;
  background: #fff;
  border-radius: 0.8rem;
  line-height: 0;
`;
const sampleLabelClass = css`
  font-size: 1.3rem;
  color: ${Color.darkGray()};
`;
const sampleCodeClass = css`
  font-family: 'Roboto Mono', ui-monospace, Menlo, monospace;
  font-size: 2.6rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: ${Color.black()};
`;
const stepsClass = css`
  list-style: none;
  margin: 0 0 1.6rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
  li {
    display: flex;
    gap: 1.2rem;
    font-size: 1.5rem;
    line-height: 1.5;
    color: ${Color.black()};
  }
  p {
    margin: 0.2rem 0 0;
    color: ${Color.darkerGray()};
  }
  @media (max-width: ${mobileMaxWidth}) {
    li {
      font-size: 1.4rem;
    }
  }
`;
const stepNumberClass = css`
  flex-shrink: 0;
  width: 2.8rem;
  height: 2.8rem;
  border-radius: 50%;
  background: ${Color.logoBlue()};
  color: #fff;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
`;
const ctaClass = css`
  display: inline-block;
  margin-top: 1.2rem;
  font-size: 1.6rem;
  font-weight: 700;
`;

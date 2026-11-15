import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import ErrorBoundary from '~/components/ErrorBoundary';
import AskAgentButton from '~/components/Buttons/AskAgentButton';
import { useAppContext, useKeyContext } from '~/contexts';
import { APPRENTICE_PATH } from '~/constants/apprentice';
import { MIKEY_USER_ID } from '~/constants/defaultValues';
import RolePosting from './RolePosting';
import ApplicationForm from './ApplicationForm';
import { advisorClass, columnClass, pageClass } from './styles';

// /apprentice: Mikey's Apprentice, a real role posting and its private
// application (Mikey, 2026-11-15). Warm and honest: no countdowns, no
// banners, no pushes (why it matters to every reader: the apprentice line in
// agent-guides/standing-rulings.md). An ordinary page anyone can open
// (applying needs an account), reached from the Home menu, Zero/Ciel or a
// pasted link; Mikey's own Subject gets no special button.
export default function Apprentice() {
  const userId = useKeyContext((v) => v.myState.userId);
  const recordApprenticeEvent = useAppContext(
    (v) => v.requestHelpers.recordApprenticeEvent
  );

  useEffect(() => {
    recordApprenticeEvent('page_view');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ErrorBoundary componentPath="Apprentice">
      <main className={pageClass}>
        <div className={columnClass}>
          <RolePosting />
          {userId ? <AdvisorPanel /> : null}
          {/* a new account on this device gets a fresh form, never the last one's text */}
          <ApplicationForm key={userId || 0} />
          {userId === MIKEY_USER_ID && (
            <p style={{ textAlign: 'center', margin: 0 }}>
              <Link to="/management">Read applications in Management</Link>
            </p>
          )}
        </div>
      </main>
    </ErrorBoundary>
  );
}

// Zero or Ciel as advisor: the standard Ask button, with this page attached.
export function AdvisorPanel() {
  return (
    <section className={advisorClass}>
      <p>
        Not sure where you stand? Zero and Ciel can look at what you have
        built and how you help people, and tell you what might make you stand
        out and what you could work on next.
      </p>
      <AskAgentButton
        showLabelOnMobile
        label="Ask for advice"
        context={{
          kind: 'page',
          label: "Mikey's Apprentice role",
          path: APPRENTICE_PATH,
          excerpt:
            'What might make me stand out for this role, and what could I work on?'
        }}
      />
    </section>
  );
}

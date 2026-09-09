import React from 'react';
import ModalFooter from '~/components/Modal/Footer';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { chatFormClass } from '../../chatFormStyles';

export default function SelectScreen({ onHide, onSetSection, focusChoice }: {
  onHide: () => void;
  onSetSection: (section: string) => void;
  focusChoice?: string;
}) {
  return <section className={chatFormClass}>
    <header><h2>Start a new chat</h2><p className="description">Choose the space that fits your conversation.</p></header>
    <main><div className="choice-grid">
      <button type="button" autoFocus={focusChoice === 'regular'} className="choice" onClick={() => onSetSection('regular')}>
        <Icon icon="comments" /><strong>Regular group</strong><span>A shared space for everyday conversations.</span>
      </button>
      <button type="button" autoFocus={focusChoice === 'classroom'} className="choice" onClick={() => onSetSection('classroom')}>
        <Icon icon="chalkboard-teacher" /><strong>Classroom</strong><span>A class space with members chosen by you.</span>
      </button>
    </div></main>
    <ModalFooter><Button variant="ghost" onClick={onHide}>Cancel</Button></ModalFooter>
  </section>;
}

import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '~/components/Icon';
import { APPRENTICE_POSTING_SUBJECT_ID } from '~/constants/apprentice';
import {
  bylineClass,
  eyebrowClass,
  heroClass,
  honestyClass,
  leadClass,
  listClass,
  mustClass,
  panelClass,
  proseClass,
  qualityClass,
  qualityGridClass,
  sectionTitleClass,
  titleClass
} from './styles';

// The role itself, in Mikey's words from his posting (Subject 37282,
// 2026-10-31). Nothing added: the qualities, skills and benefits are his
// list. Read as "this is who we are", never as a checklist or a countdown.
const QUALITIES: { icon: string; title: string; text: string }[] = [
  {
    icon: 'bolt',
    title: 'You just do things',
    text: 'You see something that could be better and start on it, on your own terms, without waiting for anyone’s permission or approval.'
  },
  {
    icon: 'chart-line',
    title: 'You want to grow, and you see yourself clearly',
    text: 'You keep getting better, and you can look at yourself honestly: what you are good at, what you are not yet, and what to work on next.'
  },
  {
    icon: 'lightbulb',
    title: 'You think for yourself',
    text: 'You form your own thoughts and opinions, even when the people around you think differently.'
  },
  {
    icon: 'hammer',
    title: 'You build things that help people',
    text: 'You want what you make to be useful to someone else, not just to you.'
  },
  {
    icon: 'rocket',
    title: 'You adapt, and you stay curious',
    text: 'New tools, new problems, new ideas: you lean in and figure them out.'
  }
];

export default function RolePosting() {
  return (
    <>
      <section className={heroClass}>
        <p className={eyebrowClass}>A role at Twinkle</p>
        <h1 className={titleClass}>Mikey’s Apprentice</h1>
        <p className={leadClass}>
          Builders who might help run Twinkle someday, and keep it going for
          a long time after that.
        </p>
        <div className={bylineClass}>
          <span>
            <Icon icon="user" /> Posted by Mikey
          </span>
          <span>
            <Icon icon="clock" /> Applications always open
          </span>
          <span>
            <Icon icon="lock" /> Your application is private
          </span>
        </div>
      </section>

      <section className={panelClass}>
        <h2 className={sectionTitleClass}>The role</h2>
        <div className={proseClass}>
          <p>
            Mikey is looking for people from this community to help him
            build and manage Twinkle: people who could, one day, fully take
            over its code and its management tools if he ever could no longer
            work on it.
          </p>
          <p>
            Nothing is wrong. He is perfectly healthy and plans to keep
            building Twinkle well into his old age. But it is good to prepare
            for what nobody can predict, and he wants Twinkle to outlast him.
            So the people in this role start by helping him build and run the
            site, and, if something unforeseen ever happened, one of them
            would take the keys and become the next webmaster.
          </p>
          <p>
            You can read Mikey’s original post{' '}
            <Link to={`/subjects/${APPRENTICE_POSTING_SUBJECT_ID}`}>here</Link>.
          </p>
        </div>
      </section>

      <section className={panelClass}>
        <h2 className={sectionTitleClass}>Who thrives here</h2>
        <div className={qualityGridClass}>
          {QUALITIES.map((quality) => (
            <div key={quality.title} className={qualityClass}>
              <h3>
                <Icon icon={quality.icon} /> {quality.title}
              </h3>
              <p>{quality.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={panelClass}>
        <h2 className={sectionTitleClass}>Skills that matter</h2>
        <ul className={listClass}>
          <li>
            <Icon icon="robot" />
            <span>
              <b>Using AI well.</b> This is a must. It is by far the most
              important skill for building and contributing to Twinkle.
            </span>
          </li>
          <li>
            <Icon icon="comments" />
            <span>
              <b>Communicating clearly.</b> Saying what you mean so that other
              people understand it, in writing and in conversation.
            </span>
          </li>
          <li>
            <Icon icon="handshake" />
            <span>
              <b>Emotional and social maturity.</b> Staying composed and
              clear-headed even when things get stressful, and talking with
              people of every age with ease and kindness. People skills
              matter.
            </span>
          </li>
        </ul>
        <p className={mustClass}>
          Going deep in what you love counts. Nobody has to be good at
          everything.
        </p>
      </section>

      <section className={panelClass}>
        <h2 className={sectionTitleClass}>What comes with it</h2>
        <ul className={listClass}>
          <li>
            <Icon icon="user-shield" />
            <span>
              <b>Supermod status.</b> The privileges Twinkle staff have,
              including editing or deleting teachers’ posts. It is not a
              licence to do anything you like: every action is reported to
              Mikey.
            </span>
          </li>
          <li>
            <Icon icon="key" />
            <span>
              <b>A place in Twinkle’s future.</b> If Mikey is ever unable to
              run Twinkle, one of the people who served in this role will take
              responsibility for its codebase and the infrastructure that runs
              it, along with his @programmer account.
            </span>
          </li>
          <li>
            <Icon icon="gift" />
            <span>
              <b>An AI agent subscription.</b> A free Claude or Codex premium
              subscription, worth $200 a month.
            </span>
          </li>
        </ul>
      </section>

      <section className={honestyClass}>
        <h2 className={sectionTitleClass}>How choosing works</h2>
        <div className={proseClass}>
          <p>
            Only one or two people will ever be chosen, and there is no
            timetable. It may be a long while before anyone is, and that is
            fine.
          </p>
          <p>
            Applications never close. The best application is not a perfect
            pitch on the first day; it is one that grows. Send it when you are
            ready, then come back and update it whenever you have built
            something new or learned something about yourself. Every version
            is kept.
          </p>
          <p>
            Only you and Mikey can read your application. Nobody else is told
            you applied.
          </p>
        </div>
      </section>
    </>
  );
}

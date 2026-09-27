import React, { useEffect, useMemo, useRef, useState } from 'react';
import { css, cx, keyframes } from '@emotion/css';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '~/components/Icon';
import { mobileMaxWidth } from '~/constants/css';
import { isLumineHost } from '~/constants/siteBrand';
import cielBuilderFull from '~/assets/ciel-builder-full.png';
import zeroBuilderFull from '~/assets/zero-builder-full.png';
import heroPainting from '~/assets/parents/hero.jpg';
import mathLabShot from '~/assets/parents/math-lab.jpg';
import grammarbleShot from '~/assets/parents/grammarbles.jpg';
import typingShot from '~/assets/parents/arcade-typing.jpg';
import AskTwinkle from './AskTwinkle';
import { PARENTS_TEXT, type ParentsLang } from './text';

// /parents: Twinkle for parents (Mikey, 2026-09-27). No account needed.
// Korean shows automatically for a Korean browser; ?lang=ko|en overrides; the
// 한국어 / English switch is remembered on this device. The words live in
// ./text.ts, one dictionary per language.

const LANG_KEY = 'twinkle-parents-lang';
const CONTACT_EMAIL = 'mikey@twin-kle.com';

function readStoredLang(): ParentsLang | null {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    return stored === 'ko' || stored === 'en' ? stored : null;
  } catch {
    return null;
  }
}

function browserPrefersKorean() {
  if (typeof navigator === 'undefined') return false;
  const languages = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  return languages.some((value) =>
    String(value || '')
      .toLowerCase()
      .startsWith('ko')
  );
}

function initialLang(param: string | null): ParentsLang {
  if (param === 'ko' || param === 'en') return param;
  return readStoredLang() || (browserPrefersKorean() ? 'ko' : 'en');
}

export default function ParentsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const langParam = params.get('lang');
  const [lang, setLang] = useState<ParentsLang>(() => initialLang(langParam));
  const t = PARENTS_TEXT[lang];
  const [titleLead, titleRest] = splitFirstSentence(t.heroTitle);

  useEffect(() => {
    if (langParam === 'ko' || langParam === 'en') setLang(langParam);
  }, [langParam]);

  useEffect(() => {
    // lumine.network is a separate brand; this page belongs to Twinkle
    if (isLumineHost) {
      window.location.replace(
        `https://www.twin-kle.com/parents${window.location.search}`
      );
    }
  }, []);

  useEffect(() => {
    const previousLang = document.documentElement.lang;
    const previousTitle = document.title;
    document.documentElement.lang = lang;
    document.title = t.pageTitle;
    return () => {
      document.documentElement.lang = previousLang;
      document.title = previousTitle;
    };
  }, [lang, t.pageTitle]);

  return (
    <div className={pageClass} lang={lang}>
      <div className={cx(wrapClass, topBarClass)}>
        <span className={brandClass}>
          <Icon icon="heart" /> {t.eyebrow}
        </span>
        <div role="group" aria-label="Language" className={langSwitchClass}>
          {(['ko', 'en'] as ParentsLang[]).map((value) => (
            <button
              key={value}
              type="button"
              lang={value}
              aria-pressed={lang === value}
              onClick={() => handleSetLang(value)}
            >
              {value === 'ko' ? '한국어' : 'English'}
            </button>
          ))}
        </div>
      </div>

      <header className={cx(wrapClass, heroClass)}>
        <div className={heroTextClass}>
          <h1 className={heroTitleClass}>
            {titleLead} <span>{titleRest}</span>
          </h1>
          <p className={heroSubClass}>{t.heroSubhead}</p>
          <p className={heroLeadClass}>{t.heroLead}</p>
          <div className={ctaRowClass}>
            <a href="#learn" className={primaryButtonClass}>
              {t.ctaLearn} <Icon icon="arrow-down" />
            </a>
            <a href="#loop" className={secondaryButtonClass}>
              {t.ctaLoop}
            </a>
          </div>
        </div>
        <figure className={heroArtClass}>
          <img src={heroPainting} alt="" />
        </figure>
      </header>

      <section id="learn" className={cx(wrapClass, sectionClass)}>
        <Reveal>
          <h2 className={sectionTitleClass}>{t.learnTitle}</h2>
          <p className={sectionIntroClass}>{t.learnIntro}</p>
        </Reveal>

        <Reveal className={featureRowClass}>
          <SkillText index={0} lang={lang} />
          <div className={builderArtClass} aria-hidden="true">
            <figure style={{ background: '#e6f0fd' }}>
              <img src={zeroBuilderFull} alt="" />
            </figure>
            <figure style={{ background: '#fcebf4' }}>
              <img src={cielBuilderFull} alt="" />
            </figure>
          </div>
        </Reveal>

        <Reveal className={cx(featureRowClass, featureRowFlipClass)}>
          <SkillText index={1} lang={lang} />
          <Screenshot src={mathLabShot} caption={t.shots.mathLab} />
        </Reveal>

        <div className={twoCardClass}>
          <Reveal className={skillCardClass}>
            <SkillText index={2} lang={lang} />
          </Reveal>
          <Reveal className={skillCardClass}>
            <SkillText index={3} lang={lang} />
          </Reveal>
        </div>

        <Reveal className={featureRowClass}>
          <SkillText index={4} lang={lang} />
          <div className={shotStackClass}>
            <Screenshot src={grammarbleShot} caption={t.shots.grammarbles} />
            <Screenshot src={typingShot} caption={t.shots.typing} />
          </div>
        </Reveal>
        <p className={shotNoteClass}>
          <Icon icon="camera-alt" /> {t.screenshotNote}
        </p>
      </section>

      <section className={whyBandClass}>
        <div className={wrapClass}>
          <Reveal>
            <h2 className={sectionTitleClass}>{t.whyTitle}</h2>
            <p className={sectionIntroClass}>{t.whyIntro}</p>
          </Reveal>
          <div className={whyGridClass}>
            {t.why.map((point, index) => (
              <Reveal key={point.title} className={whyCardClass}>
                <span className={whyIconClass(WHY_COLORS[index])}>
                  <Icon icon={WHY_ICONS[index]} />
                </span>
                <h3>{point.title}</h3>
                <p>{point.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="loop" className={cx(wrapClass, sectionClass)}>
        <Reveal>
          <h2 className={sectionTitleClass}>{t.loopTitle}</h2>
        </Reveal>
        <div className={loopGridClass}>
          <Reveal className={todayPanelClass}>
            <h3>
              <span className={todayTagClass}>
                <Icon icon="check" /> {t.todayLabel}
              </span>
            </h3>
            <ul>
              {t.today.map((point) => (
                <li key={point.title}>
                  <Icon icon="check-circle" className={checkIconClass} />
                  <p>
                    <strong>{point.title}</strong> {point.body}
                  </p>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal className={nextPanelClass}>
            <h3>
              {t.nextLabel}
              <span className={soonBadgeClass}>{t.nextBadge}</span>
            </h3>
            <p className={nextNoteClass}>{t.nextNote}</p>
            <ul>
              {t.next.map((item) => (
                <li key={item}>
                  <Icon icon="clock" className={clockIconClass} />
                  <p>{item}</p>
                </li>
              ))}
            </ul>
            <p className={nextNoteClass}>{t.nextSignIn}</p>
          </Reveal>
        </div>
      </section>

      <section className={cx(wrapClass, sectionClass)}>
        <Reveal>
          <h2 className={sectionTitleClass}>{t.safetyTitle}</h2>
        </Reveal>
        <div className={safetyGridClass}>
          {t.safety.map((point, index) => (
            <Reveal key={point.title} className={safetyItemClass}>
              <Icon icon={SAFETY_ICONS[index]} className={safetyIconClass} />
              <div>
                <h3>{point.title}</h3>
                <p>{point.body}</p>
              </div>
            </Reveal>
          ))}
          <Reveal className={safetyItemClass}>
            <Icon icon="lock" className={safetyIconClass} />
            <div>
              <h3>{t.dataTitle}</h3>
              <p>
                {t.dataBody}{' '}
                <a href="/privacy" target="_blank" rel="noopener">
                  {t.privacyLink}
                </a>
              </p>
            </div>
          </Reveal>
          <Reveal className={safetyItemClass}>
            <Icon icon="info-circle" className={safetyIconClass} />
            <div>
              <h3>{t.lawTitle}</h3>
              <p>{t.lawBody}</p>
            </div>
          </Reveal>
        </div>
        <Reveal className={contactClass}>
          <Icon icon="paper-plane" />
          <p>
            {t.contactLead}{' '}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
        </Reveal>
      </section>

      <section id="ask" className={askBandClass}>
        <div className={cx(wrapClass, askGridClass)}>
          <Reveal className={askTextClass}>
            <h2 className={sectionTitleClass}>{t.askTitle}</h2>
            <p className={sectionIntroClass}>{t.askIntro}</p>
            <ul>
              <li>
                <Icon icon="sparkles" className={askBulletIconClass} />
                <p>
                  <strong>{t.askOursTitle}</strong>
                  {lang === 'ko' ? '' : ' '}
                  {t.askOursBody}
                </p>
              </li>
              <li>
                <Icon icon="robot" className={askBulletIconClass} />
                <p>
                  <strong>{t.askYoursTitle}</strong>
                  {lang === 'ko' ? '' : ' '}
                  {t.askYoursBody}{' '}
                  <a href="/parents/guide" target="_blank" rel="noopener">
                    {t.askGuideLink}
                  </a>
                </p>
              </li>
            </ul>
            <p className={sameFactsClass}>{t.askSameFacts}</p>
          </Reveal>
          <Reveal className={askBoxWrapClass}>
            <AskTwinkle key={lang} lang={lang} t={t} />
          </Reveal>
        </div>
      </section>

      <section className={cx(wrapClass, sectionClass)}>
        <Reveal className={buildCardClass}>
          <div>
            <h2 className={buildTitleClass}>
              {t.buildTitle}
              <span className={soonBadgeClass}>{t.buildBadge}</span>
            </h2>
            <p>{t.buildIntro}</p>
            <p>{t.buildBody}</p>
            <p className={buildWhenClass}>
              <Icon icon="clock" /> {t.buildWhen}
            </p>
          </div>
          <Icon icon="code-branch" className={buildIconClass} />
        </Reveal>
      </section>

      <footer className={cx(wrapClass, footerClass)}>
        <span>{t.footerLine}</span>
        <span>
          <a href="/privacy">{t.privacyLink}</a> ·{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </span>
      </footer>
    </div>
  );

  function handleSetLang(value: ParentsLang) {
    setLang(value);
    try {
      localStorage.setItem(LANG_KEY, value);
    } catch {
      // private mode: the switch still works for this visit
    }
    const next = new URLSearchParams(location.search);
    next.set('lang', value);
    navigate(
      { search: `?${next.toString()}`, hash: location.hash },
      { replace: true }
    );
  }
}

function SkillText({ index, lang }: { index: number; lang: ParentsLang }) {
  const skill = PARENTS_TEXT[lang].skills[index];
  const color = SKILL_COLORS[index];
  return (
    <div className={skillTextClass}>
      <span className={skillBadgeClass(color)}>
        <Icon icon={SKILL_ICONS[index]} />
        <b>{index + 1}</b>
      </span>
      <h3>{skill.title}</h3>
      <p>{skill.body}</p>
      <div className={tagRowClass}>
        {skill.tags.map((tag) => (
          <span key={tag} style={{ color, borderColor: `${color}55` }}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function Screenshot({ src, caption }: { src: string; caption: string }) {
  return (
    <figure className={shotClass}>
      <div className={shotChromeClass} aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <img src={src} alt={caption} loading="lazy" />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

// Sections rise in gently as they scroll into view (not for reduced motion).
function Reveal({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={cx(revealClass, shown && revealShownClass, className)}
    >
      {children}
    </div>
  );
}

function splitFirstSentence(text: string): [string, string] {
  const index = text.indexOf('. ');
  if (index < 0) return [text, ''];
  return [text.slice(0, index + 1), text.slice(index + 2)];
}

const SKILL_ICONS = [
  'wand-magic-sparkles',
  'brain',
  'book-open',
  'pencil-alt',
  'spell-check'
];
const SKILL_COLORS = ['#2f6fd6', '#0f8a6a', '#b4531a', '#8a3fc2', '#c2336b'];
const WHY_ICONS = ['trophy', 'users', 'level-up', 'coins'];
const WHY_COLORS = ['#e0a100', '#2f6fd6', '#0f8a6a', '#c2336b'];
const SAFETY_ICONS = ['eye', 'ban', 'lightbulb', 'coins'];

const INK = '#1b2440';
const BODY = '#46516a';

const riseIn = keyframes`
  from { opacity: 0; transform: translateY(1.6rem); }
  to { opacity: 1; transform: none; }
`;

const floatSoft = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-0.8rem); }
`;

const pageClass = css`
  min-height: 100%;
  padding-bottom: 8rem;
  background: #fbf8f2;
  color: ${BODY};
  font-size: 1.7rem;
  line-height: 1.65;
  overflow-x: hidden;
  &:lang(ko) {
    word-break: keep-all;
    overflow-wrap: anywhere;
  }
  a {
    color: #1f5fbf;
  }
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.6rem;
    padding-bottom: 12rem;
  }
`;

const wrapClass = css`
  max-width: 116rem;
  margin: 0 auto;
  padding: 0 3.2rem;
  box-sizing: border-box;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0 1.6rem;
  }
`;

const topBarClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.2rem;
  flex-wrap: wrap;
  padding-top: 2.4rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding-top: 1.6rem;
  }
`;

const brandClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #b4531a;
  &:lang(ko) {
    letter-spacing: 0.02em;
  }
`;

const langSwitchClass = css`
  display: flex;
  padding: 0.3rem;
  border: 1px solid #e3dccf;
  border-radius: 999px;
  background: #fff;
  button {
    border: none;
    border-radius: 999px;
    padding: 0.55rem 1.4rem;
    font-size: 1.4rem;
    background: transparent;
    color: ${BODY};
    cursor: pointer;
    &[aria-pressed='true'] {
      background: ${INK};
      color: #fff;
      font-weight: 700;
    }
    &:focus-visible {
      outline: 3px solid #99c2ff;
      outline-offset: 1px;
    }
  }
`;

const heroClass = css`
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  align-items: center;
  gap: 4.8rem;
  padding-top: 4rem;
  padding-bottom: 5.6rem;
  animation: ${riseIn} 0.7s ease-out both;
  @media (max-width: 960px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 2.8rem;
  }
  @media (max-width: ${mobileMaxWidth}) {
    padding-top: 2.4rem;
    padding-bottom: 3.6rem;
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const heroTextClass = css`
  min-width: 0;
`;

const heroTitleClass = css`
  margin: 0;
  color: ${INK};
  font-size: 5.4rem;
  line-height: 1.12;
  letter-spacing: -0.02em;
  span {
    color: #2f6fd6;
  }
  &:lang(ko) {
    letter-spacing: -0.01em;
    line-height: 1.25;
  }
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 3.4rem;
  }
`;

const heroSubClass = css`
  margin: 2.2rem 0 0;
  color: ${INK};
  font-size: 2.1rem;
  line-height: 1.5;
  font-weight: 600;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.8rem;
  }
`;

const heroLeadClass = css`
  margin: 1.6rem 0 0;
  font-size: 1.75rem;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.6rem;
  }
`;

const ctaRowClass = css`
  display: flex;
  flex-wrap: wrap;
  gap: 1.2rem;
  margin-top: 2.8rem;
`;

const buttonBase = `
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1.3rem 2.2rem;
  border-radius: 1.2rem;
  font-size: 1.7rem;
  font-weight: 700;
  text-decoration: none;
  transition: transform 0.15s, background 0.15s, box-shadow 0.15s;
  &:hover { transform: translateY(-2px); text-decoration: none; }
  &:focus-visible { outline: 3px solid #99c2ff; outline-offset: 2px; }
`;

const primaryButtonClass = css`
  ${buttonBase}
  background: #1f5fbf;
  color: #fff !important;
  box-shadow: 0 0.8rem 2rem rgba(31, 95, 191, 0.28);
  &:hover {
    background: #184f9f;
  }
`;

const secondaryButtonClass = css`
  ${buttonBase}
  background: #fff;
  color: ${INK} !important;
  border: 1px solid #d8d0c1;
  &:hover {
    background: #fff9ee;
  }
`;

const heroArtClass = css`
  margin: 0;
  min-width: 0;
  img {
    display: block;
    width: 100%;
    aspect-ratio: 6 / 5;
    object-fit: cover;
    border-radius: 2.8rem;
    box-shadow: 0 2.4rem 5rem rgba(60, 44, 20, 0.22);
    animation: ${floatSoft} 7s ease-in-out infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    img {
      animation: none;
    }
  }
`;

const sectionClass = css`
  padding-top: 6.4rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding-top: 4.4rem;
  }
`;

const sectionTitleClass = css`
  margin: 0;
  color: ${INK};
  font-size: 3.6rem;
  line-height: 1.2;
  letter-spacing: -0.01em;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 2.6rem;
  }
`;

const sectionIntroClass = css`
  max-width: 72rem;
  margin: 1.2rem 0 0;
  font-size: 1.85rem;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.65rem;
  }
`;

const featureRowClass = css`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  align-items: center;
  gap: 4.8rem;
  margin-top: 4.8rem;
  @media (max-width: 960px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 2.4rem;
    margin-top: 3.6rem;
  }
`;

const featureRowFlipClass = css`
  @media (min-width: 961px) {
    > :first-child {
      order: 2;
    }
  }
`;

const skillTextClass = css`
  min-width: 0;
  h3 {
    margin: 1.4rem 0 0;
    color: ${INK};
    font-size: 2.5rem;
    line-height: 1.3;
    @media (max-width: ${mobileMaxWidth}) {
      font-size: 2.1rem;
    }
  }
  p {
    margin: 1rem 0 0;
  }
`;

const skillBadgeClass = (color: string) => css`
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.5rem 1.2rem 0.5rem 1rem;
  border-radius: 999px;
  background: ${color}14;
  color: ${color};
  font-size: 1.5rem;
  b {
    font-size: 1.4rem;
  }
`;

const tagRowClass = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  margin-top: 1.4rem;
  span {
    padding: 0.3rem 1rem;
    border: 1px solid;
    border-radius: 999px;
    background: #fff;
    font-size: 1.3rem;
    font-weight: 700;
  }
`;

const builderArtClass = css`
  display: flex;
  justify-content: center;
  gap: 2rem;
  figure {
    flex: 1 1 0;
    max-width: 24rem;
    margin: 0;
    padding: 1.6rem 1.2rem 0;
    border-radius: 2.4rem;
    overflow: hidden;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    aspect-ratio: 4 / 5;
  }
  figure:nth-of-type(2) {
    margin-top: 4rem;
  }
  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: bottom;
  }
  @media (max-width: ${mobileMaxWidth}) {
    gap: 1.2rem;
    figure:nth-of-type(2) {
      margin-top: 2.4rem;
    }
  }
`;

const shotClass = css`
  margin: 0;
  min-width: 0;
  border-radius: 1.6rem;
  background: #fff;
  border: 1px solid #e4ddd0;
  box-shadow: 0 1.8rem 4rem rgba(60, 44, 20, 0.14);
  overflow: hidden;
  img {
    display: block;
    width: 100%;
    height: auto;
  }
  figcaption {
    padding: 1rem 1.4rem;
    border-top: 1px solid #eee7da;
    font-size: 1.4rem;
    font-weight: 600;
    color: ${INK};
  }
`;

const shotChromeClass = css`
  display: flex;
  gap: 0.6rem;
  padding: 0.9rem 1.2rem;
  background: #f3efe7;
  border-bottom: 1px solid #e4ddd0;
  i {
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    background: #d9d1c2;
  }
`;

const shotStackClass = css`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 2rem;
  @media (min-width: 961px) {
    > :first-child {
      width: 82%;
    }
    > :last-child {
      width: 82%;
      margin: -9rem 0 0 18%;
      position: relative;
    }
  }
`;

const shotNoteClass = css`
  margin: 2.4rem 0 0;
  font-size: 1.35rem;
  color: #7a7466;
  text-align: right;
`;

const twoCardClass = css`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2.4rem;
  margin-top: 4.8rem;
  @media (max-width: 960px) {
    grid-template-columns: minmax(0, 1fr);
    margin-top: 3.6rem;
  }
`;

const skillCardClass = css`
  padding: 2.8rem;
  border-radius: 2rem;
  background: #fff;
  border: 1px solid #ece5d8;
  box-shadow: 0 1rem 2.6rem rgba(60, 44, 20, 0.07);
  @media (max-width: ${mobileMaxWidth}) {
    padding: 2rem 1.8rem;
  }
`;

const whyBandClass = css`
  margin-top: 7.2rem;
  padding: 6.4rem 0;
  background: #eef3fb;
  @media (max-width: ${mobileMaxWidth}) {
    margin-top: 4.8rem;
    padding: 4.4rem 0;
  }
`;

const whyGridClass = css`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 2rem;
  margin-top: 3.2rem;
  @media (max-width: 1080px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const whyCardClass = css`
  padding: 2.4rem 2.2rem;
  border-radius: 1.8rem;
  background: #fff;
  border: 1px solid #dde6f4;
  h3 {
    margin: 1.4rem 0 0;
    color: ${INK};
    font-size: 1.9rem;
    line-height: 1.35;
  }
  p {
    margin: 0.8rem 0 0;
    font-size: 1.6rem;
  }
`;

const whyIconClass = (color: string) => css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 4.6rem;
  height: 4.6rem;
  border-radius: 1.4rem;
  background: ${color}1c;
  color: ${color};
  font-size: 2rem;
`;

const loopGridClass = css`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2.4rem;
  margin-top: 3.2rem;
  @media (max-width: 960px) {
    grid-template-columns: minmax(0, 1fr);
  }
  ul {
    list-style: none;
    margin: 1.6rem 0 0;
    padding: 0;
  }
  li {
    display: flex;
    gap: 1.2rem;
    align-items: flex-start;
  }
  li + li {
    margin-top: 1.4rem;
  }
  li p {
    margin: 0;
  }
  strong {
    color: ${INK};
  }
  h3 {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    margin: 0;
    color: ${INK};
    font-size: 2.1rem;
  }
`;

const todayPanelClass = css`
  padding: 2.8rem;
  border-radius: 2rem;
  background: #fff;
  border: 1px solid #d5eadf;
  box-shadow: 0 1rem 2.6rem rgba(20, 80, 50, 0.07);
  @media (max-width: ${mobileMaxWidth}) {
    padding: 2rem 1.8rem;
  }
`;

const todayTagClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 1.2rem;
  border-radius: 999px;
  background: #e2f4ea;
  color: #11683f;
  font-size: 1.5rem;
`;

const nextPanelClass = css`
  padding: 2.8rem;
  border-radius: 2rem;
  background: #fffaf0;
  border: 2px dashed #e6c98f;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 2rem 1.8rem;
  }
`;

const nextNoteClass = css`
  margin: 1.2rem 0 0;
  font-size: 1.5rem;
  color: #7a5a1f;
`;

const soonBadgeClass = css`
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 1.1rem;
  border-radius: 999px;
  background: #fbe6b8;
  color: #6f4a00;
  font-size: 1.3rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  vertical-align: middle;
`;

const checkIconClass = css`
  flex: none;
  margin-top: 0.45rem;
  color: #1a9a5a;
  font-size: 1.8rem;
`;

const clockIconClass = css`
  flex: none;
  margin-top: 0.45rem;
  color: #c08a1e;
  font-size: 1.7rem;
`;

const safetyGridClass = css`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.6rem 3.2rem;
  margin-top: 3.2rem;
  @media (max-width: 960px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const safetyItemClass = css`
  display: flex;
  gap: 1.6rem;
  align-items: flex-start;
  padding: 2rem 0;
  border-top: 1px solid #e6dfd2;
  h3 {
    margin: 0;
    color: ${INK};
    font-size: 1.85rem;
  }
  p {
    margin: 0.5rem 0 0;
  }
`;

const safetyIconClass = css`
  flex: none;
  width: 2.2rem !important;
  margin-top: 0.4rem;
  color: #2f6fd6;
  font-size: 2.1rem;
`;

const contactClass = css`
  display: flex;
  gap: 1.4rem;
  align-items: center;
  margin-top: 2.4rem;
  padding: 2rem 2.4rem;
  border-radius: 1.8rem;
  background: ${INK};
  color: #e8ecf6;
  font-size: 1.75rem;
  p {
    margin: 0;
  }
  a {
    color: #ffd27a;
    font-weight: 700;
    overflow-wrap: anywhere;
  }
  > svg {
    flex: none;
    font-size: 2.2rem;
    color: #ffd27a;
  }
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1.8rem;
    font-size: 1.6rem;
  }
`;

const askBandClass = css`
  margin-top: 7.2rem;
  padding: 6.4rem 0;
  background: #f1ecfb;
  @media (max-width: ${mobileMaxWidth}) {
    margin-top: 4.8rem;
    padding: 4.4rem 0;
  }
`;

const askGridClass = css`
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 4.8rem;
  align-items: start;
  @media (max-width: 960px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 3.2rem;
  }
`;

const askTextClass = css`
  min-width: 0;
  ul {
    list-style: none;
    margin: 2.4rem 0 0;
    padding: 0;
  }
  li {
    display: flex;
    gap: 1.2rem;
    align-items: flex-start;
  }
  li + li {
    margin-top: 1.6rem;
  }
  li p {
    margin: 0;
  }
  strong {
    color: ${INK};
  }
  a {
    font-weight: 700;
    white-space: nowrap;
  }
`;

const askBulletIconClass = css`
  flex: none;
  width: 2rem !important;
  margin-top: 0.4rem;
  color: #7a4fd0;
  font-size: 1.9rem;
`;

const sameFactsClass = css`
  margin: 2rem 0 0;
  padding-left: 1.4rem;
  border-left: 3px solid #cbb8f0;
  font-size: 1.6rem;
`;

const askBoxWrapClass = css`
  min-width: 0;
`;

const buildCardClass = css`
  display: flex;
  gap: 3.2rem;
  align-items: flex-start;
  justify-content: space-between;
  padding: 3.2rem;
  border-radius: 2.4rem;
  background: #fff;
  border: 2px dashed #e0d7c6;
  p {
    margin: 1rem 0 0;
    max-width: 76rem;
  }
  @media (max-width: ${mobileMaxWidth}) {
    padding: 2.2rem 1.8rem;
  }
`;

const buildTitleClass = css`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.2rem;
  margin: 0;
  color: ${INK};
  font-size: 3rem;
  line-height: 1.2;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 2.4rem;
  }
`;

const buildWhenClass = css`
  color: #7a5a1f;
  font-size: 1.5rem;
`;

const buildIconClass = css`
  flex: none;
  color: #d9ceb8;
  font-size: 7rem;
  @media (max-width: ${mobileMaxWidth}) {
    display: none;
  }
`;

const footerClass = css`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 6.4rem !important;
  padding-top: 2.4rem !important;
  border-top: 1px solid #e6dfd2;
  font-size: 1.4rem;
  color: #7a7466;
  a {
    color: #5a5446;
  }
`;

const revealClass = css`
  opacity: 0;
  transform: translateY(2rem);
  transition:
    opacity 0.6s ease-out,
    transform 0.6s ease-out;
  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    transform: none;
    transition: none;
  }
`;

const revealShownClass = css`
  opacity: 1;
  transform: none;
`;

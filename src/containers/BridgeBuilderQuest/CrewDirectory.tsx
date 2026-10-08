import React, { useMemo, useState } from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import Icon from '~/components/Icon';
import { Color, mobileMaxWidth } from '~/constants/css';
import {
  MEETUP_CREW_MAX_MEMBERS,
  MEETUP_GOLD_MIN_BRANCHES
} from '~/constants/meetupQuest';
import CrewCover from './CrewCover';
import DirectoryCard, { crewPath } from './DirectoryCard';
import { STAGE_STYLES, stageLabel } from './covers';
import { questInputClass } from './StepCard';
import type { CrewDirectoryData, CrewStage, DirectoryCrew } from './types';

const WEEK_SECONDS = 7 * 24 * 60 * 60;
const SECTION_LIMIT = 6;
const FILTER_STAGES: CrewStage[] = ['forming', 'parents', 'planning', 'meeting', 'filmed'];
const STAGE_ORDER: CrewStage[] = ['forming', 'parents', 'planning', 'meeting', 'filmed', 'done'];

function branchKey(name: string) {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

const gridClass = css`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(24rem, 1fr));
  gap: 1.4rem;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
    gap: 1.2rem;
  }
`;

const chipClass = (active: boolean, color?: string) => css`
  padding: 0.5rem 1.2rem;
  border-radius: 999px;
  border: 1px solid ${active ? color || Color.logoBlue() : 'var(--ui-border)'};
  background: ${active ? color || Color.logoBlue() : '#fff'};
  color: ${active ? '#fff' : Color.darkerGray()};
  font-size: 1.25rem;
  font-weight: bold;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s ease;
`;

function Section({
  title,
  subtitle,
  icon,
  children
}: {
  title: string;
  subtitle?: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginTop: '2.4rem' }}>
      <h3
        className={css`
          margin: 0;
          font-size: 1.9rem;
          font-weight: bold;
          color: ${Color.black()};
          display: flex;
          align-items: center;
          gap: 0.7rem;
        `}
      >
        <Icon icon={icon} style={{ color: Color.logoBlue() }} />
        {title}
      </h3>
      {subtitle && (
        <p
          className={css`
            margin: 0.3rem 0 1.2rem;
            font-size: 1.3rem;
            color: ${Color.darkGray()};
          `}
        >
          {subtitle}
        </p>
      )}
      {!subtitle && <div style={{ height: '1.2rem' }} />}
      {children}
    </section>
  );
}

// The crew directory: browse like a meetup site. Usernames, profile
// pictures, branches and each crew's public profile only.
export default function CrewDirectory({
  directory,
  achievementTitle,
  onJoin
}: {
  directory: CrewDirectoryData;
  achievementTitle: string;
  onJoin: (crew: DirectoryCrew) => void;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [stageFilter, setStageFilter] = useState<CrewStage | ''>('');
  const { crews, hall, myBranch, hasActiveCrew } = directory;

  const branchOptions = useMemo(() => {
    const counts = new Map<string, { name: string; count: number }>();
    for (const crew of crews) {
      for (const name of crew.branchNames) {
        const key = branchKey(name);
        const entry = counts.get(key) || { name, count: 0 };
        entry.count += 1;
        counts.set(key, entry);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([key, { name }]) => ({ key, name }));
  }, [crews]);

  const filtering = !!(query.trim() || branchFilter || stageFilter);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return crews.filter((crew) => {
      if (stageFilter && crew.stage !== stageFilter) return false;
      if (
        branchFilter &&
        !crew.branchNames.some((name) => branchKey(name) === branchFilter)
      ) {
        return false;
      }
      if (!q) return true;
      return (
        crew.displayName.toLowerCase().includes(q) ||
        crew.branchNames.some((name) => name.toLowerCase().includes(q))
      );
    });
  }, [crews, query, branchFilter, stageFilter]);

  const sections = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    // someone already in a crew still browses the crews that are recruiting
    const joinable = crews.filter(
      (crew) =>
        crew.joinable ||
        crew.inviteId ||
        (hasActiveCrew &&
          !crew.isMine &&
          crew.isOpen &&
          (crew.stage === 'forming' || crew.stage === 'parents') &&
          crew.students < MEETUP_CREW_MAX_MEMBERS)
    );
    const mine = myBranch ? branchKey(myBranch) : '';
    const needsYou = mine
      ? joinable.filter(
          (crew) =>
            crew.branches < MEETUP_GOLD_MIN_BRANCHES &&
            !crew.branchNames.some((name) => branchKey(name) === mine)
        )
      : [];
    const justStarted = crews
      .filter((crew) => now - crew.createdAt < WEEK_SECONDS)
      .sort((a, b) => b.createdAt - a.createdAt);
    const almostThere = crews
      .filter((crew) => crew.stage !== 'forming')
      .sort((a, b) => STAGE_ORDER.indexOf(b.stage) - STAGE_ORDER.indexOf(a.stage));
    return { joinable, needsYou, justStarted, almostThere };
  }, [crews, myBranch, hasActiveCrew]);

  return (
    <div>
      <div
        className={css`
          display: flex;
          flex-direction: column;
          gap: 1rem;
        `}
      >
        <div style={{ position: 'relative' }}>
          <span
            className={css`
              position: absolute;
              left: 1.2rem;
              top: 50%;
              transform: translateY(-50%);
              color: ${Color.gray()};
              font-size: 1.4rem;
            `}
          >
            <Icon icon="search" />
          </span>
          <input
            aria-label="Search crews by name or branch"
            className={questInputClass}
            style={{ paddingLeft: '3.4rem', borderRadius: '999px' }}
            value={query}
            placeholder="Search crews by name or branch"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div
          className={css`
            display: flex;
            gap: 0.6rem;
            overflow-x: auto;
            padding-bottom: 0.3rem;
            scrollbar-width: none;
          `}
        >
          <button
            type="button"
            className={chipClass(!branchFilter && !stageFilter)}
            onClick={() => {
              setBranchFilter('');
              setStageFilter('');
            }}
          >
            All
          </button>
          {FILTER_STAGES.map((stage) => (
            <button
              key={stage}
              type="button"
              aria-pressed={stageFilter === stage}
              className={chipClass(stageFilter === stage, STAGE_STYLES[stage].color)}
              onClick={() => setStageFilter(stageFilter === stage ? '' : stage)}
            >
              {stageLabel(stage, achievementTitle)}
            </button>
          ))}
          {branchOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              aria-pressed={branchFilter === option.key}
              className={chipClass(branchFilter === option.key, Color.darkBlue())}
              onClick={() =>
                setBranchFilter(branchFilter === option.key ? '' : option.key)
              }
            >
              <Icon icon="school" style={{ marginRight: '0.4rem' }} />
              {option.name}
            </button>
          ))}
        </div>
      </div>

      {filtering ? (
        <Section title={`${results.length} crew${results.length === 1 ? '' : 's'} found`} icon="search">
          {results.length ? (
            <div className={gridClass}>
              {results.map((crew) => (
                <DirectoryCard key={crew.crewId} crew={crew} achievementTitle={achievementTitle} onJoin={onJoin} />
              ))}
            </div>
          ) : (
            <p className={css`font-size: 1.4rem; color: ${Color.darkGray()};`}>
              No crews match. Try another branch, or start a crew yourself.
            </p>
          )}
        </Section>
      ) : (
        <>
          {sections.needsYou.length > 0 && (
            <Section
              title="Needs your branch"
              subtitle={`Crews still missing a branch. Your ${myBranch} could complete them.`}
              icon="puzzle-piece"
            >
              <div className={gridClass}>
                {sections.needsYou.slice(0, SECTION_LIMIT).map((crew) => (
                  <DirectoryCard key={crew.crewId} crew={crew} achievementTitle={achievementTitle} onJoin={onJoin} />
                ))}
              </div>
            </Section>
          )}
          {sections.justStarted.length > 0 && (
            <Section title="Just started" subtitle="New crews from this week." icon="rocket">
              <div className={gridClass}>
                {sections.justStarted.slice(0, SECTION_LIMIT).map((crew) => (
                  <DirectoryCard key={crew.crewId} crew={crew} achievementTitle={achievementTitle} onJoin={onJoin} />
                ))}
              </div>
            </Section>
          )}
          {sections.almostThere.length > 0 && (
            <Section
              title="Almost there"
              subtitle="Crews already formed and working toward their meetup."
              icon="fire"
            >
              <div className={gridClass}>
                {sections.almostThere.slice(0, SECTION_LIMIT).map((crew) => (
                  <DirectoryCard key={crew.crewId} crew={crew} achievementTitle={achievementTitle} onJoin={onJoin} />
                ))}
              </div>
            </Section>
          )}
          <Section
            title="Looking for members"
            subtitle={
              hasActiveCrew
                ? "Crews that are recruiting. You're already in a crew, so leave it first to join another."
                : 'Every crew you can join right now.'
            }
            icon="users"
          >
            {sections.joinable.length ? (
              <div className={gridClass}>
                {sections.joinable.map((crew) => (
                  <DirectoryCard key={crew.crewId} crew={crew} achievementTitle={achievementTitle} onJoin={onJoin} />
                ))}
              </div>
            ) : (
              <p className={css`font-size: 1.4rem; color: ${Color.darkGray()}; margin: 0;`}>
                No crews are looking for members right now. Start one and it
                shows up here for everyone.
              </p>
            )}
          </Section>
          {hall.length > 0 && (
            <Section
              title={achievementTitle ? `${achievementTitle}s` : 'Completed crews'}
              subtitle="Crews that met up, learned together and finished the quest."
              icon="trophy"
            >
              <div
                className={css`
                  display: grid;
                  grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
                  gap: 1rem;
                  @media (max-width: ${mobileMaxWidth}) {
                    grid-template-columns: 1fr;
                  }
                `}
              >
                {hall.map((crew) => (
                  <button
                    key={crew.crewId}
                    type="button"
                    onClick={() => navigate(crewPath(crew.crewId))}
                    className={css`
                      display: flex;
                      align-items: center;
                      gap: 1rem;
                      padding: 0.8rem;
                      border-radius: 1rem;
                      border: 1px solid ${Color.gold(0.6)};
                      background: ${Color.gold(0.08)};
                      text-align: left;
                      cursor: pointer;
                    `}
                  >
                    <span style={{ width: '5rem', flexShrink: 0 }}>
                      <CrewCover cover={crew.cover} height="5rem" rounded="0.8rem" />
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <b style={{ fontSize: '1.4rem', color: Color.black() }}>
                        <Icon icon="trophy" style={{ color: Color.gold() }} /> {crew.displayName}
                      </b>
                      <span
                        style={{
                          display: 'block',
                          fontSize: '1.2rem',
                          color: Color.darkerGray(),
                          overflowWrap: 'anywhere'
                        }}
                      >
                        {crew.members.map((member) => member.username).join(', ')}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  );
}

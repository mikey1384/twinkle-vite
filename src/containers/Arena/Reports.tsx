import React, { useEffect, useMemo, useRef, useState } from 'react';
import { css, cx } from '@emotion/css';
import { v1 as uuidv1 } from 'uuid';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import { prepareStoryPhoto } from '~/containers/BridgeBuilderQuest/Story/storyHelpers';
import ArenaButton from './ArenaButton';
import ArenaLoader from './ArenaLoader';
import { ARENA } from './theme';

// Train's two rewarded collection flows (API helpers/arena/reports.ts, SPEC
// §10-11): report a real exam result (5,000 XP once a reviewer verifies it)
// and send a real school or academy paper (3,000-20,000 XP + coins when
// accepted, by how rare it is). Files go up through the site's normal upload
// with context 'arena' and are kept privately: the member sees their own,
// reviewers see them through signed links, nobody else.

interface ExamChoice {
  key: string;
  name: string;
  maxScore: number;
  grades: { value: number; label: string }[];
  sittings: string[];
}

interface ScoreReport {
  id: number;
  examName: string;
  sitting: string;
  gradeLabel: string | null;
  score: number | null;
  maxScore: number | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewNote: string | null;
  xpReward: number;
  createdAt: number;
  proofUrl: string | null;
}

interface PaperSubmission {
  id: number;
  title: string;
  status: 'pending' | 'approved' | 'rejected' | 'duplicate';
  reviewNote: string | null;
  xpReward: number;
  coinReward: number;
  createdAt: number;
  files: { kind: 'image' | 'pdf'; url: string | null }[];
}

interface ReportsData {
  exams: ExamChoice[];
  paper: {
    examKinds: string[];
    terms: string[];
    gradeLevels: string[];
    maxFiles: number;
  };
  rewards: { scoreXp: number; paperMinXp: number; paperMaxXp: number };
  scoreReports: ScoreReport[];
  papers: PaperSubmission[];
}

const EXAM_KIND_LABELS: Record<string, string> = {
  school: 'School exam (내신)',
  academy: 'Academy test',
  other: 'Other'
};
const TERM_LABELS: Record<string, string> = {
  '1학기 중간': 'Semester 1 midterm',
  '1학기 기말': 'Semester 1 final',
  '2학기 중간': 'Semester 2 midterm',
  '2학기 기말': 'Semester 2 final',
  기타: 'Other'
};
const GRADE_LEVEL_LABELS: Record<string, string> = {
  중1: 'Middle school, year 1',
  중2: 'Middle school, year 2',
  중3: 'Middle school, year 3',
  고1: 'High school, year 1',
  고2: 'High school, year 2',
  고3: 'High school, year 3',
  기타: 'Other'
};
const PDF_MAX_BYTES = 25 * 1024 * 1024;

const xp = (value: number) => value.toLocaleString('en-US');

export default function Reports({
  kind,
  onBack
}: {
  kind: 'score' | 'paper';
  onBack: () => void;
}) {
  const loadArenaReports = useAppContext(
    (v) => v.requestHelpers.loadArenaReports
  );
  const [data, setData] = useState<ReportsData | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;
    loadArenaReports()
      .then((result: ReportsData) => !cancelled && setData(result))
      .catch(() => !cancelled && setLoadError('This could not be loaded.'));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={wrapCls}>
      <header className={headCls}>
        <button type="button" className={backCls} onClick={onBack}>
          <Icon icon="arrow-left" /> Train
        </button>
        <div>
          <h2 className={titleCls}>
            {kind === 'score' ? 'Report a real score' : 'Send a real paper'}
          </h2>
          <p className={subCls}>
            {kind === 'score'
              ? 'Tell us how you did on a real exam. Once a reviewer checks it, you earn XP, once per exam sitting.'
              : 'Share a real test paper from your school or academy so Arena’s mock exams feel like the real thing.'}
          </p>
        </div>
      </header>
      {!data ? (
        loadError ? (
          <p className={mutedCls}>{loadError}</p>
        ) : (
          <ArenaLoader text="Loading…" />
        )
      ) : kind === 'score' ? (
        <ScoreReportForm data={data} onSaved={setData} />
      ) : (
        <PaperForm data={data} onSaved={setData} />
      )}
    </div>
  );
}

function ScoreReportForm({
  data,
  onSaved
}: {
  data: ReportsData;
  onSaved: (data: ReportsData) => void;
}) {
  const uploadFile = useAppContext((v) => v.requestHelpers.uploadFile);
  const submitArenaScoreReport = useAppContext(
    (v) => v.requestHelpers.submitArenaScoreReport
  );
  const [examKey, setExamKey] = useState(data.exams[0]?.key || '');
  const exam = data.exams.find((e) => e.key === examKey);
  const [sitting, setSitting] = useState('');
  const [sittingOther, setSittingOther] = useState('');
  const [grade, setGrade] = useState('');
  const [score, setScore] = useState('');
  const [proof, setProof] = useState<{ file: File; preview: string } | null>(
    null
  );
  const [progress, setProgress] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    return () => {
      if (proof) URL.revokeObjectURL(proof.preview);
    };
  }, [proof]);

  const ready =
    !!exam &&
    (sitting === 'other' ? !!sittingOther.trim() : !!sitting) &&
    (grade !== '' || score.trim() !== '');

  return (
    <>
      <section className={cardCls}>
        <p className={rewardCls}>
          <Icon icon="star" /> +{xp(data.rewards.scoreXp)} XP when a reviewer
          verifies it
        </p>
        <label className={fieldCls}>
          <span>Exam</span>
          <select
            value={examKey}
            onChange={(event) => {
              setExamKey(event.target.value);
              setSitting('');
              setGrade('');
              setScore('');
            }}
          >
            {data.exams.map((option) => (
              <option key={option.key} value={option.key}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
        <label className={fieldCls}>
          <span>Which sitting</span>
          <select
            value={sitting}
            onChange={(event) => setSitting(event.target.value)}
          >
            <option value="">Pick one</option>
            {(exam?.sittings || []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
            <option value="other">Other (type it)</option>
          </select>
        </label>
        {sitting === 'other' && (
          <label className={fieldCls}>
            <span>Sitting, as printed on your score sheet</span>
            <input
              value={sittingOther}
              maxLength={40}
              placeholder="e.g. 2025 6월 모평"
              onChange={(event) => setSittingOther(event.target.value)}
            />
          </label>
        )}
        <div className={rowFieldsCls}>
          <label className={fieldCls}>
            <span>Grade</span>
            <select
              value={grade}
              onChange={(event) => setGrade(event.target.value)}
            >
              <option value="">Not given</option>
              {(exam?.grades || []).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className={fieldCls}>
            <span>Raw score (out of {exam?.maxScore ?? 100})</span>
            <input
              inputMode="numeric"
              value={score}
              placeholder="Not given"
              onChange={(event) =>
                setScore(event.target.value.replace(/[^0-9]/g, '').slice(0, 3))
              }
            />
          </label>
        </div>
        <div className={fieldCls}>
          <span>
            Photo of your score sheet (optional, but it is checked faster)
          </span>
          {proof ? (
            <div className={proofRowCls}>
              <img src={proof.preview} alt="Your score sheet" />
              <button
                type="button"
                className={smallButtonCls}
                onClick={() => setProof(null)}
              >
                Remove
              </button>
            </div>
          ) : (
            <label className={pickCls}>
              <Icon icon="camera" /> Add a photo
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (file) {
                    setProof({ file, preview: URL.createObjectURL(file) });
                  }
                }}
              />
            </label>
          )}
          <small className={hintCls}>
            Only you and Twinkle’s reviewers can see it. You can cover your name
            and student number.
          </small>
        </div>
        {error && <p className={errorCls}>{error}</p>}
        {sent && !error && (
          <p className={okCls}>
            <Icon icon="check" /> Sent. You will get a notification when it is
            reviewed.
          </p>
        )}
        <div>
          <ArenaButton
            tone="train"
            disabled={!ready}
            loading={submitting}
            onClick={handleSubmit}
          >
            {progress != null && progress < 100
              ? `Uploading ${progress}%`
              : 'Send for review'}
          </ArenaButton>
        </div>
      </section>
      <History title="Your score reports" empty="No reports yet.">
        {data.scoreReports.map((report) => (
          <li key={report.id} className={historyItemCls}>
            <span className={historyTextCls}>
              <strong>
                {report.sitting} {report.examName}
              </strong>
              <span>
                {[
                  report.gradeLabel,
                  report.score != null
                    ? `${report.score}/${report.maxScore ?? '?'}`
                    : null
                ]
                  .filter(Boolean)
                  .join(' · ')}
                {report.proofUrl && (
                  <>
                    {' · '}
                    <a href={report.proofUrl} target="_blank" rel="noreferrer">
                      photo
                    </a>
                  </>
                )}
              </span>
            </span>
            <StatusChip
              status={report.status}
              reward={
                report.status === 'approved' ? `+${xp(report.xpReward)} XP` : ''
              }
              note={report.reviewNote}
            />
          </li>
        ))}
      </History>
    </>
  );

  async function handleSubmit() {
    if (!exam) return;
    setSubmitting(true);
    setError('');
    setSent(false);
    try {
      let proofKey = '';
      if (proof) {
        const prepared = await prepareStoryPhoto(proof.file);
        setProgress(0);
        proofKey =
          (await uploadFile({
            context: 'arena',
            filePath: uuidv1(),
            file: prepared.file,
            fileName: 'score-proof.jpg',
            onUploadProgress: ({
              loaded,
              total
            }: {
              loaded: number;
              total: number;
            }) => setProgress(Math.round((loaded / (total || 1)) * 100))
          })) || '';
        if (!proofKey) throw new Error('The photo did not finish uploading.');
      }
      const result = await submitArenaScoreReport({
        examKey: exam.key,
        sitting,
        sittingOther: sitting === 'other' ? sittingOther : undefined,
        grade: grade === '' ? null : Number(grade),
        score: score.trim() === '' ? null : Number(score),
        proofKey: proofKey || undefined
      });
      onSaved(result);
      setSent(true);
      setSitting('');
      setSittingOther('');
      setGrade('');
      setScore('');
      setProof(null);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          'Your report could not be sent. Try again.'
      );
    } finally {
      setSubmitting(false);
      setProgress(null);
    }
  }
}

interface PickedFile {
  id: string;
  file: File;
  isPdf: boolean;
  preview: string;
}

function PaperForm({
  data,
  onSaved
}: {
  data: ReportsData;
  onSaved: (data: ReportsData) => void;
}) {
  const uploadFile = useAppContext((v) => v.requestHelpers.uploadFile);
  const submitArenaPaper = useAppContext(
    (v) => v.requestHelpers.submitArenaPaper
  );
  const thisYear = new Date().getFullYear();
  const [examKind, setExamKind] = useState('school');
  const [school, setSchool] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [year, setYear] = useState(String(thisYear));
  const [term, setTerm] = useState('');
  const [subject, setSubject] = useState('');
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [uploadText, setUploadText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  // previews live until their page is removed or the form goes away
  const previewsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const previews = previewsRef.current;
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const yearOptions = useMemo(
    () => Array.from({ length: 8 }, (_, i) => String(thisYear - i)),
    [thisYear]
  );
  const isSchool = examKind === 'school';
  const ready =
    files.length > 0 &&
    !!subject.trim() &&
    (examKind === 'other' || !!school.trim()) &&
    (!isSchool || (!!year && !!term && !!gradeLevel));

  return (
    <>
      <section className={cardCls}>
        <p className={rewardCls}>
          <Icon icon="star" /> {xp(data.rewards.paperMinXp)}–
          {xp(data.rewards.paperMaxXp)} XP plus coins when accepted. A school we
          don’t have yet pays the most.
        </p>
        <p className={hintCls}>
          Your paper stays private: only Twinkle’s reviewers see it, to make
          Arena’s mock exams feel like the real thing. We never copy its
          questions or show it to other members. A paper we already have does
          not earn XP again.
        </p>
        <label className={fieldCls}>
          <span>What kind of test</span>
          <select
            value={examKind}
            onChange={(event) => setExamKind(event.target.value)}
          >
            {data.paper.examKinds.map((option) => (
              <option key={option} value={option}>
                {EXAM_KIND_LABELS[option] || option}
              </option>
            ))}
          </select>
        </label>
        <label className={fieldCls}>
          <span>
            {examKind === 'academy' ? 'Academy name' : 'School name'}
            {examKind === 'other' ? ' (optional)' : ''}
          </span>
          <input
            value={school}
            maxLength={80}
            placeholder={
              examKind === 'academy' ? 'e.g. 대치 OO학원' : 'e.g. 서울고등학교'
            }
            onChange={(event) => setSchool(event.target.value)}
          />
        </label>
        <div className={rowFieldsCls}>
          <label className={fieldCls}>
            <span>Grade{isSchool ? '' : ' (optional)'}</span>
            <select
              value={gradeLevel}
              onChange={(event) => setGradeLevel(event.target.value)}
            >
              <option value="">Pick one</option>
              {data.paper.gradeLevels.map((option) => (
                <option key={option} value={option}>
                  {GRADE_LEVEL_LABELS[option] || option}
                </option>
              ))}
            </select>
          </label>
          <label className={fieldCls}>
            <span>Year{isSchool ? '' : ' (optional)'}</span>
            <select
              value={year}
              onChange={(event) => setYear(event.target.value)}
            >
              {!isSchool && <option value="">Not sure</option>}
              {yearOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className={rowFieldsCls}>
          <label className={fieldCls}>
            <span>Term{isSchool ? '' : ' (optional)'}</span>
            <select
              value={term}
              onChange={(event) => setTerm(event.target.value)}
            >
              <option value="">Pick one</option>
              {data.paper.terms.map((option) => (
                <option key={option} value={option}>
                  {TERM_LABELS[option] || option}
                </option>
              ))}
            </select>
          </label>
          <label className={fieldCls}>
            <span>Subject</span>
            <input
              value={subject}
              maxLength={40}
              placeholder="e.g. 영어, 수학 I"
              onChange={(event) => setSubject(event.target.value)}
            />
          </label>
        </div>
        <div className={fieldCls}>
          <span>
            Photos of every page, or one PDF (up to {data.paper.maxFiles} files)
          </span>
          {files.length > 0 && (
            <ul className={pagesCls}>
              {files.map((picked, index) => (
                <li key={picked.id}>
                  {picked.isPdf ? (
                    <span className={pdfTileCls}>
                      <Icon icon="file-pdf" /> PDF
                    </span>
                  ) : (
                    <img src={picked.preview} alt={`Page ${index + 1}`} />
                  )}
                  <button
                    type="button"
                    aria-label={`Remove page ${index + 1}`}
                    onClick={() => removeFile(picked)}
                  >
                    <Icon icon="times" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {files.length < data.paper.maxFiles && (
            <label className={pickCls}>
              <Icon icon="camera" /> Add pages
              <input
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={handlePick}
              />
            </label>
          )}
          <small className={hintCls}>
            Please cover names and student numbers if you can; reviewers blur
            anything left.
          </small>
        </div>
        {error && <p className={errorCls}>{error}</p>}
        {sent && !error && (
          <p className={okCls}>
            <Icon icon="check" /> Sent. You will get a notification when it is
            reviewed.
          </p>
        )}
        <div>
          <ArenaButton
            tone="train"
            disabled={!ready}
            loading={submitting}
            onClick={handleSubmit}
          >
            {uploadText || 'Send for review'}
          </ArenaButton>
        </div>
      </section>
      <History title="Your papers" empty="No papers yet.">
        {data.papers.map((paper) => (
          <li key={paper.id} className={historyItemCls}>
            <span className={historyTextCls}>
              <strong>{paper.title}</strong>
              <span>
                {paper.files.length} file{paper.files.length === 1 ? '' : 's'}
                {paper.files.map((file, index) =>
                  file.url ? (
                    <React.Fragment key={index}>
                      {' · '}
                      <a href={file.url} target="_blank" rel="noreferrer">
                        {file.kind === 'pdf' ? 'PDF' : `page ${index + 1}`}
                      </a>
                    </React.Fragment>
                  ) : null
                )}
              </span>
            </span>
            <StatusChip
              status={paper.status}
              reward={
                paper.status === 'approved'
                  ? `+${xp(paper.xpReward)} XP, +${xp(paper.coinReward)} coins`
                  : ''
              }
              note={paper.reviewNote}
            />
          </li>
        ))}
      </History>
    </>
  );

  function removeFile(picked: PickedFile) {
    if (picked.preview) {
      URL.revokeObjectURL(picked.preview);
      previewsRef.current.delete(picked.preview);
    }
    setFiles((current) => current.filter((f) => f.id !== picked.id));
  }

  function clearFiles() {
    files.forEach((picked) => {
      if (picked.preview) {
        URL.revokeObjectURL(picked.preview);
        previewsRef.current.delete(picked.preview);
      }
    });
    setFiles([]);
  }

  function handlePick(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files || []);
    event.target.value = '';
    setError('');
    const room = data.paper.maxFiles - files.length;
    const next: PickedFile[] = [];
    for (const file of picked.slice(0, room)) {
      const isPdf =
        file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
      if (isPdf && file.size > PDF_MAX_BYTES) {
        setError('That PDF is too large. Send photos of the pages instead.');
        continue;
      }
      const preview = isPdf ? '' : URL.createObjectURL(file);
      if (preview) previewsRef.current.add(preview);
      next.push({ id: uuidv1(), file, isPdf, preview });
    }
    if (picked.length > room) {
      setError(`Up to ${data.paper.maxFiles} files at a time.`);
    }
    setFiles((current) => [...current, ...next]);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    setSent(false);
    try {
      const fileKeys: string[] = [];
      for (const [index, picked] of files.entries()) {
        setUploadText(`Uploading ${index + 1} of ${files.length}…`);
        const upload = picked.isPdf
          ? picked.file
          : (await prepareStoryPhoto(picked.file)).file;
        const key = await uploadFile({
          context: 'arena',
          filePath: uuidv1(),
          file: upload,
          fileName: `paper-${index + 1}.${picked.isPdf ? 'pdf' : 'jpg'}`
        });
        if (!key) throw new Error('A page did not finish uploading.');
        fileKeys.push(key);
      }
      setUploadText('Checking…');
      const result = await submitArenaPaper({
        fileKeys,
        examKind,
        school: school.trim() || undefined,
        gradeLevel: gradeLevel || undefined,
        year: year ? Number(year) : null,
        term: term || undefined,
        subject: subject.trim()
      });
      onSaved(result);
      setSent(true);
      clearFiles();
      setSubject('');
      setTerm('');
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          'Your paper could not be sent. Try again.'
      );
    } finally {
      setSubmitting(false);
      setUploadText('');
    }
  }
}

function History({
  title,
  empty,
  children
}: {
  title: string;
  empty: string;
  children: React.ReactNode[];
}) {
  return (
    <section className={cardCls}>
      <h3 className={historyTitleCls}>{title}</h3>
      {children.length ? (
        <ul className={historyListCls}>{children}</ul>
      ) : (
        <p className={mutedCls}>{empty}</p>
      )}
    </section>
  );
}

function StatusChip({
  status,
  reward,
  note
}: {
  status: string;
  reward: string;
  note: string | null;
}) {
  const label =
    status === 'approved'
      ? `Verified · ${reward}`
      : status === 'pending'
        ? 'Waiting for review'
        : status === 'duplicate'
          ? 'Already in our library'
          : 'Not accepted';
  return (
    <span className={chipWrapCls}>
      <span
        className={cx(
          chipCls,
          status === 'approved' && chipOkCls,
          status === 'rejected' && chipNoCls
        )}
      >
        {label}
      </span>
      {note && status !== 'approved' && (
        <span className={chipNoteCls}>{note}</span>
      )}
    </span>
  );
}

const wrapCls = css`
  width: 100%;
  max-width: 82rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  color: ${ARENA.ink};
`;

const headCls = css`
  display: flex;
  align-items: center;
  gap: 1.6rem;
  @media (max-width: ${mobileMaxWidth}) {
    align-items: flex-start;
    flex-direction: column;
    gap: 1rem;
  }
`;

const backCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 1rem;
  border: 2px solid ${ARENA.ink};
  border-radius: 8px;
  background: #fff;
  font-weight: 800;
  cursor: pointer;
`;

const titleCls = css`
  margin: 0;
  font-size: 2.2rem;
  font-weight: 900;
`;

const subCls = css`
  margin: 0.2rem 0 0;
  color: ${ARENA.inkSoft};
  font-weight: 600;
  line-height: 1.45;
`;

const mutedCls = css`
  margin: 0;
  color: ${ARENA.inkSoft};
  font-size: 1.35rem;
`;

const cardCls = css`
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
  padding: 1.8rem;
  border: 3px solid ${ARENA.line};
  border-radius: 12px;
  box-shadow: 3px 3px 0 ${ARENA.line};
  background: ${ARENA.paper};
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1.4rem;
  }
`;

const rewardCls = css`
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1.5rem;
  font-weight: 800;
  color: ${ARENA.train};
`;

const fieldCls = css`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
  > span {
    font-size: 1.3rem;
    font-weight: 800;
  }
  input:not([type='file']),
  select {
    width: 100%;
    padding: 0.8rem 1rem;
    border: 2px solid ${ARENA.line};
    border-radius: 8px;
    background: #fff;
    color: ${ARENA.ink};
    font: inherit;
    font-size: 1.5rem;
  }
`;

const rowFieldsCls = css`
  display: flex;
  gap: 1.2rem;
  @media (max-width: ${mobileMaxWidth}) {
    flex-direction: column;
  }
`;

const pickCls = css`
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 1.4rem;
  border: 2px dashed ${ARENA.line};
  border-radius: 8px;
  background: #fff;
  font-size: 1.4rem;
  font-weight: 800;
  cursor: pointer;
  input {
    display: none;
  }
`;

const proofRowCls = css`
  display: flex;
  align-items: center;
  gap: 1rem;
  img {
    width: 9rem;
    height: 9rem;
    object-fit: cover;
    border: 2px solid ${ARENA.line};
    border-radius: 8px;
  }
`;

const pagesCls = css`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  li {
    position: relative;
    width: 8rem;
    height: 10rem;
  }
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border: 2px solid ${ARENA.line};
    border-radius: 8px;
  }
  button {
    position: absolute;
    top: -0.6rem;
    right: -0.6rem;
    width: 2.6rem;
    height: 2.6rem;
    border: 2px solid ${ARENA.line};
    border-radius: 50%;
    background: #fff;
    font-size: 1.2rem;
    cursor: pointer;
  }
`;

const pdfTileCls = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  width: 100%;
  height: 100%;
  border: 2px solid ${ARENA.line};
  border-radius: 8px;
  background: #fff;
  font-weight: 800;
  font-size: 1.3rem;
`;

const hintCls = css`
  margin: 0;
  font-size: 1.25rem;
  line-height: 1.45;
  color: ${ARENA.inkSoft};
`;

const errorCls = css`
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: ${ARENA.accent};
`;

const okCls = css`
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1.35rem;
  font-weight: 700;
  color: ${ARENA.train};
`;

const smallButtonCls = css`
  padding: 0.5rem 1rem;
  border: 2px solid ${ARENA.line};
  border-radius: 8px;
  background: #fff;
  font: inherit;
  font-size: 1.25rem;
  font-weight: 700;
  cursor: pointer;
`;

const historyTitleCls = css`
  margin: 0;
  font-size: 1.7rem;
  font-weight: 900;
`;

const historyListCls = css`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const historyItemCls = css`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem 1.2rem;
  border: 2px solid ${ARENA.line};
  border-radius: 10px;
  background: #fff;
  @media (max-width: ${mobileMaxWidth}) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const historyTextCls = css`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  strong {
    font-size: 1.45rem;
  }
  span {
    font-size: 1.25rem;
    color: ${ARENA.inkSoft};
  }
  a {
    color: ${ARENA.sky};
    font-weight: 700;
  }
`;

const chipWrapCls = css`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.3rem;
  max-width: 28rem;
  @media (max-width: ${mobileMaxWidth}) {
    align-items: flex-start;
  }
`;

const chipCls = css`
  padding: 0.3rem 0.9rem;
  border: 2px solid ${ARENA.line};
  border-radius: 999px;
  background: ${ARENA.background};
  font-size: 1.2rem;
  font-weight: 800;
  white-space: nowrap;
`;

const chipOkCls = css`
  background: ${ARENA.train};
  color: #fff;
`;

const chipNoCls = css`
  background: ${ARENA.coral};
  color: #fff;
`;

const chipNoteCls = css`
  font-size: 1.2rem;
  color: ${ARENA.inkSoft};
  text-align: right;
  @media (max-width: ${mobileMaxWidth}) {
    text-align: left;
  }
`;

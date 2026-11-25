import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import Modal from '~/components/Modal';
import { useAppContext } from '~/contexts';

// The owner's "Players" box under the app's address (Mikey, 2026-11-25):
// which accounts the app's players use, and everyone who has played on the
// app's own address. App makers have full authority over their app (standing
// ruling 11-25): they see every player and can turn one of the app's own
// accounts off (or back on). Twinkle members' accounts are Twinkle's.
//   Twinkle accounts  the default; players sign in with Twinkle
//   App accounts      players make an account for this app only (no Twinkle
//                     Coins, XP or rewards)
//   Both              app accounts, which can link a Twinkle account to
//                     earn Coins and XP; Twinkle members can also sign in

type Mode = 'twinkle' | 'app' | 'both';
interface PlayerRow {
  id: number;
  kind: 'twinkle' | 'app';
  name: string;
  linkedTo: string | null;
  createdAt: number;
  lastSeenAt: number;
  disabled: boolean;
  guardianApproved: boolean;
}

const TEXT = {
  en: {
    open: 'Players',
    title: 'Players',
    accountsLabel: 'Player accounts',
    modes: {
      twinkle: ['Twinkle accounts', 'Players sign in with Twinkle and can earn Coins and XP.'],
      app: ['App accounts', 'Players make an account just for this app. No Twinkle Coins or XP.'],
      both: ['Both', 'App accounts, which can link a Twinkle account to earn Coins and XP.']
    } as Record<Mode, [string, string]>,
    switchNote: 'Changing this never removes anyone’s account or progress.',
    none: 'Nobody has played on the app’s address yet.',
    twinkleTag: 'Twinkle',
    appTag: 'App account',
    linked: (name: string) => `Linked to ${name}`,
    parent: 'Parent approved',
    disabledTag: 'Turned off',
    turnOff: 'Turn off',
    turnOn: 'Turn on',
    lastSeen: (date: string) => `Last played ${date}`,
    aiTitle: 'AI for players without Twinkle',
    aiBody:
      'Cover the AI your app uses for its own accounts, from your Coins (the same price as a member’s AI Energy recharge). Twinkle members always use their own AI Energy.',
    aiOn: 'Cover their AI',
    aiDaily: 'Your Coins a day, at most',
    aiPlayer: 'Coins per player a day, at most',
    aiSave: 'Save',
    aiToday: (coins: string, cap: string) => `Today: ${coins} of ${cap} Coins`,
    aiPlayerToday: (coins: string) => `AI today: ${coins} Coins`,
    close: 'Close',
    failed: 'That didn’t work. Please try again.'
  },
  ko: {
    open: '플레이어',
    title: '플레이어',
    accountsLabel: '플레이어 계정',
    modes: {
      twinkle: ['트윈클 계정', '플레이어가 트윈클로 로그인하고 코인과 XP를 받을 수 있어요.'],
      app: ['앱 계정', '플레이어가 이 앱만을 위한 계정을 만들어요. 트윈클 코인이나 XP는 없어요.'],
      both: ['둘 다', '앱 계정을 쓰고, 트윈클 계정을 연결하면 코인과 XP를 받을 수 있어요.']
    } as Record<Mode, [string, string]>,
    switchNote: '바꿔도 누구의 계정이나 진행 상황도 지워지지 않아요.',
    none: '아직 앱 주소에서 플레이한 사람이 없어요.',
    twinkleTag: '트윈클',
    appTag: '앱 계정',
    linked: (name: string) => `${name}에 연결됨`,
    parent: '보호자 동의 완료',
    disabledTag: '꺼짐',
    turnOff: '끄기',
    turnOn: '켜기',
    lastSeen: (date: string) => `마지막 플레이 ${date}`,
    aiTitle: '트윈클 계정이 없는 플레이어의 AI',
    aiBody:
      '앱 계정이 쓰는 AI 비용을 내 코인으로 대신 내 줘요 (회원의 AI 에너지 충전과 같은 가격). 트윈클 회원은 언제나 자기 AI 에너지를 써요.',
    aiOn: 'AI 비용 대신 내기',
    aiDaily: '하루 최대 코인',
    aiPlayer: '플레이어 한 명당 하루 최대 코인',
    aiSave: '저장',
    aiToday: (coins: string, cap: string) => `오늘 ${cap}코인 중 ${coins}코인 사용`,
    aiPlayerToday: (coins: string) => `오늘 AI ${coins}코인`,
    close: '닫기',
    failed: '잘 되지 않았어요. 다시 시도해 주세요.'
  }
};

export default function AppPlayers({
  buildId,
  lang,
  initialMode
}: {
  buildId: number;
  lang: 'en' | 'ko';
  initialMode: Mode;
}) {
  const loadAppPlayers = useAppContext((v) => v.requestHelpers.loadAppPlayers);
  const setAppAccountMode = useAppContext((v) => v.requestHelpers.setAppAccountMode);
  const setAppPlayerDisabled = useAppContext((v) => v.requestHelpers.setAppPlayerDisabled);
  const setMakerAi = useAppContext((v) => v.requestHelpers.setMakerAi);
  const [makerAi, setMakerAiState] = useState<{
    settings: { on: boolean; dailyCoins: number; playerDailyCoins: number };
    today: { coins: number; players: Record<number, { coins: number }> };
  } | null>(null);
  const [aiDraft, setAiDraft] = useState({ on: false, dailyCoins: 20000, playerDailyCoins: 2000 });
  const t = TEXT[lang];
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [players, setPlayers] = useState<PlayerRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    loadAppPlayers({ buildId })
      .then((data: any) => {
        if (cancelled) return;
        setPlayers(Array.isArray(data?.players) ? data.players : []);
        if (data?.accountMode) setMode(data.accountMode);
        if (data?.makerAi?.settings) {
          setMakerAiState(data.makerAi);
          setAiDraft(data.makerAi.settings);
        }
      })
      .catch(() => !cancelled && setError(t.failed));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, buildId]);

  async function chooseMode(next: Mode) {
    if (busy || next === mode) return;
    setBusy(true);
    setError('');
    try {
      const data = await setAppAccountMode({ buildId, mode: next });
      setMode(data?.accountMode || next);
    } catch (e: any) {
      setError(e?.message || t.failed);
    } finally {
      setBusy(false);
    }
  }

  async function saveAi() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const data = await setMakerAi({ buildId, ...aiDraft });
      if (data?.settings) {
        setMakerAiState(data);
        setAiDraft(data.settings);
      }
    } catch (e: any) {
      setError(e?.message || t.failed);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(player: PlayerRow) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const data = await setAppPlayerDisabled({ buildId, playerId: player.id, disabled: !player.disabled });
      setPlayers((rows) =>
        (rows || []).map((row) => (row.id === player.id ? { ...row, disabled: Boolean(data?.disabled) } : row))
      );
    } catch (e: any) {
      setError(e?.message || t.failed);
    } finally {
      setBusy(false);
    }
  }

  const dateText = (seconds: number) =>
    new Date(seconds * 1000).toLocaleDateString(lang === 'ko' ? 'ko-KR' : undefined, {
      month: 'short',
      day: 'numeric'
    });

  return (
    <>
      <button type="button" className={openButtonClass} onClick={() => setOpen(true)}>
        <span>{t.open}</span>
        <small>
          {t.accountsLabel}: {t.modes[mode][0]}
        </small>
      </button>
      {open && (
        <Modal modalKey="AppPlayers" isOpen onClose={() => setOpen(false)} size="md" hasHeader={false} closeOnBackdropClick>
          <div className={panelClass}>
            <h2>{t.title}</h2>
            <fieldset className={modesClass} disabled={busy}>
              <legend>{t.accountsLabel}</legend>
              {(['twinkle', 'app', 'both'] as Mode[]).map((value) => (
                <label key={value} className={mode === value ? 'on' : ''}>
                  <input type="radio" name="app-account-mode" checked={mode === value} onChange={() => void chooseMode(value)} />
                  <span>
                    <b>{t.modes[value][0]}</b>
                    <small>{t.modes[value][1]}</small>
                  </span>
                </label>
              ))}
              <p>{t.switchNote}</p>
            </fieldset>
            {mode !== 'twinkle' && makerAi && (
              <fieldset className={modesClass} disabled={busy}>
                <legend>{t.aiTitle}</legend>
                <p style={{ marginTop: 0 }}>{t.aiBody}</p>
                <label className={aiDraft.on ? 'on' : ''}>
                  <input type="checkbox" checked={aiDraft.on} onChange={(event) => setAiDraft({ ...aiDraft, on: event.target.checked })} />
                  <span>
                    <b>{t.aiOn}</b>
                    <small>{t.aiToday(makerAi.today.coins.toLocaleString(), makerAi.settings.dailyCoins.toLocaleString())}</small>
                  </span>
                </label>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <label style={{ flex: 1, minWidth: '14rem', flexDirection: 'column', gap: '0.4rem' }}>
                    <small>{t.aiDaily}</small>
                    <input type="number" min={1} value={aiDraft.dailyCoins} onChange={(event) => setAiDraft({ ...aiDraft, dailyCoins: Number(event.target.value) })} />
                  </label>
                  <label style={{ flex: 1, minWidth: '14rem', flexDirection: 'column', gap: '0.4rem' }}>
                    <small>{t.aiPlayer}</small>
                    <input type="number" min={1} value={aiDraft.playerDailyCoins} onChange={(event) => setAiDraft({ ...aiDraft, playerDailyCoins: Number(event.target.value) })} />
                  </label>
                </div>
                <button type="button" className={closeClass} style={{ marginTop: '0.6rem' }} onClick={() => void saveAi()}>
                  {t.aiSave}
                </button>
              </fieldset>
            )}
            {error && <p className={errorClass}>{error}</p>}
            {players && players.length === 0 && <p className={mutedClass}>{t.none}</p>}
            {players && players.length > 0 && (
              <ul className={listClass}>
                {players.map((player) => (
                  <li key={player.id}>
                    <div>
                      <b>{player.name}</b>
                      <span className={tagClass}>{player.kind === 'app' ? t.appTag : t.twinkleTag}</span>
                      {player.linkedTo && <span className={tagClass}>{t.linked(player.linkedTo)}</span>}
                      {player.guardianApproved && <span className={tagClass}>{t.parent}</span>}
                      {player.disabled && <span className={tagClass}>{t.disabledTag}</span>}
                      {makerAi?.today.players[player.id]?.coins ? (
                        <span className={tagClass}>
                          {t.aiPlayerToday(makerAi.today.players[player.id].coins.toLocaleString())}
                        </span>
                      ) : null}
                      <small>{t.lastSeen(dateText(player.lastSeenAt || player.createdAt))}</small>
                    </div>
                    {player.kind === 'app' && (
                      <button type="button" disabled={busy} onClick={() => void toggle(player)}>
                        {player.disabled ? t.turnOn : t.turnOff}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <button type="button" className={closeClass} onClick={() => setOpen(false)}>
              {t.close}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

const openButtonClass = css`
  display: flex;
  align-items: baseline;
  gap: 0.8rem;
  width: 100%;
  margin-top: 0.8rem;
  padding: 1rem 1.1rem;
  border: 1px solid var(--ui-border);
  border-radius: 1.1rem;
  background: none;
  font: inherit;
  font-size: 1.5rem;
  font-weight: 700;
  color: inherit;
  text-align: left;
  cursor: pointer;
  small {
    font-weight: 400;
    font-size: 1.3rem;
    color: #5d5d6e;
  }
`;
const panelClass = css`
  font-size: 1.5rem;
  h2 {
    margin: 0 0 1.2rem;
    font-size: 2.2rem;
  }
`;
const modesClass = css`
  border: 0;
  margin: 0 0 1.4rem;
  padding: 0;
  legend {
    font-weight: 700;
    margin-bottom: 0.6rem;
  }
  label {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    padding: 1rem;
    margin-bottom: 0.6rem;
    border: 1px solid var(--ui-border);
    border-radius: 1rem;
    cursor: pointer;
  }
  label.on {
    border-color: #16161f;
  }
  label span {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  small {
    color: #5d5d6e;
    font-size: 1.3rem;
  }
  p {
    margin: 0.4rem 0 0;
    color: #5d5d6e;
    font-size: 1.3rem;
  }
`;
const listClass = css`
  list-style: none;
  margin: 0;
  padding: 0;
  li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 0.9rem 0;
    border-top: 1px solid var(--ui-border);
  }
  li > div {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }
  small {
    width: 100%;
    color: #5d5d6e;
    font-size: 1.2rem;
  }
  button {
    flex: none;
    border: 0;
    border-radius: 999px;
    padding: 0.6rem 1.2rem;
    background: #f0f0f6;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }
`;
const tagClass = css`
  padding: 0.1rem 0.6rem;
  border-radius: 999px;
  background: #f0f0f6;
  font-size: 1.2rem;
`;
const mutedClass = css`
  color: #5d5d6e;
`;
const errorClass = css`
  color: #b42318;
`;
const closeClass = css`
  width: 100%;
  margin-top: 1.4rem;
  border: 0;
  border-radius: 999px;
  padding: 1.2rem;
  background: #16161f;
  color: #fff;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
`;

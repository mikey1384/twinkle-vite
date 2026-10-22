import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import { useSearchParams } from 'react-router-dom';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import { useAppContext } from '~/contexts';
import { Color } from '~/constants/css';
import { QuestNote } from '../StepCard';
import LiveCode from './LiveCode';

const TEXT = {
  ko: {
    title: (child: string) => `${child}의 Bridge Builder 모임`,
    intro:
      '보호자님이 아이들과 직접 함께 계실 때 아래 버튼을 눌러 주세요. 아이들이 각자 자기 Twinkle 계정으로 로그인한 휴대폰으로 QR 코드를 찍으면 됩니다. 체크인 후 Twinkle에서 모임을 검토합니다.',
    start: '함께 있어요',
    tip: '아이들이 보호자님 휴대폰의 핫스팟(또는 같은 와이파이)에 연결하면 함께 있다는 것을 확인하는 데 도움이 됩니다.',
    show: '아이들에게 이 코드를 보여 주세요',
    count: (n: number) => `${n}명 체크인`,
    expired: '링크가 만료되었습니다. 자녀분께 새 링크를 보내 달라고 해 주세요.',
    note: '3시간 동안 열려 있습니다.'
  },
  en: {
    title: (child: string) => `${child}'s Bridge Builder meetup`,
    intro:
      'When you are there with the kids in person, press the button below. Each child scans the QR code using their own Twinkle account on their phone. Twinkle then reviews the meetup.',
    start: "We're together",
    tip: 'Joining your phone’s hotspot or Wi-Fi before scanning helps confirm that everyone is together.',
    show: 'Show the kids this code',
    count: (n: number) => `${n} checked in`,
    expired: 'This link has expired. Ask your child to send a new one.',
    note: 'It stays open for 3 hours.'
  }
};

// The parent's page (/bridge-builder/grown-up?token=), from the email a child
// sent through Bridge Builder's "Invite my parent". No account: the emailed
// link is the key. Opening it changes nothing; "We're together" starts the
// meetup and shows the code the kids scan.
export default function ParentWitnessPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const lang: 'ko' | 'en' = params.get('lang') === 'en' ? 'en' : 'ko';
  const t = TEXT[lang];
  const loadParentWitnessPage = useAppContext(
    (v) => v.requestHelpers.loadParentWitnessPage
  );
  const openParentWitness = useAppContext(
    (v) => v.requestHelpers.openParentWitness
  );
  const [invite, setInvite] = useState<
    { childUsername: string; started: boolean } | null | undefined
  >(undefined);
  const [started, setStarted] = useState(false);
  const [kidsIn, setKidsIn] = useState(0);

  useEffect(() => {
    loadParentWitnessPage(token)
      .then((data: any) => setInvite(data?.invite || null))
      .catch(() => setInvite(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <ErrorBoundary componentPath="BridgeBuilderQuest/Checkin/ParentWitnessPage">
      <main
        className={css`
          max-width: 46rem;
          margin: 3rem auto;
          padding: 0 1.6rem 6rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.4rem;
          text-align: center;
        `}
      >
        {invite === undefined ? (
          <Loading />
        ) : !invite ? (
          <QuestNote tone="warning">{t.expired}</QuestNote>
        ) : (
          <>
            <h1
              className={css`
                margin: 0;
                font-size: 2.2rem;
                color: ${Color.black()};
              `}
            >
              {t.title(invite.childUsername)}
            </h1>
            {started ? (
              <>
                <p className={leadClass}>{t.show}</p>
                <LiveCode
                  size={240}
                  load={() => openParentWitness(token)}
                  chirp={false}
                  onLoaded={(data) => setKidsIn(Number(data?.kidsIn) || 0)}
                />
                <div
                  className={css`
                    font-size: 1.7rem;
                    font-weight: bold;
                    color: ${Color.black()};
                  `}
                >
                  {t.count(kidsIn)}
                </div>
                <p className={tipClass}>{t.tip}</p>
              </>
            ) : (
              <>
                <p className={leadClass}>{t.intro}</p>
                <Button
                  color="logoBlue"
                  size="lg"
                  onClick={() => setStarted(true)}
                >
                  {t.start}
                </Button>
              </>
            )}
            <p
              className={css`
                margin: 0;
                font-size: 1.3rem;
                color: ${Color.darkGray()};
              `}
            >
              {t.note}
            </p>
          </>
        )}
      </main>
    </ErrorBoundary>
  );
}

const leadClass = css`
  margin: 0;
  font-size: 1.5rem;
  line-height: 1.6;
  color: ${Color.darkerGray()};
`;

const tipClass = css`
  margin: 0;
  font-size: 1.35rem;
  line-height: 1.5;
  color: ${Color.darkGray()};
`;

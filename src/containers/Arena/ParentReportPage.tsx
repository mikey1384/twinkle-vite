import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import { useSearchParams } from 'react-router-dom';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import { useAppContext } from '~/contexts';
import { Color } from '~/constants/css';

interface ParentReport {
  childUsername: string;
  rows: [string, string][];
  disclaimer: string;
  confirmed: boolean;
}

// The parent's page (/exam-report?token=), from the mock-exam result email a
// member sent after a timed win (api helpers/arena/parentReport.ts). No
// account: the emailed link is the key. Korean only, in exam terms (Mikey
// 10-24: what parents receive uses serious Korean exam terms, never game
// terms). Opening it changes nothing; the button confirms the address.
export default function ParentReportPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const loadArenaParentReport = useAppContext(
    (v) => v.requestHelpers.loadArenaParentReport
  );
  const confirmArenaParentReport = useAppContext(
    (v) => v.requestHelpers.confirmArenaParentReport
  );
  const [report, setReport] = useState<ParentReport | null | undefined>(
    undefined
  );
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadArenaParentReport(token)
      .then((data: any) => setReport(data?.report || null))
      .catch(() => setReport(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <ErrorBoundary componentPath="Arena/ParentReportPage">
      <main lang="ko" className={mainCls}>
        {report === undefined ? (
          <Loading />
        ) : !report ? (
          <p className={leadCls}>
            링크가 만료되었거나 더 이상 유효하지 않습니다. 학생에게 결과를 다시
            보내 달라고 해 주세요.
          </p>
        ) : (
          <>
            <h1 className={titleCls}>
              {report.childUsername} 학생의 모의고사 응시 결과
            </h1>
            <table className={tableCls}>
              <tbody>
                {report.rows.map(([label, value]) => (
                  <tr key={label}>
                    <th>{label}</th>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className={noteCls}>{report.disclaimer}</p>
            {report.confirmed ? (
              <p className={leadCls}>
                보호자 이메일이 확인되었습니다. 앞으로 {report.childUsername}{' '}
                학생이 보내는 모의고사 결과를 이 주소로 받아 보실 수 있습니다.
              </p>
            ) : (
              <>
                <p className={leadCls}>
                  {report.childUsername} 학생의 보호자이시면 아래 버튼을 눌러
                  이메일 주소를 확인해 주세요. 보호자가 아니시라면 이 페이지를
                  닫으셔도 됩니다. 아무 일도 일어나지 않습니다.
                </p>
                <Button
                  color="logoBlue"
                  size="lg"
                  loading={confirming}
                  onClick={handleConfirm}
                >
                  보호자 이메일 확인하기
                </Button>
              </>
            )}
            {error && <p className={noteCls}>{error}</p>}
          </>
        )}
      </main>
    </ErrorBoundary>
  );

  async function handleConfirm() {
    setConfirming(true);
    setError('');
    try {
      await confirmArenaParentReport(token);
      // the canonical state from the server
      const data = await loadArenaParentReport(token);
      setReport(data?.report || null);
    } catch {
      setError('확인하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setConfirming(false);
    }
  }
}

const mainCls = css`
  max-width: 56rem;
  margin: 3rem auto;
  padding: 0 1.6rem 6rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.4rem;
`;

const titleCls = css`
  margin: 0;
  font-size: 2.2rem;
  text-align: center;
  color: ${Color.black()};
`;

const tableCls = css`
  width: 100%;
  border-collapse: collapse;
  font-size: 1.5rem;
  background: #fff;
  th,
  td {
    padding: 0.8rem 1.2rem;
    border: 1px solid ${Color.borderGray()};
    text-align: left;
    vertical-align: top;
    color: ${Color.black()};
  }
  th {
    width: 38%;
    background: ${Color.wellGray()};
    font-weight: bold;
  }
`;

const leadCls = css`
  margin: 0;
  font-size: 1.5rem;
  line-height: 1.6;
  text-align: center;
  color: ${Color.darkerGray()};
`;

const noteCls = css`
  margin: 0;
  font-size: 1.3rem;
  line-height: 1.6;
  color: ${Color.darkGray()};
`;

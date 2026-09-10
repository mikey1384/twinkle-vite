import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import InvalidPage from '~/components/InvalidPage';
import Loading from '~/components/Loading';
import { Color, mediumBorderRadius, mobileMaxWidth } from '~/constants/css';
import { ADMIN_USER_ID } from '~/constants/defaultValues';
import { useAppContext, useKeyContext } from '~/contexts';
import { useLocation } from 'react-router-dom';

interface AiCostsSubscription {
  id: number;
  userId: number;
  status: string;
  active: boolean;
  currentPeriodStart: number | null;
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string;
  stripeRecurringPriceId: string;
  latestInvoiceId: string | null;
  latestPaymentIntentId: string | null;
  latestInvoiceStatus: string | null;
  lastPaidAt: number | null;
  latestPaymentFailedAt: number | null;
  updatedAt: number | null;
}

interface StripeInvoice {
  id: string;
  number: string;
  status: string;
  billingReason: string;
  currency: string;
  amountDue: number;
  amountPaid: number;
  amountRemaining: number;
  createdAt: number | null;
  dueDate: number | null;
  periodStart: number | null;
  periodEnd: number | null;
  hostedInvoiceUrl: string;
  invoicePdf: string;
  paid: boolean;
}

interface InfraCostsPayment {
  id: number;
  userId: number;
  stripeCheckoutSessionId: string;
  stripePaymentIntentId: string | null;
  stripeInvoiceId: string | null;
  invoiceNumber: string;
  amountTotal: number;
  currency: string;
  sessionStatus: string;
  paymentStatus: string;
  paid: boolean;
  processing: boolean;
  hostedInvoiceUrl: string;
  invoicePdf: string;
  receiptUrl: string;
  paidAt: number | null;
  failedAt: number | null;
  createdAt: number | null;
}

interface InfraCharge {
  priceId: string;
  amountCents: number;
  currency: string;
  configError: string;
}

interface PaymentOverview {
  subscriptions: AiCostsSubscription[];
  subscription: AiCostsSubscription | null;
  invoices: StripeInvoice[];
  infraPayments?: InfraCostsPayment[];
  infraCharge?: InfraCharge;
}

interface CheckoutSessionResult {
  sessionId?: string;
  url?: string;
}

// Fallback label only; the real amount comes from the server's resolved charge.
const INFRA_ONE_TIME_FALLBACK_CENTS = 50000;

interface PaymentToggleResult {
  checkoutRequired?: boolean;
  sessionId?: string;
  url?: string;
  payment?: PaymentOverview;
}

const pageClass = css`
  width: 100%;
  padding: 1rem;
  padding-bottom: 10rem;
  color: ${Color.black()};

  @media (max-width: ${mobileMaxWidth}) {
    padding: 0;
    padding-bottom: 8rem;
  }
`;

const headerClass = css`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 1.6rem;
  padding: 1.6rem;
  border: 1px solid ${Color.borderGray()};
  border-radius: ${mediumBorderRadius};
  background: ${Color.white()};

  h1 {
    margin: 0;
    font-size: 2.8rem;
  }

  p {
    margin: 0.6rem 0 0;
    color: ${Color.darkGray()};
    font-size: 1.45rem;
    line-height: 1.45;
  }

  @media (max-width: ${mobileMaxWidth}) {
    flex-direction: column;
    border-radius: 0;
    border-left: 0;
    border-right: 0;
  }
`;

const actionsClass = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.8rem;

  @media (max-width: ${mobileMaxWidth}) {
    width: 100%;
    justify-content: flex-start;
  }
`;

const summaryClass = css`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1.6rem;

  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
    padding: 0 1rem;
  }
`;

const metricClass = css`
  border: 1px solid ${Color.borderGray()};
  border-radius: ${mediumBorderRadius};
  padding: 1.4rem;
  background: ${Color.white()};
  min-width: 0;

  span,
  small {
    display: block;
    color: ${Color.darkGray()};
    font-size: 1.25rem;
    font-weight: 700;
  }

  strong {
    display: block;
    margin: 0.45rem 0;
    font-size: 2.2rem;
    line-height: 1.1;
    overflow-wrap: anywhere;
  }
`;

const switchPanelClass = css`
  border: 1px solid ${Color.borderGray()};
  border-radius: ${mediumBorderRadius};
  padding: 1.4rem;
  margin-bottom: 1.6rem;
  background: ${Color.white()};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.6rem;

  h2 {
    margin: 0;
    font-size: 1.8rem;
  }

  p {
    margin: 0.45rem 0 0;
    color: ${Color.darkGray()};
    font-size: 1.3rem;
    line-height: 1.4;
  }

  @media (max-width: ${mobileMaxWidth}) {
    align-items: flex-start;
    flex-direction: column;
    border-radius: 0;
    border-left: 0;
    border-right: 0;
  }
`;

const toggleClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.9rem;
  color: ${Color.darkGray()};
  font-size: 1.35rem;
  font-weight: 800;
  cursor: pointer;
  user-select: none;

  input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .track {
    width: 5.2rem;
    height: 3rem;
    border-radius: 999px;
    padding: 0.35rem;
    background: ${Color.inputGray()};
    border: 1px solid ${Color.borderGray()};
    transition:
      background 0.18s ease,
      border-color 0.18s ease;
  }

  .thumb {
    display: block;
    width: 2.2rem;
    height: 2.2rem;
    border-radius: 50%;
    background: ${Color.white()};
    box-shadow: 0 2px 5px rgba(15, 23, 42, 0.22);
    transform: translateX(0);
    transition: transform 0.18s ease;
  }

  input:checked + .track {
    background: ${Color.logoBlue(0.88)};
    border-color: ${Color.logoBlue()};
  }

  input:checked + .track .thumb {
    transform: translateX(2.2rem);
  }

  input:disabled + .track {
    opacity: 0.55;
  }
`;

const panelClass = css`
  border: 1px solid ${Color.borderGray()};
  border-radius: ${mediumBorderRadius};
  background: ${Color.white()};
  overflow: hidden;
  margin-bottom: 1.6rem;

  > header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.2rem 1.4rem;
    border-bottom: 1px solid ${Color.borderGray()};
  }

  h2 {
    margin: 0;
    font-size: 1.8rem;
  }

  > div {
    padding: 1.2rem;
  }

  @media (max-width: ${mobileMaxWidth}) {
    border-radius: 0;
    border-left: 0;
    border-right: 0;
  }
`;

const tableWrapClass = css`
  overflow-x: auto;

  table {
    width: 100%;
    min-width: 78rem;
    border-collapse: collapse;
  }

  th,
  td {
    padding: 1rem;
    border-bottom: 1px solid ${Color.borderGray()};
    text-align: left;
    font-size: 1.25rem;
    vertical-align: middle;
  }

  th {
    color: ${Color.darkGray()};
    font-weight: 800;
    background: ${Color.highlightGray()};
  }

  td a {
    color: ${Color.logoBlue()};
    font-weight: 700;
    text-decoration: none;
  }
`;

const emptyClass = css`
  padding: 2rem;
  color: ${Color.darkGray()};
  font-size: 1.35rem;
  text-align: center;
`;

const errorClass = css`
  margin-bottom: 1.6rem;
  padding: 1.2rem 1.4rem;
  border: 1px solid ${Color.redOrange(0.3)};
  border-radius: ${mediumBorderRadius};
  background: ${Color.redOrange(0.08)};
  color: ${Color.black()};
  font-size: 1.35rem;
`;

export default function Payment() {
  const location = useLocation();
  const userId = useKeyContext((v) => v.myState.userId);
  const loadTwinkleAiCostsPaymentOverview = useAppContext(
    (v) => v.requestHelpers.loadTwinkleAiCostsPaymentOverview
  );
  const setTwinkleAiCostsPaymentActive = useAppContext(
    (v) => v.requestHelpers.setTwinkleAiCostsPaymentActive
  );
  const createTwinkleAiCostsPortalSession = useAppContext(
    (v) => v.requestHelpers.createTwinkleAiCostsPortalSession
  );
  const createTwinkleInfraCostsCheckoutSession = useAppContext(
    (v) => v.requestHelpers.createTwinkleInfraCostsCheckoutSession
  );
  const canView = userId === ADMIN_USER_ID;
  const [payment, setPayment] = useState<PaymentOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [infraCheckoutLoading, setInfraCheckoutLoading] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const checkoutSessionId = getCheckoutSessionId(location.search);

  useEffect(() => {
    if (!canView) return;
    let canceled = false;
    void loadPayment();

    async function loadPayment() {
      setLoading(true);
      setError('');
      try {
        const data = await loadTwinkleAiCostsPaymentOverview({
          checkoutSessionId
        });
        if (canceled) return;
        setPayment(data);
      } catch (loadError: any) {
        if (canceled) return;
        setError(loadError?.message || 'Failed to load payment data');
      } finally {
        if (!canceled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, checkoutSessionId, reloadKey]);

  if (!canView) {
    return (
      <InvalidPage
        title="Top admin only"
        text="Payment management is only available to the top admin."
      />
    );
  }

  const subscription = payment?.subscription || null;
  const invoices = payment?.invoices || [];
  const infraPayments = payment?.infraPayments || [];
  const paidInfraPayments = infraPayments.filter((item) => item.paid);
  const lastInfraPayment = paidInfraPayments[0] || null;
  const latestInfraAttempt = infraPayments[0] || null;
  const infraCharge = payment?.infraCharge;
  const infraAmountLabel = formatCurrencyCents(
    infraCharge?.amountCents || INFRA_ONE_TIME_FALLBACK_CENTS,
    infraCharge?.currency || 'USD',
    { wholeUnits: true }
  );
  const hasStripeCustomer = Boolean(subscription?.stripeCustomerId);
  const paymentActive = Boolean(
    subscription?.active && !subscription.cancelAtPeriodEnd
  );
  const latestPaidInvoice = invoices.find(
    (invoice) => invoice.paid || invoice.status === 'paid'
  );
  const lastPaidAt = subscription?.lastPaidAt || latestPaidInvoice?.createdAt;
  const latestInvoiceStatus =
    subscription?.latestInvoiceStatus || latestPaidInvoice?.status;

  return (
    <div className={pageClass}>
      <header className={headerClass}>
        <div>
          <h1>Payment</h1>
          <p>
            Twinkle AI Costs subscription, one-time API &amp; Infrastructure
            payments, invoices, and Stripe access.
          </p>
        </div>
        <div className={actionsClass}>
          <Button
            color="darkerGray"
            variant="outline"
            loading={refreshing}
            onClick={handleRefresh}
          >
            <Icon icon="sync" />
            Refresh
          </Button>
          <Button
            color="logoBlue"
            variant="soft"
            loading={portalLoading}
            disabled={!hasStripeCustomer}
            onClick={handleOpenPortal}
          >
            <Icon icon="portal-enter" />
            Stripe Portal
          </Button>
        </div>
      </header>

      {error ? <div className={errorClass}>{error}</div> : null}
      {loading ? <Loading /> : null}

      {!loading && (payment || !error) ? (
        <>
          <section className={switchPanelClass}>
            <div>
              <h2>AI Service Subscription</h2>
              <p>{getSubscriptionSummary(subscription)}</p>
            </div>
            <label className={toggleClass}>
              <input
                type="checkbox"
                checked={paymentActive}
                disabled={toggleLoading}
                onChange={(event) => handleTogglePayment(event.target.checked)}
              />
              <span className="track" aria-hidden="true">
                <span className="thumb" />
              </span>
              <span>{paymentActive ? 'Active' : 'Inactive'}</span>
            </label>
          </section>

          <section className={summaryClass}>
            <Metric
              label="Subscription"
              value={formatStatus(subscription?.status)}
              detail={
                subscription?.cancelAtPeriodEnd
                  ? 'Cancels at period end'
                  : subscription?.active
                    ? 'Active'
                    : 'Not active'
              }
            />
            <Metric
              label="Current Period"
              value={formatDate(subscription?.currentPeriodEnd)}
              detail="Period end"
            />
            <Metric
              label="Last Paid"
              value={formatDate(lastPaidAt)}
              detail={formatInvoiceStatus(latestInvoiceStatus)}
            />
          </section>

          <section className={panelClass}>
            <header>
              <h2>Invoice History</h2>
            </header>
            <div>
              {invoices.length === 0 ? (
                <div className={emptyClass}>No invoices yet.</div>
              ) : (
                <div className={tableWrapClass}>
                  <table>
                    <thead>
                      <tr>
                        <th>Invoice</th>
                        <th>Status</th>
                        <th>Amount</th>
                        <th>Created</th>
                        <th>Billing period</th>
                        <th>Files</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice) => (
                        <tr key={invoice.id}>
                          <td>{invoice.number || invoice.id}</td>
                          <td>{formatInvoiceStatus(invoice.status)}</td>
                          <td>
                            {formatCurrencyCents(
                              invoice.amountPaid || invoice.amountDue,
                              invoice.currency
                            )}
                          </td>
                          <td>{formatDate(invoice.createdAt)}</td>
                          <td>
                            {formatDate(invoice.periodStart)} -{' '}
                            {formatDate(invoice.periodEnd)}
                          </td>
                          <td>
                            {invoice.hostedInvoiceUrl ? (
                              <a
                                href={invoice.hostedInvoiceUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <Icon icon="external-link-alt" /> Open
                              </a>
                            ) : null}
                            {invoice.invoicePdf ? (
                              <>
                                {' '}
                                <a
                                  href={invoice.invoicePdf}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <Icon icon="file-pdf" /> PDF
                                </a>
                              </>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section className={switchPanelClass}>
            <div style={{ minWidth: 0 }}>
              <h2>API &amp; Infrastructure</h2>
              <p>
                {getInfraPaymentSummary({
                  amountLabel: infraAmountLabel,
                  lastPaid: lastInfraPayment,
                  latestAttempt: latestInfraAttempt
                })}
              </p>
              {infraCharge?.configError ? (
                <p style={{ color: Color.redOrange() }}>
                  Stripe price problem: {infraCharge.configError}
                </p>
              ) : null}
            </div>
            <Button
              color="logoBlue"
              loading={infraCheckoutLoading}
              disabled={Boolean(infraCharge?.configError)}
              style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
              onClick={handleInfraCheckout}
            >
              <Icon icon="credit-card" />
              Pay {infraAmountLabel} now
            </Button>
          </section>

          <section className={panelClass}>
            <header>
              <h2>One-time Payment History</h2>
            </header>
            <div>
              {infraPayments.length === 0 ? (
                <div className={emptyClass}>No one-time payments yet.</div>
              ) : (
                <div className={tableWrapClass}>
                  <table>
                    <thead>
                      <tr>
                        <th>Invoice</th>
                        <th>Status</th>
                        <th>Amount</th>
                        <th>Paid</th>
                        <th>Started</th>
                        <th>Files</th>
                      </tr>
                    </thead>
                    <tbody>
                      {infraPayments.map((item) => (
                        <tr key={item.id}>
                          <td>
                            {item.invoiceNumber ||
                              item.stripeInvoiceId ||
                              item.stripeCheckoutSessionId}
                          </td>
                          <td>{formatInfraPaymentStatus(item)}</td>
                          <td>
                            {formatCurrencyCents(item.amountTotal, item.currency)}
                          </td>
                          <td>{formatDate(item.paidAt)}</td>
                          <td>{formatDate(item.createdAt)}</td>
                          <td>
                            {item.hostedInvoiceUrl ? (
                              <a
                                href={item.hostedInvoiceUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <Icon icon="external-link-alt" /> Open
                              </a>
                            ) : item.receiptUrl ? (
                              <a
                                href={item.receiptUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <Icon icon="external-link-alt" /> Receipt
                              </a>
                            ) : null}
                            {item.invoicePdf ? (
                              <>
                                {' '}
                                <a
                                  href={item.invoicePdf}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <Icon icon="file-pdf" /> PDF
                                </a>
                              </>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );

  function handleRefresh() {
    setRefreshing(true);
    setReloadKey((key) => key + 1);
  }

  async function handleTogglePayment(active: boolean) {
    setToggleLoading(true);
    setError('');
    try {
      const result = (await setTwinkleAiCostsPaymentActive(
        active
      )) as PaymentToggleResult;
      if (result?.payment) {
        setPayment(result.payment);
      }
      if (result?.url) {
        window.location.assign(result.url);
        return;
      }
      if (active && result?.checkoutRequired) {
        setError('Checkout session did not include a Stripe URL');
      }
    } catch (toggleError: any) {
      setError(toggleError?.message || 'Failed to update payment status');
    } finally {
      setToggleLoading(false);
    }
  }

  async function handleInfraCheckout() {
    setInfraCheckoutLoading(true);
    setError('');
    try {
      const session = (await createTwinkleInfraCostsCheckoutSession()) as
        | CheckoutSessionResult
        | undefined;
      if (session?.url) {
        window.location.assign(session.url);
        return;
      }
      setError('Checkout session did not include a Stripe URL');
    } catch (checkoutError: any) {
      setError(
        checkoutError?.message ||
          'Failed to start API & Infrastructure payment'
      );
    } finally {
      setInfraCheckoutLoading(false);
    }
  }

  async function handleOpenPortal() {
    setPortalLoading(true);
    setError('');
    try {
      const session = await createTwinkleAiCostsPortalSession();
      if (session?.url) {
        window.location.assign(session.url);
        return;
      }
      setError('Billing portal session did not include a Stripe URL');
    } catch (portalError: any) {
      setError(portalError?.message || 'Failed to open Stripe portal');
    } finally {
      setPortalLoading(false);
    }
  }
}

function Metric({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className={metricClass}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function formatStatus(value: unknown) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) return 'No subscription';
  return formatInvoiceStatus(text);
}

function getSubscriptionSummary(subscription: AiCostsSubscription | null) {
  if (subscription?.cancelAtPeriodEnd) {
    return 'The $500/month AI service subscription is active until the current billing period ends.';
  }
  if (subscription?.active) {
    return 'The $500/month AI service subscription is active and renews through Stripe.';
  }
  if (subscription?.stripeSubscriptionId) {
    return 'The AI service subscription is connected but is not currently active.';
  }
  return 'No active AI service subscription is connected.';
}

function getInfraPaymentSummary({
  amountLabel,
  lastPaid,
  latestAttempt
}: {
  amountLabel: string;
  lastPaid: InfraCostsPayment | null;
  latestAttempt: InfraCostsPayment | null;
}) {
  const base = `One-time ${amountLabel} payment toward API and infrastructure costs.`;
  if (latestAttempt && !latestAttempt.paid && latestAttempt.processing) {
    return `${base} A payment started on ${formatDate(
      latestAttempt.createdAt
    )} is still processing.`;
  }
  if (latestAttempt && !latestAttempt.paid && latestAttempt.failedAt) {
    return `${base} The latest attempt on ${formatDate(
      latestAttempt.failedAt
    )} failed${lastPaid?.paidAt ? `; last successful payment ${formatDate(lastPaid.paidAt)}` : ''}.`;
  }
  if (lastPaid?.paidAt) {
    return `${base} Last paid on ${formatDate(lastPaid.paidAt)}.`;
  }
  return `${base} Charged through Stripe Checkout.`;
}

function formatInfraPaymentStatus(item: InfraCostsPayment) {
  if (item.paid) return 'Paid';
  if (item.processing) return 'Processing';
  if (item.sessionStatus === 'expired') return 'Expired';
  if (item.failedAt) return 'Failed';
  if (item.sessionStatus === 'open') return 'Awaiting payment';
  return formatInvoiceStatus(item.paymentStatus || item.sessionStatus);
}

function formatInvoiceStatus(value: unknown) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) return 'None';
  return text
    .split(/[_-]+/)
    .filter(Boolean)
    .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
    .join(' ');
}

function formatDate(value: unknown) {
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return 'None';
  return new Date(timestamp * 1000).toLocaleDateString();
}

function formatCurrencyCents(
  amount: unknown,
  currency: string,
  options: { wholeUnits?: boolean } = {}
) {
  const numericAmount = Number(amount);
  const normalizedAmount = Number.isFinite(numericAmount) ? numericAmount : 0;
  const normalizedCurrency = (currency || 'USD').toUpperCase();
  const wholeUnits = options.wholeUnits && normalizedAmount % 100 === 0;
  return Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: normalizedCurrency,
    ...(wholeUnits ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {})
  }).format(normalizedAmount / 100);
}

function getCheckoutSessionId(search: string) {
  const params = new URLSearchParams(search);
  const checkoutSessionId =
    params.get('stripeCheckoutSessionId') || params.get('session_id') || '';
  return checkoutSessionId.trim();
}

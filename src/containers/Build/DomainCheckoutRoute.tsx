import React from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import DomainCheckoutPage from '~/components/Build/AppAddress/DomainCheckoutPage';
import { useKeyContext } from '~/contexts';

// What the page was opened for (Stripe's return, a wand plan). A new one on
// the same app starts the page over, like a fresh visit.
function intentKey(search: string) {
  const params = new URLSearchParams(search);
  return ['domainOrder', 'cancelled', 'appAddress', 'domain'].map((key) => params.get(key) || '').join('|');
}

// /build/<id>/domain: the own-web-address checkout page.
export default function DomainCheckoutRoute() {
  const { buildId } = useParams();
  const { search } = useLocation();
  const userId = useKeyContext((v) => v.myState.userId);
  const id = Number(buildId || 0);
  if (!Number.isSafeInteger(id) || id <= 0) return <Navigate to="/build" replace />;
  // Another account (signed in here or in another tab) gets its own page:
  // its own ownership check and prefill, nothing of the last member's.
  return <DomainCheckoutPage key={`${id}:${userId || 0}:${intentKey(search)}`} buildId={id} />;
}

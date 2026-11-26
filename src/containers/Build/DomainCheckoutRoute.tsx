import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import DomainCheckoutPage from '~/components/Build/AppAddress/DomainCheckoutPage';

// /build/<id>/domain: the own-web-address checkout page.
export default function DomainCheckoutRoute() {
  const { buildId } = useParams();
  const id = Number(buildId || 0);
  if (!Number.isSafeInteger(id) || id <= 0) return <Navigate to="/build" replace />;
  return <DomainCheckoutPage key={id} buildId={id} />;
}

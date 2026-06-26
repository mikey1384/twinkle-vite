interface OfferUser {
  id: number;
  username: string;
  offerId?: number;
}
interface OfferGroup {
  price: number;
  users: OfferUser[];
}

// Hidden offers are a personal, owner-scoped view filter. The server returns
// every active offer plus the viewer's own `hiddenOfferIds`; the client removes
// the hidden ones so the owner doesn't see them. A group with all of its offers
// hidden drops out entirely.
export function getVisibleOfferGroups(
  offers: OfferGroup[],
  hiddenOfferIds: number[]
): OfferGroup[] {
  if (!hiddenOfferIds?.length) return offers;
  const hidden = new Set(hiddenOfferIds);
  const result: OfferGroup[] = [];
  for (const group of offers) {
    const users = group.users.filter(
      (user) => !(user.offerId && hidden.has(user.offerId))
    );
    if (users.length) {
      result.push({ ...group, users });
    }
  }
  return result;
}

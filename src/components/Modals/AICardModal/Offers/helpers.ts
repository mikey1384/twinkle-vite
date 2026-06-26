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

// Flattened list of the offers the owner has hidden, so they can review and
// unhide them — even when a whole price group was hidden and is no longer in the
// visible list.
export function getHiddenOfferEntries(
  offers: OfferGroup[],
  hiddenOfferIds: number[]
): { price: number; user: OfferUser; offerId: number }[] {
  if (!hiddenOfferIds?.length) return [];
  const hidden = new Set(hiddenOfferIds);
  const result: { price: number; user: OfferUser; offerId: number }[] = [];
  for (const group of offers) {
    for (const user of group.users) {
      if (user.offerId && hidden.has(user.offerId)) {
        result.push({ price: group.price, user, offerId: user.offerId });
      }
    }
  }
  return result;
}

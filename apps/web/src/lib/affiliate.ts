import { api, type RestaurantDetail } from "./api";

export type AffiliatePartner = "delivery" | "reservation";

export function buildAffiliateUrl(
  restaurant: Pick<RestaurantDetail, "name" | "city">,
  partner: AffiliatePartner,
): string {
  const query = encodeURIComponent(`${restaurant.name} ${restaurant.city}`);

  if (partner === "delivery") {
    return `https://www.ubereats.com/search?query=${query}`;
  }

  return `https://www.opentable.com/s/?term=${query}`;
}

export function trackAffiliateClick(input: {
  restaurantId: string;
  partner: AffiliatePartner;
  destination: string;
  context?: string;
}) {
  return api.affiliate.trackClick(input);
}

import type { Metadata } from "next";
import RestaurantsPage from "./RestaurantExplorer";

export const metadata: Metadata = {
  title: "Discover Restaurants | PalatePass",
  description: "Explore the best dining spots curated by people you trust. Search by cuisine, city, or view our interactive map.",
};

export default function Page() {
  return <RestaurantsPage />;
}

import type { Metadata } from "next";
import { api } from "../../../lib/api";
import RestaurantDetail from "./RestaurantDetail";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const id = (await params).id;

  try {
    const res = await api.restaurants.get(id);
    const restaurant = res.restaurant;
    
    return {
      title: `${restaurant.name} | PalatePass`,
      description: `Reviews and ratings for ${restaurant.name} in ${restaurant.city}. See what the community thinks about this ${restaurant.cuisine} spot.`,
      openGraph: {
        images: ["/og-restaurant.png"], // Placeholder for dynamic OG images if implemented
      },
    };
  } catch {
    return {
      title: "Restaurant | PalatePass",
      description: "Discover trusted restaurant reviews and collections.",
    };
  }
}

export default function Page() {
  return <RestaurantDetail />;
}

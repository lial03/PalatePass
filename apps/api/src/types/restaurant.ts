export interface RestaurantSummary {
  id: string;
  name: string;
  address: string;
  city: string;
  cuisine: string;
  lat: number | null;
  lng: number | null;
  createdBy: string;
  createdAt: Date;
  averageScore: number | null;
  ratingCount: number;
}

export interface RatingSummary {
  id: string;
  score: number;
  notes: string | null;
  tags: string[];
  userId: string;
  displayName: string;
  createdAt: Date;
}

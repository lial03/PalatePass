const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type ApiUser = {
  id: string;
  email: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
};

export type AuthResponse = {
  expiresAt: number;
  user: ApiUser;
};

export type Restaurant = {
  id: string;
  name: string;
  address: string;
  city: string;
  countryCode: string | null;
  countryName: string | null;
  cuisine: string;
  googlePlaceId: string | null;
  submissionNotes: string | null;
  lat: number | null;
  lng: number | null;
  createdBy: string;
  createdAt: string;
  sponsored: boolean;
  averageScore: number | null;
  ratingCount: number;
};

export type RatingSummary = {
  id: string;
  score: number;
  notes: string | null;
  photoUrls: string[];
  budgetTier: "budget" | "mid" | "premium" | "luxury" | null;
  budgetAmount: number | null;
  budgetCurrency: string | null;
  tags: string[];
  images?: string[];
  userId: string;
  restaurantId: string;
  displayName: string;
  createdAt: string;
};

export type RestaurantDetail = Restaurant;

export type RestaurantAnalytics = {
  ratingCount: number;
  averageScore: number | null;
  topTags: Array<{ name: string; count: number }>;
  recentActivity: {
    last7Days: number;
    last30Days: number;
  };
};

export type Recommendation = {
  restaurantId: string;
  name: string;
  address: string;
  city: string;
  cuisine: string;
  lat: number | null;
  lng: number | null;
  endorsementCount: number;
  networkAverageScore: number;
  recommendationScore: number;
  endorsedBy: string[];
  sampleNotes: string[];
};

export type AffiliatePartner = "delivery" | "reservation";

export type UserProfile = {
  id: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  stats: {
    followersCount: number;
    followingCount: number;
    ratingsCount: number;
    averageRating: number | null;
    favoriteCuisines: string[];
  };
};

async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...rest } = options;
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  auth: {
    register: (body: { email: string; password: string; displayName: string }) =>
      apiFetch<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    login: (body: { email: string; password: string }) =>
      apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    me: () => apiFetch<{ user: ApiUser }>("/auth/me"),
    logout: () => apiFetch<{ ok: boolean }>("/auth/logout", { method: "POST" }),
  },
  restaurants: {
    list: (params?: {
      cuisine?: string;
      city?: string;
      query?: string;
      q?: string;
      countryCode?: string;
      page?: number;
      limit?: number;
    }) => {
      const qs = new URLSearchParams();
      if (params?.cuisine) qs.set("cuisine", params.cuisine);
      if (params?.city) qs.set("city", params.city);
      if (params?.query) qs.set("query", params.query);
      if (params?.q) qs.set("q", params.q);
      if (params?.countryCode) qs.set("countryCode", params.countryCode);
      if (params?.page) qs.set("page", String(params.page));
      if (params?.limit) qs.set("limit", String(params.limit));
      const query = qs.toString();
      return apiFetch<{
        data: Restaurant[];
        total: number;
        page: number;
        limit: number;
      }>(`/restaurants${query ? `?${query}` : ""}`);
    },
    create: (body: {
      name: string;
      address: string;
      city: string;
      country?: string;
      countryCode?: string;
      countryName?: string;
      cuisine: string;
      googlePlaceId?: string;
      submissionNotes?: string;
      lat?: number;
      lng?: number;
      placeId?: string;
    }) =>
      apiFetch<{ restaurant: Restaurant }>("/restaurants", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    get: (id: string) =>
      apiFetch<{ restaurant: RestaurantDetail; ratings: RatingSummary[] }>(
        `/restaurants/${id}`,
      ),
    analytics: (id: string) =>
      apiFetch<{ analytics: RestaurantAnalytics }>(`/restaurants/${id}/analytics`),
    rate: (
      id: string,
      body: {
        score: number;
        notes?: string;
        tags?: string[];
        photoUrls?: string[];
        images?: string[];
        budgetTier?: "budget" | "mid" | "premium" | "luxury";
        budgetAmount?: number;
        budgetCurrency?: string;
      },
    ) =>
      apiFetch<{ rating: RatingSummary }>(`/restaurants/${id}/ratings`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    update: (id: string, body: Partial<{
      name: string;
      address: string;
      city: string;
      cuisine: string;
      countryCode: string;
      countryName: string;
      lat: number;
      lng: number;
    }>) =>
      apiFetch<{ restaurant: Restaurant }>(`/restaurants/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    delete: (id: string) =>
      apiFetch<void>(`/restaurants/${id}`, {
        method: "DELETE",
      }),
    unrate: (id: string) =>
      apiFetch<void>(`/restaurants/${id}/ratings`, {
        method: "DELETE",
      }),
  },
  recommendations: {
    feed: (limit = 20) =>
      apiFetch<{
        data: Recommendation[];
        meta: { followingCount: number; candidateRatings: number; limit: number };
      }>(`/recommendations/feed?limit=${limit}`),
  },
  affiliate: {
    trackClick: (body: {
      restaurantId: string;
      partner: AffiliatePartner;
      destination: string;
      context?: string;
    }) =>
      apiFetch<void>("/affiliate/click", {
        method: "POST",
        body: JSON.stringify(body),
        keepalive: true,
      }),
  },
  users: {
    profile: (id: string) => apiFetch<{ profile: UserProfile }>(`/users/${id}`),
    updateMe: (body: { displayName?: string; bio?: string; avatarUrl?: string }) =>
      apiFetch<{ user: ApiUser }>("/users/me", {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    follow: (id: string) =>
      apiFetch<{ message: string }>(`/users/${id}/follow`, { method: "POST" }),
    unfollow: (id: string) =>
      apiFetch<void>(`/users/${id}/follow`, { method: "DELETE" }),
    tasteMatch: (id: string) =>
      apiFetch<{ score: number }>(`/users/${id}/taste-match`),
  },
  lists: {
    mine: () => apiFetch<{ data: List[] }>("/lists"),
    userLists: (userId: string) => apiFetch<{ data: List[] }>(`/lists/user/${userId}`),
    get: (id: string) => apiFetch<{ list: ListDetail }>(`/lists/${id}`),
    create: (body: { name: string; description?: string; isPublic?: boolean }) =>
      apiFetch<{ list: List }>("/lists", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    addItem: (listId: string, body: { restaurantId: string; notes?: string }) =>
      apiFetch<{ item: ListItem }>(`/lists/${listId}/items`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    removeItem: (listId: string, restaurantId: string) =>
      apiFetch<void>(`/lists/${listId}/items/${restaurantId}`, {
        method: "DELETE",
      }),
  },
};

export type List = {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  _count: { items: number };
};

export type ListItem = {
  id: string;
  listId: string;
  restaurantId: string;
  notes: string | null;
  createdAt: string;
  restaurant?: Restaurant;
};

export type ListDetail = List & {
  user: { id: string; displayName: string };
  items: ListItem[];
};

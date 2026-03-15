const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type ApiUser = {
  id: string;
  email: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
};

export type AuthResponse = {
  token: string;
  user: ApiUser;
};

export type Restaurant = {
  id: string;
  name: string;
  address: string;
  city: string;
  cuisine: string;
  lat: number | null;
  lng: number | null;
  createdBy: string;
  createdAt: string;
  averageScore: number | null;
  ratingCount: number;
};

export type RatingSummary = {
  id: string;
  score: number;
  notes: string | null;
  tags: string[];
  userId: string;
  displayName: string;
  createdAt: string;
};

export type RestaurantDetail = Restaurant;

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
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message ?? res.statusText);
  }
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
    me: (token: string) => apiFetch<{ user: ApiUser }>("/auth/me", { token }),
  },
  restaurants: {
    list: (params?: {
      cuisine?: string;
      city?: string;
      page?: number;
      limit?: number;
    }) => {
      const qs = new URLSearchParams();
      if (params?.cuisine) qs.set("cuisine", params.cuisine);
      if (params?.city) qs.set("city", params.city);
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
    get: (id: string) =>
      apiFetch<{ restaurant: RestaurantDetail; ratings: RatingSummary[] }>(
        `/restaurants/${id}`,
      ),
    rate: (
      id: string,
      body: { score: number; notes?: string; tags?: string[] },
      token: string,
    ) =>
      apiFetch<{ rating: RatingSummary }>(`/restaurants/${id}/ratings`, {
        method: "POST",
        body: JSON.stringify(body),
        token,
      }),
  },
  recommendations: {
    feed: (token: string, limit = 20) =>
      apiFetch<{
        data: Recommendation[];
        meta: { followingCount: number; candidateRatings: number; limit: number };
      }>(`/recommendations/feed?limit=${limit}`, { token }),
  },
  users: {
    profile: (id: string) => apiFetch<{ profile: UserProfile }>(`/users/${id}`),
    updateMe: (
      body: { displayName?: string; bio?: string; avatarUrl?: string },
      token: string,
    ) =>
      apiFetch<{ user: ApiUser }>("/users/me", {
        method: "PATCH",
        body: JSON.stringify(body),
        token,
      }),
    follow: (id: string, token: string) =>
      apiFetch<{ message: string }>(`/users/${id}/follow`, {
        method: "POST",
        token,
      }),
    unfollow: (id: string, token: string) =>
      apiFetch<void>(`/users/${id}/follow`, {
        method: "DELETE",
        token,
      }),
  },
};

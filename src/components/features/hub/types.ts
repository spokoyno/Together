export type HubComment = {
  id: string;
  body: string;
  author_name: string;
  created_at: string;
};

export type HubMemory = {
  id: string;
  title: string | null;
  body: string | null;
  happened_on: string | null;
  media_url: string | null;
  created_at: string;
  author_name: string;
  comments: HubComment[];
};

export type HubMovie = {
  id: string;
  tmdb_id: number;
  title: string;
  poster_url: string | null;
  ratings: Record<string, number>;
  added_by: string;
};

export type HubCookingLog = {
  id: string;
  body: string | null;
  media_url: string | null;
  author_name: string;
  created_at: string;
};

export type HubCookingDish = {
  id: string;
  title: string;
  recipe: string | null;
  media_url: string | null;
  status: "planned" | "cooked";
  cooked_at: string | null;
  created_at: string;
  author_name: string;
  logs: HubCookingLog[];
};

export type HubComplimentState = {
  partnerJarCount: number;
  myJarCount: number;
  canDraw: boolean;
  waitMinutes: number;
};

export type MovieSearchResult = {
  id: number;
  title: string;
  releaseDate: string | null;
  posterPath: string | null;
};

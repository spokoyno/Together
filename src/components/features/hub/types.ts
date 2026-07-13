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
  tmdb_id: number | null;
  title: string;
  poster_url: string | null;
  ratings: Record<string, number>;
  reviews: Record<string, string>;
  added_by: string;
  status: "want" | "watched";
};

export type HubMovieCollectionItem = {
  id: string;
  title: string;
  poster_url: string | null;
  movie_entry_id: string | null;
};

export type HubMovieCollection = {
  id: string;
  title: string;
  created_at: string;
  author_name: string;
  items: HubMovieCollectionItem[];
};

export type TierMakerSearchResult = {
  title: string;
  url: string;
};

export type HubShoppingNote = {
  id: string;
  body: string;
  status: "open" | "closed";
  author_name: string;
  closed_by_name: string | null;
  closed_at: string | null;
  created_at: string;
};

export type HubWishlistItem = {
  id: string;
  title: string;
  description: string | null;
  media_url: string | null;
  status: "open" | "fulfilled";
  created_by: string;
  author_name: string;
  fulfilled_by_name: string | null;
};

export type HubTierChallenge = {
  id: string;
  tier_list_url: string;
  tier_list_title: string;
  status: "pending" | "completed";
  challenger_name: string;
  target_user_id: string;
  result_image_url: string | null;
  created_at: string;
};

export type HubPartnerFact = {
  id: string;
  trait: string;
  description: string;
  author_name: string;
};

export type HubGalleryItem = {
  id: string;
  media_url: string;
  caption: string | null;
  author_name: string;
  created_at: string;
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

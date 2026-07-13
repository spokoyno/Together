export type MoodLevel = "great" | "good" | "neutral" | "low" | "hard";
export type PlanStatus = "active" | "completed" | "cancelled";

export type ProfileSummary = {
  id: string;
  display_name: string;
};

export type CoupleContext = {
  coupleId: string;
  relationshipStartedOn: string | null;
  members: ProfileSummary[];
  partner: ProfileSummary | null;
  isComplete: boolean;
};

export type ActionResult = {
  ok: boolean;
  error?: string;
};

export type ChatSendStatus = "sending" | "failed";

export type ChatMessage = {
  id: string;
  coupleId: string;
  senderId: string;
  senderName: string;
  body: string | null;
  imagePath: string | null;
  imageUrl: string | null;
  createdAt: string;
  clientId?: string;
  sendStatus?: ChatSendStatus;
};

export type MomentType = "memory" | "movie" | "cooking" | "photo";

export type MomentMeta = {
  movieId?: number;
  movieTitle?: string;
  posterPath?: string | null;
  ratings?: Record<string, number>;
  caption?: string;
};

export type ChatSavedMessage = ChatMessage & {
  savedAt: string;
};

export type ChatNote = {
  id: string;
  coupleId: string;
  messageId: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
  linkedMessage: ChatMessage | null;
};

export type ThemePreference = "light" | "dark";

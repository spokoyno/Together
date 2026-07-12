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

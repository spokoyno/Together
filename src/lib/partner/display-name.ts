export function resolvePartnerDisplayName(
  displayName: string,
  nickname: string | null | undefined,
): string {
  const trimmed = nickname?.trim();
  return trimmed || displayName;
}

import { getVapidPublicKey } from "@/lib/push/web-push";

export type PushServerConfig = {
  vapidPublicKey: string | null;
  vapidConfigured: boolean;
  serviceRoleConfigured: boolean;
  serverReady: boolean;
};

export function getPushServerConfig(): PushServerConfig {
  const vapidPublicKey = getVapidPublicKey();
  const vapidConfigured = Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY,
  );
  const serviceRoleConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  return {
    vapidPublicKey,
    vapidConfigured,
    serviceRoleConfigured,
    serverReady: vapidConfigured && serviceRoleConfigured,
  };
}

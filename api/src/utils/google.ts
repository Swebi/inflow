import { google, calendar_v3, tasks_v1, gmail_v1 } from "googleapis";
import { GOOGLE_SCOPES } from "../constants/google";

export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URL
);

export function getAuthUrl(state?: string) {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: GOOGLE_SCOPES,
    prompt: "consent",
    ...(state ? { state } : {}),
  });
}

export async function getTokensFromCode(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function getUserInfo(accessToken: string) {
  const authClient = new google.auth.OAuth2();
  authClient.setCredentials({ access_token: accessToken });

  const oauth2 = google.oauth2({
    version: "v2",
    auth: authClient,
  });

  const { data } = await oauth2.userinfo.get();
  return data;
}

export function createAuthClient(
  accessToken: string,
  refreshToken?: string | null,
  expiryDate?: Date | null
) {
  const authClient = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  authClient.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken ?? undefined,
    expiry_date: expiryDate ? expiryDate.getTime() : undefined,
  });
  return authClient;
}

export function getCalendarClient(
  accessToken: string,
  refreshToken?: string | null,
  expiryDate?: Date | null
): calendar_v3.Calendar {
  return google.calendar({
    version: "v3",
    auth: createAuthClient(accessToken, refreshToken, expiryDate),
  });
}

export function getTasksClient(
  accessToken: string,
  refreshToken?: string | null,
  expiryDate?: Date | null
): tasks_v1.Tasks {
  return google.tasks({
    version: "v1",
    auth: createAuthClient(accessToken, refreshToken, expiryDate),
  });
}

export function getGmailClient(
  accessToken: string,
  refreshToken?: string | null,
  expiryDate?: Date | null
): gmail_v1.Gmail {
  return google.gmail({
    version: "v1",
    auth: createAuthClient(accessToken, refreshToken, expiryDate),
  });
}

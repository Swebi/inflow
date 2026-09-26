import { google, calendar_v3, tasks_v1, gmail_v1 } from "googleapis";
import { GOOGLE_SCOPES } from "../constants/google";
import { prisma } from "../lib/prisma";

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
  expiryDate?: Date | null,
  userId?: string
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

  // google-auth-library transparently refreshes an expired access token as
  // long as it has a refresh token. That refresh only lives in memory for
  // this client instance unless we persist it — without this listener the
  // stored access token stays stale forever and every call forces a token
  // round-trip. Fires on refresh (and on the rare rotated refresh token).
  if (userId) {
    authClient.on("tokens", (tokens) => {
      prisma.user
        .update({
          where: { id: userId },
          data: {
            ...(tokens.access_token
              ? { googleAccessToken: tokens.access_token }
              : {}),
            ...(tokens.refresh_token
              ? { googleRefreshToken: tokens.refresh_token }
              : {}),
            ...(tokens.expiry_date
              ? { googleTokenExpiry: new Date(tokens.expiry_date) }
              : {}),
          },
        })
        .catch((error) => {
          console.error("Failed to persist refreshed Google tokens", {
            userId,
            error,
          });
        });
    });
  }

  return authClient;
}

export function getCalendarClient(
  accessToken: string,
  refreshToken?: string | null,
  expiryDate?: Date | null,
  userId?: string
): calendar_v3.Calendar {
  return google.calendar({
    version: "v3",
    auth: createAuthClient(accessToken, refreshToken, expiryDate, userId),
  });
}

export function getTasksClient(
  accessToken: string,
  refreshToken?: string | null,
  expiryDate?: Date | null,
  userId?: string
): tasks_v1.Tasks {
  return google.tasks({
    version: "v1",
    auth: createAuthClient(accessToken, refreshToken, expiryDate, userId),
  });
}

export function getGmailClient(
  accessToken: string,
  refreshToken?: string | null,
  expiryDate?: Date | null,
  userId?: string
): gmail_v1.Gmail {
  return google.gmail({
    version: "v1",
    auth: createAuthClient(accessToken, refreshToken, expiryDate, userId),
  });
}

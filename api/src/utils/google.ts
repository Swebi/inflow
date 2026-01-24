import { google, calendar_v3 } from "googleapis";
import { GOOGLE_SCOPES } from "../constants/google";

export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URL
);

export function getAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: GOOGLE_SCOPES,
    prompt: "consent",
  });
}

export async function getTokensFromCode(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export function setCredentials(tokens: {
  access_token?: string | null;
  refresh_token?: string | null;
}) {
  oauth2Client.setCredentials(tokens);
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

export function createAuthClient(accessToken: string) {
  const authClient = new google.auth.OAuth2();
  authClient.setCredentials({ access_token: accessToken });
  return authClient;
}

export function getCalendarClient(accessToken: string): calendar_v3.Calendar {
  return google.calendar({
    version: "v3",
    auth: createAuthClient(accessToken),
  });
}

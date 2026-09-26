import { getAuthUrl, getTokensFromCode, getUserInfo } from "../utils/google";
import { prisma } from "../lib/prisma";
import { AppError } from "../types/schema";

export const handleGetAuthUrl = (userId: string) => {
  return getAuthUrl(userId);
};

export const handleGoogleCallback = async (code: string, userId: string) => {
  const tokens = await getTokensFromCode(code);

  await prisma.user.update({
    where: { id: userId },
    data: {
      googleAccessToken: tokens.access_token,
      ...(tokens.refresh_token
        ? { googleRefreshToken: tokens.refresh_token }
        : {}),
      googleTokenExpiry: tokens.expiry_date
        ? new Date(tokens.expiry_date)
        : undefined,
    },
  });

  return tokens;
};

export const handleGetGoogleUserInfo = async (accessToken: string) => {
  return getUserInfo(accessToken);
};

export const handleDisconnectGoogle = async (userId: string) => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      googleAccessToken: null,
      googleRefreshToken: null,
      googleTokenExpiry: null,
    },
  });
};

export const handleGetGoogleStatus = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { googleRefreshToken: true, googleAccessToken: true },
  });

  return {
    connected: !!(user?.googleRefreshToken || user?.googleAccessToken),
  };
};

// Google returns `invalid_grant` when the refresh token itself is dead
// (user revoked access, token expired, or too many tokens issued). No
// amount of auto-refresh recovers from this — the user must reconnect.
export const isInvalidGrantError = (error: any): boolean => {
  const payload = error?.response?.data?.error ?? error?.message;
  return (
    payload === "invalid_grant" ||
    /invalid_grant/.test(String(error?.message ?? ""))
  );
};

// Clears the stored Google credentials so the scan job stops retrying this
// user every 10 minutes and `handleGetGoogleStatus` reports disconnected,
// which is what the UI keys off to prompt a reconnect.
export const handleClearRevokedGoogleTokens = async (userId: string) => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      googleAccessToken: null,
      googleRefreshToken: null,
      googleTokenExpiry: null,
    },
  });
  console.warn(
    `[google] cleared revoked tokens for user ${userId}; reconnect required`
  );
};

export const handleGetValidGoogleTokens = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      googleAccessToken: true,
      googleRefreshToken: true,
      googleTokenExpiry: true,
    },
  });

  if (!user?.googleAccessToken && !user?.googleRefreshToken) {
    throw { statusCode: 403, message: "Google account not connected" } as AppError;
  }

  return {
    accessToken: user.googleAccessToken!,
    refreshToken: user.googleRefreshToken,
    expiryDate: user.googleTokenExpiry,
  };
};

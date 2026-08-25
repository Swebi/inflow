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

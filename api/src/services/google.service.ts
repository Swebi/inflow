import { getAuthUrl, getTokensFromCode, getUserInfo } from "../utils/google";
import { prisma } from "../lib/prisma";

export const googleService = {
  getAuthUrl: (userId: string) => {
    return getAuthUrl(userId);
  },

  handleCallback: async (code: string, userId: string) => {
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
  },

  getUserInfo: async (accessToken: string) => {
    return getUserInfo(accessToken);
  },

  getStatus: async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { googleRefreshToken: true, googleAccessToken: true },
    });

    return {
      connected: !!(user?.googleRefreshToken || user?.googleAccessToken),
    };
  },

  getValidTokens: async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiry: true,
      },
    });

    if (!user?.googleAccessToken && !user?.googleRefreshToken) {
      throw new Error("Google account not connected");
    }

    return {
      accessToken: user.googleAccessToken!,
      refreshToken: user.googleRefreshToken,
      expiryDate: user.googleTokenExpiry,
    };
  },
};

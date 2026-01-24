import {
  getAuthUrl,
  getTokensFromCode,
  getUserInfo,
} from "../utils/google";

export const googleService = {
  getAuthUrl: () => {
    return getAuthUrl();
  },

  exchangeCodeForTokens: async (code: string) => {
    const tokens = await getTokensFromCode(code);
    return tokens;
  },

  getUserInfo: async (accessToken: string) => {
    const userInfo = await getUserInfo(accessToken);
    return userInfo;
  },
};

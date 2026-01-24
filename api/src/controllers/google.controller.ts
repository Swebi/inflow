import { Request, Response } from "express";
import { googleService } from "../services/google.service";

export const googleController = {
  getAuthUrl: async (req: Request, res: Response) => {
    try {
      const authUrl = googleService.getAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      console.error("Error generating auth URL:", error);
      res.status(500).json({
        error: "Failed to generate authorization URL",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  handleCallback: async (req: Request, res: Response) => {
    try {
      const { code } = req.body;

      if (!code || typeof code !== "string") {
        return res.status(400).json({
          error: "Authorization code is required",
        });
      }

      const tokens = await googleService.exchangeCodeForTokens(code);
      res.json(tokens);
    } catch (error) {
      console.error("Error exchanging code for tokens:", error);
      res.status(500).json({
        error: "Failed to exchange authorization code",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  getUserInfo: async (req: Request, res: Response) => {
    try {
      const accessToken = req.headers.authorization?.replace("Bearer ", "");

      if (!accessToken) {
        return res.status(401).json({
          error: "Access token is required",
        });
      }

      const userInfo = await googleService.getUserInfo(accessToken);
      res.json(userInfo);
    } catch (error) {
      console.error("Error getting user info:", error);
      res.status(500).json({
        error: "Failed to get user info",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
};

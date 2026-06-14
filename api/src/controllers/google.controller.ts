import { Request, Response, NextFunction } from "express";
import { googleService } from "../services/google.service";

export const googleController = {
  getAuthUrl: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authUrl = googleService.getAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      next(error);
    }
  },

  handleCallback: async (req: Request, res: Response, next: NextFunction) => {
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
      next(error);
    }
  },

  getUserInfo: async (req: Request, res: Response, next: NextFunction) => {
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
      next(error);
    }
  },
};

import { Request, Response, NextFunction } from "express";
import { getTokensFromCode } from "../utils/google";
import { googleService } from "../services/google.service";
import { AuthRequest } from "../types/schema";

export const googleController = {
  getAuthUrl: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
      const authUrl = googleService.getAuthUrl(req.user.userId);
      res.json({ authUrl });
    } catch (error) {
      next(error);
    }
  },

  // Legacy POST endpoint kept for when a web frontend captures the code
  handleCallback: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code } = req.body;
      if (!code || typeof code !== "string") {
        res.status(400).json({ error: "Authorization code is required" });
        return;
      }
      const tokens = await getTokensFromCode(code);
      res.json(tokens);
    } catch (error) {
      next(error);
    }
  },

  // GET handler for the actual Google OAuth redirect
  handleOAuthCallback: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code, state, error: oauthError } = req.query;

      if (oauthError) {
        res.send(buildCallbackPage(false, String(oauthError)));
        return;
      }

      if (!code || typeof code !== "string") {
        res.status(400).send("Missing authorization code");
        return;
      }

      if (!state || typeof state !== "string") {
        res.status(400).send("Missing state (user ID)");
        return;
      }

      await googleService.handleCallback(code, state);
      res.send(buildCallbackPage(true));
    } catch (error) {
      next(error);
    }
  },

  getStatus: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }
      const status = await googleService.getStatus(req.user.userId);
      res.json(status);
    } catch (error) {
      next(error);
    }
  },

  getUserInfo: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accessToken = req.headers.authorization?.replace("Bearer ", "");
      if (!accessToken) {
        res.status(401).json({ error: "Access token is required" });
        return;
      }
      const userInfo = await googleService.getUserInfo(accessToken);
      res.json(userInfo);
    } catch (error) {
      next(error);
    }
  },
};

function buildCallbackPage(success: boolean, errorMsg?: string) {
  const message = success
    ? "Google account connected successfully! You can close this tab."
    : `Authorization failed: ${errorMsg ?? "Unknown error"}`;

  return `<!DOCTYPE html>
<html>
<head>
  <title>${success ? "Connected" : "Error"}</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; }
    .card { text-align: center; padding: 2rem; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 360px; }
    h2 { color: ${success ? "#16a34a" : "#dc2626"}; margin: 0 0 1rem; }
    p { color: #64748b; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <h2>${success ? "&#x2713; Connected" : "&#x2717; Error"}</h2>
    <p>${message}</p>
  </div>
</body>
</html>`;
}

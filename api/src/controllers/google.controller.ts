import { Request, Response, NextFunction } from "express";
import { getTokensFromCode } from "../utils/google";
import {
  handleGetAuthUrl,
  handleGoogleCallback,
  handleGetGoogleStatus,
  handleGetGoogleUserInfo,
} from "../services/google.service";
import { AuthRequest, AppError } from "../types/schema";

export const getAuthUrl = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw { statusCode: 401, message: "Unauthorized" } as AppError;
    }

    const authUrl = handleGetAuthUrl(req.user.userId);

    res.status(200).json({
      success: true,
      message: "Auth URL generated",
      data: { authUrl },
    });
  } catch (error) {
    next(error);
  }
};

// Legacy POST endpoint kept for when a web frontend captures the code
export const handleCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== "string") {
      throw { statusCode: 400, message: "Authorization code is required" } as AppError;
    }

    const data = await getTokensFromCode(code);

    res.status(200).json({
      success: true,
      message: "Authorization code exchanged",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// GET handler for the actual Google OAuth redirect
export const handleOAuthCallback = async (req: Request, res: Response, next: NextFunction) => {
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

    await handleGoogleCallback(code, state);
    res.send(buildCallbackPage(true));
  } catch (error) {
    next(error);
  }
};

export const getStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw { statusCode: 401, message: "Unauthorized" } as AppError;
    }

    const data = await handleGetGoogleStatus(req.user.userId);

    res.status(200).json({
      success: true,
      message: "Google status fetched",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accessToken = req.headers.authorization?.replace("Bearer ", "");
    if (!accessToken) {
      throw { statusCode: 401, message: "Access token is required" } as AppError;
    }

    const data = await handleGetGoogleUserInfo(accessToken);

    res.status(200).json({
      success: true,
      message: "User info fetched",
      data,
    });
  } catch (error) {
    next(error);
  }
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

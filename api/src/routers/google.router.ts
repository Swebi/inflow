import { Router } from "express";
import {
  getAuthUrl,
  handleCallback,
  handleOAuthCallback,
  getStatus,
  getUserInfo,
  disconnect,
} from "../controllers/google.controller";
import { authMiddleware } from "../middlewares/auth";

export const googleRouter = Router();

googleRouter.get("/auth", authMiddleware, getAuthUrl);
googleRouter.post("/auth/callback", handleCallback);
googleRouter.get("/callback", handleOAuthCallback);
googleRouter.get("/status", authMiddleware, getStatus);
googleRouter.get("/user", getUserInfo);
googleRouter.post("/disconnect", authMiddleware, disconnect);

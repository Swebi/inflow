import { Router } from "express";
import { googleController } from "../controllers/google.controller";
import { authMiddleware } from "../middlewares/auth";

export const googleRouter = Router();

googleRouter.get("/auth", authMiddleware, googleController.getAuthUrl);
googleRouter.post("/auth/callback", googleController.handleCallback);
googleRouter.get("/callback", googleController.handleOAuthCallback);
googleRouter.get("/status", authMiddleware, googleController.getStatus);
googleRouter.get("/user", googleController.getUserInfo);

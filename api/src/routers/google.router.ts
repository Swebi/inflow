import { Router } from "express";
import { googleController } from "../controllers/google.controller";

export const googleRouter = Router();

googleRouter.get("/auth", googleController.getAuthUrl);
googleRouter.post("/auth/callback", googleController.handleCallback);
googleRouter.get("/user", googleController.getUserInfo);

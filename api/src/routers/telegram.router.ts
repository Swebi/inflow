import { Router } from "express";
import { getLinkToken } from "../controllers/telegram.controller";
import { authMiddleware } from "../middlewares/auth";

export const telegramRouter = Router();

telegramRouter.use(authMiddleware);
telegramRouter.get("/link", getLinkToken);

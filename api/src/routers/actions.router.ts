import { Router } from "express";
import { listRecentActions } from "../controllers/actions.controller";
import { authMiddleware } from "../middlewares/auth";

export const actionsRouter = Router();

actionsRouter.use(authMiddleware);
actionsRouter.get("/", listRecentActions);

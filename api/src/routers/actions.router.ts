import { Router } from "express";
import { listRecentActions, approveAction, rejectAction } from "../controllers/actions.controller";
import { authMiddleware } from "../middlewares/auth";

export const actionsRouter = Router();

actionsRouter.use(authMiddleware);
actionsRouter.get("/", listRecentActions);
actionsRouter.post("/:id/approve", approveAction);
actionsRouter.post("/:id/reject", rejectAction);
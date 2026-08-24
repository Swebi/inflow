import { Router } from "express";
import { scanNow } from "../controllers/agent.controller";
import { authMiddleware } from "../middlewares/auth";

export const agentRouter = Router();
agentRouter.use(authMiddleware);
agentRouter.post("/scan", scanNow);

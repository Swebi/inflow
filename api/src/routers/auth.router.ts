import { Router } from "express";
import { register, login, me, changePassword } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", authMiddleware, me);
authRouter.post("/change-password", authMiddleware, changePassword);

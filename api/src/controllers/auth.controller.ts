import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { AuthRequest } from "../types/schema";

export const authController = {
  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }
      const result = await authService.register(email, password, name);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof Error && error.message === "User already exists") {
        return res.status(409).json({ error: error.message });
      }
      next(error);
    }
  },

  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }
      const result = await authService.login(email, password);
      res.json(result);
    } catch (error) {
      if (error instanceof Error && error.message === "Invalid credentials") {
        return res.status(401).json({ error: error.message });
      }
      next(error);
    }
  },

  me: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const user = await authService.getMe(req.user.userId);
      res.json(user);
    } catch (error) {
      if (error instanceof Error && error.message === "User not found") {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  },
};

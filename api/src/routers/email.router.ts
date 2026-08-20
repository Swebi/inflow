import { Router } from "express";
import { processEmail } from "../controllers/email.controller";

export const emailRouter = Router();

emailRouter.post("/process", processEmail);

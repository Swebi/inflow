import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { AppError } from "../types/schema";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export const handleRegister = async (email: string, password: string, name?: string) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw { statusCode: 409, message: "User already exists" } as AppError;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashedPassword, name },
  });

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "7d",
  });

  return { user: { id: user.id, email: user.email, name: user.name }, token };
};

export const handleLogin = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw { statusCode: 401, message: "Invalid credentials" } as AppError;
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw { statusCode: 401, message: "Invalid credentials" } as AppError;
  }

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "7d",
  });

  return { user: { id: user.id, email: user.email, name: user.name }, token };
};

export const handleVerifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
};

export const handleGetMe = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw { statusCode: 404, message: "User not found" } as AppError;
  }

  return { id: user.id, email: user.email, name: user.name };
};

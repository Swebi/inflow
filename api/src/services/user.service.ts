import { prisma } from "../lib/prisma";
import { CreateUserData, UpdateUserData } from "../types/schema";

export const userService = {
  getAll: async () => {
    return await prisma.user.findMany();
  },

  getById: async (id: string) => {
    return await prisma.user.findUnique({
      where: { id },
    });
  },

  create: async (data: CreateUserData) => {
    return await prisma.user.create({
      data,
    });
  },

  update: async (id: string, data: UpdateUserData) => {
    return await prisma.user.update({
      where: { id },
      data,
    });
  },

  delete: async (id: string) => {
    return await prisma.user.delete({
      where: { id },
    });
  },
};

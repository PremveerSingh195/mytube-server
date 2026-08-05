import { prisma } from "../config/prisma.js";

export const findByEmail = async (email) => {
  return await prisma.user.findUnique({
    where: {
      email,
    },
  });
};

export const create = async (data) => {
  return await prisma.user.create({ data });
};

export const updatedGoogleId = async (id, googleId) => {
  return prisma.user.update({
    where: {
      id,
    },
    data: {
      googleId,
      provider: "GOOGLE",
    },
  });
};

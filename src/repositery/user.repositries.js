import { prisma } from "../config/prisma.js";

export const findByEmail = async (email) => {
  return await prisma.user.findUnique({
    where: {
      email,
    },
    include: {
      channel: true,
    },
  });
};

export const create = async (data) => {
  return await prisma.user.create({
    data,
    include: {
      channel: true,
    },
  });
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
    include: {
      channel: true,
    },
  });
};

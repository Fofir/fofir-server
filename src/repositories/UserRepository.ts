import { PrismaClient } from "@prisma/client";

export default class UserRepository {
  prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }
}

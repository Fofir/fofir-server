import { ResponseToolkit } from "@hapi/hapi";
import { conflict, unauthorized } from "@hapi/boom";
import bcrypt from "bcrypt";
import { hashPassword } from "../../authUtils";
import { IRequest } from "../../interfaces";
import { omit } from "lodash";

export const getProfile = async (request: IRequest, h: ResponseToolkit) => {
  const {
    server: {
      app: { prisma },
    },
    auth: { credentials },
  } = request;

  const user = await prisma.user.findUnique({
    where: {
      id: credentials.userId,
    },
  });

  if (!user) {
    return unauthorized();
  }

  return omit(user, ["hashedPassword"]);
};

export const register = async (request: IRequest, h: ResponseToolkit) => {
  const { payload, server } = request;

  const { username, password } = payload as {
    username: string;
    password: string;
  };

  const existingUser = await server.app.prisma.user.findUnique({
    where: {
      username,
    },
  });

  if (existingUser) {
    throw conflict("Username already registered");
  }

  try {
    const user = await server.app.prisma.user.create({
      data: { username, hashedPassword: await hashPassword(password) },
    });

    if (!user) {
      return unauthorized();
    }

    console.log("setting cookie");
    request.cookieAuth.set({ id: user.id });
    return h.response(user).code(201);
  } catch (err: any) {
    return unauthorized(err.message);
  }
};

export const login = async (request: IRequest, h: ResponseToolkit) => {
  const { payload } = request;

  const { username, password } = payload as {
    username: string;
    password: string;
  };

  if (!username || !password) {
    return unauthorized();
  }

  try {
    const user = await request.server.app.prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (!user || !user.hashedPassword) {
      return unauthorized();
    }

    bcrypt.compare(password, user.hashedPassword);
    console.log("setting cookie");

    request.cookieAuth.set({ id: user.id });
    return h.response(user);
  } catch (err: any) {
    return unauthorized(err.message);
  }
};

export const logout = async (request: IRequest) => {
  const { cookieAuth } = request;

  cookieAuth.clear();
  return {};
};

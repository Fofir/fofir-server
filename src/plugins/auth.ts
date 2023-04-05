import Hapi from "@hapi/hapi";
import Joi from "joi";
import { IRequest } from "../interfaces";

declare module "@hapi/hapi" {
  interface AuthCredentials {
    userId: string;
  }

  interface ServerApplicationState {}
}

interface AuthPluginOptions {
  cookieName: string;
  cookiePassword: string;
  isCookieSecure: boolean;
  isCookieSameSite: boolean;
  taskAuthenticationToken: string;
}

const authPluginOptionsSchema = Joi.object({
  cookieName: Joi.string().required(),
  cookiePassword: Joi.string().length(32).required(),
  isCookieSecure: Joi.boolean().default(true),
  isCookieSameSite: Joi.boolean().required(),
});

const authPlugin: Hapi.Plugin<AuthPluginOptions> = {
  name: "auth",
  dependencies: [],
  register: async function (server: Hapi.Server, options) {
    authPluginOptionsSchema.validateAsync(options);
    const { cookieName, cookiePassword, isCookieSecure, isCookieSameSite } =
      options;

    server.auth.strategy("session", "cookie", {
      cookie: {
        name: cookieName,
        password: cookiePassword,
        isSecure: true,
        ttl: 7 * 24 * 60 * 60 * 1000, // a week
        isHttpOnly: true,
        path: "/",
        isSameSite: isCookieSameSite ? "Strict" : "None",
      },
      validate: async (request: IRequest, session: object | undefined) => {
        if (!session) {
          return { isValid: false };
        }
        const user = await request.server.app.prisma.user.findUnique({
          where: {
            id: (session as { id: string }).id,
          },
        });

        if (!user) {
          return { isValid: false };
        }

        return { isValid: true, credentials: { userId: user.id } };
      },
    });

    server.auth.default("session");
  },
};

export default authPlugin;

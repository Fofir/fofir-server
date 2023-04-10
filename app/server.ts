import Hapi, { Server } from "@hapi/hapi";
import hapiCookie from "@hapi/cookie";
import prismaPlugin from "../src/plugins/prisma";
import socketPlugin from "../src/plugins/socket";
import config, { nodeEnv } from "../config";
import servicesPlugin from "../src/plugins/services";
import path from "path";
import authPlugin from "../src/plugins/auth";
import jobsApi from "../src/api/jobs";
import authApi from "../src/api/auth";
import HapiCron from "hapi-cron";
import { Server as SocketServer } from "socket.io";

const printServerRoutes = (server: Server) => {
  console.log("==> Server routes");
  server.table().forEach((route) => {
    const routeTitle = `${route.method.toUpperCase()} ${route.path}`;
    console.log("   *", routeTitle);
  });
};

declare module "@hapi/hapi" {
  interface ServerApplicationState {
    io: SocketServer;
  }
}

const server: Hapi.Server = Hapi.server({
  port: config.port,
  host: config.host,
  debug: config.debug ? { request: ["error"], log: ["error"] } : false,
  routes: {
    files: {
      relativeTo: path.join(__dirname, "../public"),
    },
    cors: {
      origin: ["*"],
      credentials: true,
      additionalHeaders: [
        "cache-control",
        "x-requested-with",
        "Access-Control-Allow-Origin",
      ],
    },
  },
});

export async function createServer(): Promise<Hapi.Server> {
  const dbString = config.db;

  if (!dbString) {
    throw new Error("Missing DB connection string");
  }

  if (config.rollbarToken && config.isRollbarEnabled) {
    console.log(config.rollbarToken);
    console.log("==> Rollbar enabled");
    const rollbarOptions = {
      accessToken: config.rollbarToken,
      captureEmail: false,
      enabled: true,
      captureUncaught: true,
      captureUnhandledRejections: true,
      omittedResponseCodes: [400, 401, 404, 409],
      environment: nodeEnv,
    };
    await server.register({
      plugin: require("@goodwaygroup/lib-hapi-rollbar"),
      options: rollbarOptions,
    });
  } else {
    // passthru helper method to clean up code when rollbar is not configured
    server.decorate("request", "sendRollbarMessage", () => {});
  }

  await server.register({
    plugin: HapiCron,
    options: {
      jobs: [
        {
          name: "nadlan-all",
          time: "0 10 * * *", // Every day at 10am
          timezone: "Europe/Athens",
          request: {
            method: "POST",
            url: "/jobs/nadlan/all",
          },
        },
      ],
    },
  });

  await server.register([
    { plugin: hapiCookie },
    { plugin: prismaPlugin, options: { db: dbString } },
    {
      plugin: socketPlugin,
      options: {
        allowedOrigin: config.allowedOrigin,
      },
    },
    {
      plugin: authPlugin,
      options: {
        cookieName: config.cookieName,
        cookiePassword: config.cookiePassword,
        isCookieSecure: config.isCookieSecure,
        isCookieSameSite: config.isCookieSameSite,
      },
    },
    {
      plugin: servicesPlugin,
    },
    {
      plugin: authApi,
    },
    {
      plugin: jobsApi,
    },
  ]);

  server.route([
    {
      method: "GET",
      path: "/health",
      options: {
        auth: false,
      },
      handler: async (_request, h) => {
        return h
          .response({
            healthy: true,
          })
          .code(200);
      },
    },
  ]);

  await server.initialize();
  if (nodeEnv === "development") {
    printServerRoutes(server);
  }
  return server;
}

export async function startServer(server: Hapi.Server): Promise<Hapi.Server> {
  await server.start();
  console.log("info", `Server running on ${server.info.uri}`);
  server.log("info", `Server running on ${server.info.uri}`);
  return server;
}

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

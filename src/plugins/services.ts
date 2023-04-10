import Hapi from "@hapi/hapi";
import UserService from "../services/UserService";
import UserRepository from "../repositories/UserRepository";
import StandardizedListingService from "../services/StandardizedListingService";

export type PluginInterface = {
  services: {
    user: UserService;
    standardizedListing: StandardizedListingService;
  };
};

const servicesPlugin: Hapi.Plugin<{}> = {
  name: "services",
  dependencies: ["prisma"],
  register: async function (server: Hapi.Server) {
    const prisma = server.app.prisma;

    server.expose({
      standardizedListing: new StandardizedListingService({
        prisma,
      }),
      user: new UserService({
        userRepository: new UserRepository({
          prisma,
        }),
      }),
    });
  },
};

export default servicesPlugin;

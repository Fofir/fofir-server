import Hapi from "@hapi/hapi";
import UserService from "../services/UserService";
import UserRepository from "../repositories/UserRepository";

export type PluginInterface = {
  services: {
    user: UserService;
  };
};

const servicesPlugin: Hapi.Plugin<{}> = {
  name: "services",
  dependencies: ["prisma"],
  register: async function (server: Hapi.Server) {
    const prisma = server.app.prisma;

    server.expose({
      user: new UserService({
        userRepository: new UserRepository({
          prisma,
        }),
      }),
    });
  },
};

export default servicesPlugin;

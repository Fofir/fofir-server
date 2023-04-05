import Hapi from "@hapi/hapi";
import {
  register as registerHandler,
  login,
  getProfile,
  logout,
} from "./handlers";

const register = async function (server: Hapi.Server) {
  server.route([
    {
      method: "get",
      path: "/auth/profile",
      options: {
        auth: "session",
        tags: ["api"],
        handler: getProfile,
      },
    },
    {
      method: "POST",
      path: "/auth/register",
      options: {
        auth: false,
        tags: ["api"],
        handler: registerHandler,
      },
    },
    {
      method: "POST",
      path: "/auth/login",
      options: {
        auth: false,
        tags: ["api"],
        handler: login,
      },
    },
    {
      method: "DELETE",
      path: "/auth/logout",
      options: {
        auth: "session",
        tags: ["api"],
        handler: logout,
      },
    },
  ]);
};

const authApiPlugin = {
  register,
  name: "authApi",
};

export default authApiPlugin;

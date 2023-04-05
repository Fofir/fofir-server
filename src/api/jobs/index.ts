import Hapi from "@hapi/hapi";
import { example } from "./handlers";

const register = async function (server: Hapi.Server) {
  server.route([
    {
      method: "POST",
      path: "/jobs/example",
      options: {
        auth: false,
        tags: ["api", "jobs"],
        handler: example,
      },
    },
  ]);
};

const jobsApiPlugin = {
  register,
  name: "jobsApi",
};

export default jobsApiPlugin;
